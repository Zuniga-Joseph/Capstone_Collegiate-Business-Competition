import { createFileRoute } from "@tanstack/react-router"
import { FormEvent, useState } from "react"

export const Route = createFileRoute("/recruiter-question-entry")({
  component: QuestionEntryPage,
})

type Difficulty = "easy" | "medium" | "hard"

interface AnswerOption {
  id: number
  text: string
  isCorrect: boolean
}

function QuestionEntryPage() {
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
    if (!questionText.trim()) return "Question text is required."
    if (!category.trim()) return "Category is required."

    if (options.length !== 4) {
      return "Exactly four answer options are required."
    }

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

    const payload = {
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
      // TODO: replace this with your real API call
      // const res = await fetch("http://localhost:8000/api/questions", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(payload),
      // })
      // if (!res.ok) {
      //   const data = await res.json()
      //   throw new Error(data.detail ?? "Failed to create question")
      // }

      console.log("Submitting question payload:", payload)

      setSuccessMessage("Question saved successfully.")
      setQuestionText("")
      setCategory("")
      setDifficulty("medium")
      setExplanation("")
      setOptions([
        { id: 1, text: "", isCorrect: true },
        { id: 2, text: "", isCorrect: false },
        { id: 3, text: "", isCorrect: false },
        { id: 4, text: "", isCorrect: false },
      ])
    } catch (err: any) {
      setError(err.message || "Something went wrong while saving the question.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <h1 style={{ fontSize: "1.8rem", fontWeight: 600 }}>
        Question Entry (Recruiter)
      </h1>

      <p style={{ color: "#555", marginBottom: "8px" }}>
        Use this screen to add new contest questions. Each question must have
        exactly four answer options and one correct answer.
      </p>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "6px",
            backgroundColor: "#ffe5e5",
            color: "#b00020",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "6px",
            backgroundColor: "#e6ffed",
            color: "#137333",
            fontSize: "0.9rem",
          }}
        >
          {successMessage}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "16px 20px",
          background: "#fff",
        }}
      >
        {/* Question Text */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontWeight: 600 }}>
            Question Text <span style={{ color: "#b00020" }}>*</span>
          </label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={4}
            placeholder="Enter the question the candidate will see..."
            style={{
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Category & Difficulty */}
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
              minWidth: "220px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <label style={{ fontWeight: 600 }}>
              Category <span style={{ color: "#b00020" }}>*</span>
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Communication, Leadership, Teamwork"
              style={{
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div
            style={{
              width: "200px",
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

        {/* Answer Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontWeight: 600 }}>
            Answer Options (Multiple Choice){" "}
            <span style={{ color: "#b00020" }}>*</span>
          </label>
          <p style={{ fontSize: "0.85rem", color: "#555" }}>
            Provide exactly four options and select which one is correct.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {options.map((opt, index) => (
              <div
                key={opt.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <input
                  type="radio"
                  name="correctOption"
                  checked={opt.isCorrect}
                  onChange={() => handleSetCorrect(opt.id)}
                />
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) =>
                    handleOptionTextChange(opt.id, e.target.value)
                  }
                  placeholder={`Option ${index + 1} (required)`}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "6px",
                    border:
                      opt.text.trim() === ""
                        ? "1px solid #b00020"
                        : "1px solid #ccc",
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Explanation */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontWeight: 600 }}>Explanation / Notes (optional)</label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={3}
            placeholder="Add an explanation for the correct answer, or notes for other recruiters."
            style={{
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            marginTop: "8px",
            padding: "10px 18px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: isSubmitting ? "#aaa" : "#2563eb",
            color: "#fff",
            fontWeight: 600,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            alignSelf: "flex-start",
          }}
        >
          {isSubmitting ? "Saving..." : "Save Question"}
        </button>
      </form>
    </div>
  )
}

export default QuestionEntryPage
