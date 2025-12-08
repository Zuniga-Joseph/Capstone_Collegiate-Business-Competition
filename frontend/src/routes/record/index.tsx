import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";


export const Route = createFileRoute("/record/")({
  component: RecordPage,
});

function RecordPage() {
  const [isRecording, setIsRecording] = React.useState(false);
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = React.useState<string | null>(null);

  // might need to change this if backend path is different
  const BACKEND_UPLOAD_URL = "http://localhost:8000/api/v1/recordings/";

  async function startRecording() {
    try {
      setUploadStatus(null);
      setAudioUrl(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });

        // local preview
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // upload to backend
        await uploadRecording(blob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      setUploadStatus("Error: could not access microphone");
    }
  }

  function stopRecording() {
    if (!mediaRecorder) return;
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
  }

  async function uploadRecording(blob: Blob) {
    try {
      setUploadStatus("Uploading...");

      const formData = new FormData();
      formData.append("file", blob, `recording-${Date.now()}.webm`);

      const res = await fetch(BACKEND_UPLOAD_URL, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let msg = "Upload failed";
        try {
          const err = await res.json();
          if (err?.detail) msg = err.detail;
        } catch {
          // ignore JSON error
        }
        throw new Error(msg);
      }

      const data = await res.json();
      console.log("Upload response:", data);
      setUploadStatus("Upload successful ✅");
    } catch (err: any) {
      console.error(err);
      setUploadStatus(`Upload failed: ${err?.message ?? "Unknown error"}`);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        color: "white",
      }}
    >
      <h1>Voice Recording</h1>

      {/* 🔴 Big red button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        style={{
          width: "120px",
          height: "120px",
          borderRadius: "60px",
          border: "none",
          background: isRecording ? "#b91c1c" : "#ef4444",
          boxShadow: "0 0 20px rgba(239,68,68,0.6)",
          cursor: "pointer",
          fontSize: "1.1rem",
          fontWeight: "bold",
          color: "white",
        }}
      >
        {isRecording ? "Stop" : "Record"}
      </button>

      {audioUrl && (
        <div style={{ marginTop: "1rem" }}>
          <p>Preview:</p>
          <audio controls src={audioUrl} />
        </div>
      )}

      {uploadStatus && <p>{uploadStatus}</p>}
    </div>
  );
}

