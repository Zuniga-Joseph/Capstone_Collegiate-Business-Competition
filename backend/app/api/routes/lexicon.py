from datetime import datetime
from typing import Any
import uuid

from fastapi import APIRouter, HTTPException
from sqlmodel import select, func

from app.api.deps import SessionDep, CurrentUser

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

from app.models import (
    LexiconSuggestion,
    Message,
    BatchAnalysisRequest,
    BatchAnalysisResponse,
    PlayerAnalysis,
)
from app.crud import upsert_lexicon_suggestion
from app.NLTK.sentiment_individual_analysis import measure_constructs_from_text  # adjust this import path


router = APIRouter(prefix="/lexicon", tags=["lexicon"])


@router.get("/suggestions", response_model=list[LexiconSuggestion])
def get_suggestions(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Retrieve unapproved & unrejected lexicon suggestions.
    Only superusers can view all suggestions.
    """

    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")

    count_statement = (
        select(func.count())
        .select_from(LexiconSuggestion)
        .where(LexiconSuggestion.approved == False)
        .where(LexiconSuggestion.rejected == False)
    )
    count = session.exec(count_statement).one()

    statement = (
        select(LexiconSuggestion)
        .where(LexiconSuggestion.approved == False)
        .where(LexiconSuggestion.rejected == False)
        .offset(skip)
        .limit(limit)
    )
    suggestions = session.exec(statement).all()

    return suggestions


@router.post("/suggestions/{id}/approve", response_model=Message)
def approve_suggestion(
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID
) -> Any:
    """
    Approve a lexicon suggestion.
    """

    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")

    suggestion = session.get(LexiconSuggestion, id)
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    suggestion.approved = True
    suggestion.approved_at = datetime.utcnow()
    session.add(suggestion)
    session.commit()

    return Message(message="Suggestion approved")


@router.post("/suggestions/{id}/reject", response_model=Message)
def reject_suggestion(
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID
) -> Any:
    """
    Reject a lexicon suggestion.
    """

    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")

    suggestion = session.get(LexiconSuggestion, id)
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    suggestion.rejected = True
    session.add(suggestion)
    session.commit()

    return Message(message="Suggestion rejected")

@router.post("/suggestions/from-transcripts", response_model=list[LexiconSuggestion])
def generate_suggestions_from_transcripts(
    payload: TFIDFSuggestionRequest,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Analyze a batch of transcripts with TF-IDF, extract top candidate words,
    and insert/update lexicon suggestions in the database.

    Only superusers can call this, since it affects system-level lexicon state.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")

    texts = [t.text.strip() for t in payload.transcripts if t.text and t.text.strip()]
    if not texts:
        raise HTTPException(status_code=400, detail="No non-empty transcripts provided")

    # Build TF-IDF model over this batch
    vectorizer = TfidfVectorizer(
        lowercase=True,
        stop_words="english",
        token_pattern=r"[A-Za-z']+",
    )
    tfidf_matrix = vectorizer.fit_transform(texts)
    feature_names = np.array(vectorizer.get_feature_names_out())

    # Aggregate TF-IDF scores across all transcripts
    # Here we use max TF-IDF per term across documents,
    # but you could also use mean or sum.
    scores = tfidf_matrix.toarray()
    term_scores = scores.max(axis=0)

    # Determine how many terms to keep
    top_k = min(payload.top_k, len(feature_names))
    top_idxs = term_scores.argsort()[::-1][:top_k]

    suggestions: list[LexiconSuggestion] = []

    for idx in top_idxs:
        word = feature_names[idx]
        score = float(term_scores[idx])

        # Skip very short / junky tokens
        if len(word) < 3:
            continue

        # Frequency = how many docs contain this term
        freq = int((scores[:, idx] > 0).sum())

        suggestion = upsert_lexicon_suggestion(
            session=session,
            word=word,
            category=payload.category,
            dimension=payload.dimension,
            tfidf_score=score,
            frequency=freq,
        )
        suggestions.append(suggestion)

    return suggestions

@router.post("/analyze-with-tfidf", response_model=BatchAnalysisResponse)
def analyze_with_tfidf(
    payload: BatchAnalysisRequest,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Run per-player construct analysis AND generate TF-IDF-based lexicon suggestions
    in a single call.

    - Uses `measure_constructs_from_text` for per-player scores/features.
    - Uses TF-IDF across all transcripts to:
        * compute per-lexicon TF-IDF features for each player
        * upsert candidate lexicon words into `lexicon_suggestions`.
    """

    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")

    # 1) Prepare text corpus
    texts = [t.text.strip() for t in payload.transcripts if t.text and t.text.strip()]
    if not texts:
        raise HTTPException(status_code=400, detail="No non-empty transcripts provided")

    # Keep mapping index -> transcript_id so we can return it
    id_by_index = [t.id for t in payload.transcripts if t.text and t.text.strip()]

    # 2) TF-IDF over batch
    vectorizer = TfidfVectorizer(
        lowercase=True,
        stop_words="english",
        token_pattern=r"[A-Za-z']+",
    )
    tfidf_matrix = vectorizer.fit_transform(texts)
    feature_names = np.array(vectorizer.get_feature_names_out())
    vocab = vectorizer.vocabulary_

    scores_matrix = tfidf_matrix.toarray()

    # 3) Build per-player TF-IDF features for your constructs

    def lexicon_tfidf(row, lex):
        # sum TF-IDF over words from a given lexicon
        idxs = [vocab[w] for w in lex if w in vocab]
        if not idxs:
            return 0.0
        return float(row[idxs].sum())

    tfidf_feats_list: list[dict] = []
    from app.nlp.analysis import (
        LEX_SI_EMPATHY,
        LEX_SI_POLITE,
        LEX_MR_RESILIENCE,
        LEX_MR_CATASTROPHIZE,
        LEX_CG_GROWTH,
    )

    for row in scores_matrix:
        feats = {
            "si_empathy_tfidf": lexicon_tfidf(row, LEX_SI_EMPATHY),
            "si_polite_tfidf": lexicon_tfidf(row, LEX_SI_POLITE),
            "mr_resilience_tfidf": lexicon_tfidf(row, LEX_MR_RESILIENCE),
            "mr_catastrophize_tfidf": lexicon_tfidf(row, LEX_MR_CATASTROPHIZE),
            "cg_growth_tfidf": lexicon_tfidf(row, LEX_CG_GROWTH),
        }
        tfidf_feats_list.append(feats)

    # 4) Generate lexicon suggestions from aggregated TF-IDF

    # aggregate by max TF-IDF across docs
    term_scores = scores_matrix.max(axis=0)
    top_k = min(payload.top_k, len(feature_names))
    top_idxs = term_scores.argsort()[::-1][:top_k]

    suggestions: list[LexiconSuggestion] = []

    for idx in top_idxs:
        word = feature_names[idx]
        score = float(term_scores[idx])

        if len(word) < 3:
            continue

        freq = int((scores_matrix[:, idx] > 0).sum())

        suggestion = upsert_lexicon_suggestion(
            session=session,
            word=word,
            category=payload.category,
            dimension=payload.dimension,
            tfidf_score=score,
            frequency=freq,
        )
        suggestions.append(suggestion)

    # 5) Run your existing sentiment/construct analysis per player

    players: list[PlayerAnalysis] = []
    for i, text in enumerate(texts):
        res = measure_constructs_from_text(text, tfidf_feats=tfidf_feats_list[i])

        players.append(
            PlayerAnalysis(
                index=i,
                transcript_id=id_by_index[i],
                scores=res["scores"],
                features=res["features"],
            )
        )

    # 6) Return combined result
    return BatchAnalysisResponse(
        players=players,
        suggestions=suggestions,
    )
