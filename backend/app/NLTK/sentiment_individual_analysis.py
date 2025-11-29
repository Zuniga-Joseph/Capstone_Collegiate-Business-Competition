from nltk import sent_tokenize, word_tokenize, pos_tag
from nltk.sentiment import SentimentIntensityAnalyzer
import nltk, re

# ------------ NLTK bootstrap ------------
def _ensure_nltk_data():
    needed = [
        "punkt",
        "punkt_tab",
        "vader_lexicon",
        "averaged_perceptron_tagger",
        "averaged_perceptron_tagger_eng",
    ]
    resource_map = {
        "punkt": "tokenizers/punkt",
        "punkt_tab": "tokenizers/punkt_tab",
        "vader_lexicon": "sentiment/vader_lexicon",
        "averaged_perceptron_tagger": "taggers/averaged_perceptron_tagger",
        "averaged_perceptron_tagger_eng": "taggers/averaged_perceptron_tagger_eng",
    }
    for pkg in needed:
        try:
            nltk.data.find(resource_map[pkg])
        except LookupError:
            try:
                nltk.download(pkg, quiet=True)
            except Exception:
                pass

_ensure_nltk_data()
sia = SentimentIntensityAnalyzer()

# ------------ Lexicons ------------
LEX_SI_EMPATHY = {
    "understand","empathize","appreciate","acknowledge","recognize",
    "thanks","thank","grateful","sorry","apologize","helpful","collaborate","team","together"
}
LEX_SI_POLITE = {"please","could","would","may","thanks","thank","appreciate"}

LEX_MR_RESILIENCE = {
    "resilient","persist","persevere","adapt","recover","bounce","iterate","retry",
    "try","improve","learned","overcome","cope","handled","grit","adjust"
}
LEX_MR_CATASTROPHIZE = {"never","impossible","hopeless","ruined","can’t","cant","cannot","failed","useless"}

LEX_CG_GROWTH = {
    "learn","learning","improve","improving","practice","practicing","feedback",
    "coach","coachable","mentor","iterate","yet","develop","growth","adjust","apply","document"
}
LEX_CG_ACCEPT = {
    "thanks for the feedback","i appreciate the feedback","i can apply","i’ll change","i will change",
    "i can improve","i will improve","good point","that helps","that’s helpful","that's helpful"
}

QUESTION_RE = re.compile(r'\?\s*$')
BUT_RE = re.compile(r'\b(but|however|yet)\b', re.I)
TIMESTAMP_RE = re.compile(r'\[?\(?\d{1,2}:\d{2}(?::\d{2})?\)?\]?\s*', re.I)

def clean_transcript(text: str) -> str:
    # remove timestamps like [00:00], 00:00, (00:00)
    return TIMESTAMP_RE.sub("", text).strip()

def normalize_density(count, total_tokens, per=1000):
    if total_tokens == 0: return 0.0
    return (count / total_tokens) * per

def ratio(a,b):
    return a/(b+1e-9)

def count_lexicon(tokens, lex):
    return sum(1 for t in tokens if t in lex)

def sentences(text: str):
    sents = []
    for s in sent_tokenize(text):
        toks = [t.lower() for t in word_tokenize(s)]
        pos_tags = pos_tag(toks)
        vs = sia.polarity_scores(s)["compound"]
        sents.append({"text": s, "tokens": toks, "pos": pos_tags, "compound": vs})
    return sents

def sentiment_flip_features(sents, window=2):
    flips = 0
    for i, s in enumerate(sents):
        if s["compound"] <= -0.3 and BUT_RE.search(s["text"]):
            for j in range(i+1, min(i+1+window, len(sents))):
                if sents[j]["compound"] >= 0.2:
                    flips += 1
                    break
    return flips

def question_rate(sents):
    qs = sum(1 for s in sents if QUESTION_RE.search(s["text"]))
    return qs / (len(sents) + 1e-9)

def modal_counts(pos):
    return sum(1 for (_,tag) in pos if tag == "MD")

def measure_constructs_from_text(text: str):
    """
    Strictly individual analysis:
      input: a single person's transcript (string)
      output: { "features": {...}, "scores": {...} }
    """
    text = clean_transcript(text)
    sents_list = sentences(text)
    all_tokens = [t for s in sents_list for t in s["tokens"]]
    all_pos = [p for s in sents_list for p in s["pos"]]
    N = len(all_tokens)

    # --- Social Intelligence ---
    si_empathy = count_lexicon(all_tokens, LEX_SI_EMPATHY)
    si_polite  = count_lexicon(all_tokens, LEX_SI_POLITE)
    you_ct = all_tokens.count("you") + all_tokens.count("your") + \
             all_tokens.count("y’all") + all_tokens.count("yall")
    we_ct  = all_tokens.count("we") + all_tokens.count("our") + all_tokens.count("us")
    i_ct   = all_tokens.count("i") + all_tokens.count("me") + all_tokens.count("my")
    ack_phrases = sum(
        1 for s in sents_list
        if re.search(r"\b(i see|makes sense|got it|good point|that’s helpful|that's helpful)\b",
                     s["text"].lower())
    )
    si_question_rate = question_rate(sents_list)

    feat_SI = {
        "lex_empathy_perk": normalize_density(si_empathy, N),
        "lex_polite_perk": normalize_density(si_polite, N),
        "you_we_to_i_ratio": ratio(you_ct + we_ct, i_ct),
        "acknowledgment_rate": ack_phrases / (len(sents_list)+1e-9),
        "question_rate": si_question_rate,
    }

    # --- Mental Resilience ---
    mr_res = count_lexicon(all_tokens, LEX_MR_RESILIENCE)
    mr_modals = modal_counts(all_pos)
    mr_cata = count_lexicon(all_tokens, LEX_MR_CATASTROPHIZE)
    mr_flips = sentiment_flip_features(sents_list)

    feat_MR = {
        "resilience_lex_perk": normalize_density(mr_res, N),
        "modal_rate_perk": normalize_density(mr_modals, N),
        "reappraisal_flips_per100s": (mr_flips / (len(sents_list)/100.0 + 1e-9)),
        "catastrophize_perk": normalize_density(mr_cata, N)
    }

    # --- Coachability & Growth ---
    cg_growth = count_lexicon(all_tokens, LEX_CG_GROWTH)
    cg_accept = sum(
        1 for s in sents_list
        if any(phrase in s["text"].lower() for phrase in LEX_CG_ACCEPT)
    )
    feedback_cues = [i for i,s in enumerate(sents_list) if "feedback" in s["text"].lower()]
    followup_q = sum(
        1 for i in feedback_cues
        if i+1 < len(sents_list) and QUESTION_RE.search(sents_list[i+1]["text"])
    )

    feat_CG = {
        "growth_lex_perk": normalize_density(cg_growth, N),
        "feedback_accept_rate": cg_accept / (len(sents_list)+1e-9),
        "clarify_after_feedback_rate": (
            followup_q / (len(feedback_cues)+1e-9) if feedback_cues else 0.0
        )
    }

    # --- Score mapping ---
    def to_100(x, scale=1.5):
        return max(0, min(100, 100 * (x/(x+scale)) if x>0 else 0))

    si_raw = (
        0.35*feat_SI["lex_empathy_perk"] +
        0.20*feat_SI["lex_polite_perk"] +
        0.20*feat_SI["acknowledgment_rate"] +
        0.15*feat_SI["question_rate"] +
        0.10*min(feat_SI["you_we_to_i_ratio"], 3.0)/3.0
    )
    mr_raw = (
        0.45*feat_MR["resilience_lex_perk"] +
        0.20*feat_MR["modal_rate_perk"] +
        0.25*feat_MR["reappraisal_flips_per100s"] -
        0.20*feat_MR["catastrophize_perk"]
    )
    cg_raw = (
        0.55*feat_CG["growth_lex_perk"] +
        0.25*feat_CG["feedback_accept_rate"] +
        0.20*feat_CG["clarify_after_feedback_rate"]
    )

    scores = {
        "social_intelligence": to_100(si_raw, scale=1.2),
        "mental_resilience":   to_100(mr_raw, scale=1.0),
        "coachability_growth": to_100(cg_raw, scale=1.0)
    }

    return {"features": {"SI": feat_SI, "MR": feat_MR, "CG": feat_CG},
            "scores": scores}
