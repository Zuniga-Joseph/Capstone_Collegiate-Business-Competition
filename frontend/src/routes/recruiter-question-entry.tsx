import { createFileRoute } from "@tanstack/react-router"
import { FormEvent, useState, ChangeEvent } from "react"

export const Route = createFileRoute("/recruiter-question-entry")({
  component: QuestionEntryPage,
})

type Difficulty = "easy" | "medium" | "hard"

interface AnswerOption {
  id: number
  text: string
  isCorrect: boolean
}

interface QuestionPayload {
  question_set_id: string
  question_text: string
  category: string
  difficulty: Difficulty
  options: { text: string; is_correct: boolean }[]
  explanation: string | null
}

function QuestionEntryPage() {
  // NEW: Question Set ID
  const [questionSetId, setQuestionSetId] = useState("")

  const [questionText, setQuestionText] = useState("")
  const [category, setCategory] = useState("")
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [options, setOptions] = useState<AnswerOption[]>([
    { id: 1, text: "", isCorrect: true },
    { id: 2, text: "", isCorrect: false },
    { id: 3, text: "", isCorrect: false },
    { id: 4, text: "", isCorrect: false },
  ])
  const [explanation, setExplanation] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // CSV state
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const [importedCount, setImportedCount] = useState<number | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  // questions waiting for confirmation
  const [pendingImportQuestions, setPendingImportQuestions] = useState<
    QuestionPayload[] | null
  >(null)

  const handleOptionTextChange = (id: number, value: string) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, text: value } : opt)),
    )
  }

  const handleSetCorrect = (id: number) => {
    setOptions((prev) =>
      prev.map((opt) => ({ ...opt, isCorrect: opt.id === id })),
    )
  }

  const validateForm = (): string | null => {
    if (!questionSetId.trim()) return "Question Set ID is required."
    if (!questionText.trim()) return "Question text is required."
    if (!category.trim()) return "Category is required."

    const nonEmptyOptions = options.filter((opt) => opt.text.trim())
    if (nonEmptyOptions.length !== 4) {
      return "All four answer options must be filled in."
    }

    const correct = options.filter(
      (opt) => opt.isCorrect && opt.text.trim(),
    )
    if (correct.length !== 1) {
      return "Exactly one option must be marked as correct."
    }

    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    const payload: QuestionPayload = {
      question_set_id: questionSetId.trim(),
      question_text: questionText.trim(),
      category: category.trim(),
      difficulty,
      options: options.map((opt) => ({
        text: opt.text.trim(),
        is_correct: opt.isCorrect,
      })),
      explanation: explanation.trim() || null,
    }

    try {
      setIsSubmitting(true)

      // ⬇️ Grab JWT from localStorage (or your auth hook if you have one)
      const token = localStorage.getItem("access_token")
      if (!token) {
        throw new Error("You must be logged in to submit questions.")
      }

      const res = await fetch("http://localhost:8000/api/v1/questions/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        let detail = "Failed to save question."
        try {
          const data = await res.json()
          detail = data.detail ?? detail
        } catch {
          // ignore JSON parse error
        }
        throw new Error(detail)
      }

      setSuccessMessage("Question saved successfully.")
      setQuestionText("")
      setCategory("")
      setExplanation("")
      setDifficulty("medium")
      setOptions([
        { id: 1, text: "", isCorrect: true },
        { id: 2, text: "", isCorrect: false },
        { id: 3, text: "", isCorrect: false },
        { id: 4, text: "", isCorrect: false },
      ])
    } catch (err: any) {
      setError(err.message || "Something went wrong.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // CSV IMPORT HANDLER
  const handleCsvFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setImportError(null)
    setImportSuccess(null)
    setImportedCount(null)
    setPendingImportQuestions(null)

    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsImporting(true)
      const text = await file.text()
      const questions = parseCsvToQuestions(text)

      console.log("Parsed questions from CSV:", questions)

      setPendingImportQuestions(questions)
      setImportedCount(questions.length)
      setImportSuccess(
        `Parsed ${questions.length} question(s). Review them below before submitting.`,
      )
    } catch (err: any) {
      setImportError(err.message || "Failed to parse CSV.")
    } finally {
      setIsImporting(false)
      e.target.value = ""
    }
  }

  /**
   * CSV FORMAT (NO TIME LIMIT):
   *
   * question_text,category,difficulty,option1,option2,option3,option4,correct_option
   */
  const parseCsvToQuestions = (csvText: string): QuestionPayload[] => {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    if (lines.length < 2) {
      throw new Error("CSV must include a header + at least 1 data row.")
    }

    const header = lines[0].split(",").map((h) => h.trim().toLowerCase())
    const expected = [
      "question_text",
      "category",
      "difficulty",
      "option1",
      "option2",
      "option3",
      "option4",
      "correct_option",
    ]

    if (expected.some((col, i) => header[i] !== col)) {
      throw new Error(
        `CSV header must be: ${expected.join(",")}. Got: ${header.join(",")}`,
      )
    }

    const validDifficulties: Difficulty[] = ["easy", "medium", "hard"]
    const questions: QuestionPayload[] = []

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim())
      if (cols.length < expected.length) {
        throw new Error(`Row ${i + 1}: missing columns.`)
      }

      const [
        qText,
        category,
        difficultyRaw,
        option1,
        option2,
        option3,
        option4,
        correctRaw,
      ] = cols

      if (!qText) throw new Error(`Row ${i + 1}: question_text required.`)
      if (!category) throw new Error(`Row ${i + 1}: category required.`)

      const difficultyLower = difficultyRaw.toLowerCase()
      if (!validDifficulties.includes(difficultyLower as Difficulty)) {
        throw new Error(
          `Row ${i + 1}: difficulty must be easy, medium, or hard.`,
        )
      }

      const opts = [option1, option2, option3, option4]
      opts.forEach((o, idx) => {
        if (!o) throw new Error(`Row ${i + 1}: option${idx + 1} required.`)
      })

      const correctIdx = Number(correctRaw)
      if (!Number.isInteger(correctIdx) || correctIdx < 1 || correctIdx > 4) {
        throw new Error(
          `Row ${i + 1}: correct_option must be a number 1–4.`,
        )
      }

      // NOTE: question_set_id will be injected later when we send to backend
      questions.push({
        question_set_id: "",
        question_text: qText,
        category,
        difficulty: difficultyLower as Difficulty,
        explanation: null,
        options: opts.map((o, idx) => ({
          text: o,
          is_correct: idx + 1 === correctIdx,
        })),
      })
    }

    return questions
  }

  const handleConfirmImport = async () => {
    if (!pendingImportQuestions || pendingImportQuestions.length === 0) {
      setImportError("No questions to submit.")
      return
    }

    if (!questionSetId.trim()) {
      setImportError("Question Set ID is required for bulk import.")
      return
    }

    setImportError(null)
    setImportSuccess(null)

    try {
      setIsImporting(true)

      const token = localStorage.getItem("access_token")
      if (!token) {
        throw new Error("You must be logged in to submit questions.")
      }

      const qsId = questionSetId.trim()

      const bulkPayload = {
        question_set_id: qsId,
        questions: pendingImportQuestions.map((q) => ({
          ...q,
          question_set_id: qsId,
        })),
      }

      const res = await fetch("http://localhost:8000/api/v1/questions/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bulkPayload),
      })

      if (!res.ok) {
        let detail = "Bulk import failed."
        try {
          const data = await res.json()
          detail = data.detail ?? detail
        } catch {
          // ignore
        }
        throw new Error(detail)
      }

      setImportSuccess(
        `Successfully submitted ${pendingImportQuestions.length} question(s).`,
      )
      setImportedCount(pendingImportQuestions.length)
      setPendingImportQuestions(null)
    } catch (err: any) {
      setImportError(err.message || "Failed to submit imported questions.")
    } finally {
      setIsImporting(false)
    }
  }

  const handleCancelImport = () => {
    setPendingImportQuestions(null)
    setImportSuccess("Import canceled. No questions were submitted.")
    setImportError(null)
  }

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      <h1 style={{ fontSize: "1.8rem", fontWeight: 600 }}>
        Question Entry (Recruiter)
      </h1>

      {/* SINGLE QUESTION ENTRY */}
      <section
        style={{
          border: "1px solid #ddd",
          padding: "16px 20px",
          borderRadius: "8px",
          background: "#fff",
        }}
      >
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600 }}>
          Add a Single Question
        </h2>

        {error && (
          <div
            style={{
              backgroundColor: "#ffe5e5",
              padding: "10px",
              borderRadius: "6px",
              color: "#b00020",
              marginBottom: "12px",
            }}
          >
            {error}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              backgroundColor: "#e6ffed",
              padding: "10px",
              borderRadius: "6px",
              color: "#137333",
              marginBottom: "12px",
            }}
          >
            {successMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          {/* Question Set ID */}
          <div>
            <label style={{ fontWeight: 600 }}>
              Question Set ID <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="text"
              value={questionSetId}
              onChange={(e) => setQuestionSetId(e.target.value)}
              placeholder="Paste the Question Set UUID here"
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                marginTop: "4px",
              }}
            />
          </div>

          {/* Question */}
          <div>
            <label style={{ fontWeight: 600 }}>
              Question Text <span style={{ color: "red" }}>*</span>
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
          </div>

          {/* Category + Difficulty */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: "260px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <label style={{ fontWeight: 600 }}>
                Category <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            <div
              style={{
                minWidth: "180px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <label style={{ fontWeight: 600 }}>Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Options */}
          <div style={{ marginTop: "8px" }}>
            <label style={{ fontWeight: 600 }}>
              Answer Options (4 required). Select correct answer.
            </label>

            {options.map((opt, index) => (
              <div
                key={opt.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "6px",
                }}
              >
                <input
                  type="radio"
                  name="correct"
                  checked={opt.isCorrect}
                  onChange={() => handleSetCorrect(opt.id)}
                />
                <input
                  type="text"
                  value={opt.text}
                  placeholder={`Option ${index + 1}`}
                  onChange={(e) =>
                    handleOptionTextChange(opt.id, e.target.value)
                  }
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "6px",
                    border:
                      opt.text.trim() === ""
                        ? "1px solid red"
                        : "1px solid #ccc",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Explanation */}
          <div>
            <label style={{ fontWeight: 600 }}>Explanation (optional)</label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              backgroundColor: "#2563eb",
              color: "white",
              padding: "10px 18px",
              borderRadius: "6px",
              border: "none",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              marginTop: "6px",
            }}
          >
            {isSubmitting ? "Saving..." : "Save Question"}
          </button>
        </form>
      </section>

      {/* CSV IMPORT */}
      <section
        style={{
          border: "1px solid #ddd",
          padding: "16px 20px",
          borderRadius: "8px",
          background: "#fafafa",
        }}
      >
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600 }}>
          Bulk Import via CSV
        </h2>

        <p style={{ fontSize: "0.9rem", color: "#555" }}>
          CSV columns must be exactly:
        </p>

        <code
          style={{
            display: "block",
            padding: "6px",
            background: "#eee",
            borderRadius: "4px",
            marginBottom: "8px",
          }}
        >
          question_text,category,difficulty,option1,option2,option3,option4,correct_option
        </code>

        {importError && (
          <div
            style={{
              backgroundColor: "#ffe5e5",
              padding: "10px",
              borderRadius: "6px",
              color: "#b00020",
              marginBottom: "12px",
            }}
          >
            {importError}
          </div>
        )}

        {importSuccess && (
          <div
            style={{
              backgroundColor: "#e6ffed",
              padding: "10px",
              borderRadius: "6px",
              color: "#137333",
              marginBottom: "12px",
            }}
          >
            {importSuccess}
            {importedCount !== null && (
              <div style={{ marginTop: "6px" }}>
                Parsed rows: <strong>{importedCount}</strong>
              </div>
            )}
          </div>
        )}

        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleCsvFileChange}
          disabled={isImporting}
        />

        {/* CONFIRMATION SCREEN */}
        {pendingImportQuestions && pendingImportQuestions.length > 0 && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              background: "#fff",
            }}
          >
            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>
              Review Imported Questions
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#555", marginBottom: 12 }}>
              Please confirm the questions and answers below. When you click{" "}
              <strong>Submit all questions</strong>, they will be sent to the
              server.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pendingImportQuestions.map((q, idx) => (
                <div
                  key={idx}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: "6px",
                    padding: "8px 10px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#555",
                      marginBottom: 4,
                    }}
                  >
                    Question {idx + 1} • {q.category} •{" "}
                    {q.difficulty.charAt(0).toUpperCase() +
                      q.difficulty.slice(1)}
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    {q.question_text}
                  </div>
                  <ul
                    style={{
                      listStyle: "disc",
                      paddingLeft: "20px",
                      margin: 0,
                      fontSize: "0.9rem",
                    }}
                  >
                    {q.options.map((opt, i) => (
                      <li key={i}>
                        {opt.text}{" "}
                        {opt.is_correct && (
                          <span
                            style={{
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              marginLeft: 6,
                              padding: "2px 6px",
                              borderRadius: "999px",
                              background: "#e0f2fe",
                              color: "#1d4ed8",
                            }}
                          >
                            Correct
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 12,
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={handleCancelImport}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  background: "#f3f4f6",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isImporting}
                style={{
                  padding: "8px 14px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#16a34a",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: isImporting ? "not-allowed" : "pointer",
                }}
              >
                {isImporting ? "Submitting..." : "Submit all questions"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default QuestionEntryPage
