import * as React from "react";

const BACKEND_UPLOAD_URL = "http://localhost:8000/api/v1/recordings/"; // change if your path is different

export function GlobalRecordButton() {
  const [isRecording, setIsRecording] = React.useState(false);
  const [uploadStatus, setUploadStatus] = React.useState<string | null>(null);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);

  async function startRecording() {
    try {
      setUploadStatus(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        // stop tracks so mic is released
        recorder.stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];
        await uploadRecording(blob);
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      setUploadStatus("Mic error");
      setIsRecording(false);
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    recorder.stop();
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
          // ignore parse error
        }
        throw new Error(msg);
      }

      setUploadStatus("Uploaded ✅");
      // clear status after a few seconds
      setTimeout(() => setUploadStatus(null), 4000);
    } catch (err) {
      console.error(err);
      setUploadStatus("Upload failed");
    }
  }

  function handleClick() {
    if (isRecording) {
      stopRecording();
    } else {
      void startRecording();
    }
  }

  return (
    <>
      {/* Floating circular red button */}
      <button
        onClick={handleClick}
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          width: "64px",
          height: "64px",
          borderRadius: "999px",
          border: "none",
          background: isRecording ? "#b91c1c" : "#ef4444",
          boxShadow: "0 0 16px rgba(0,0,0,0.4)",
          cursor: "pointer",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 600,
          fontSize: "0.75rem",
        }}
        title={isRecording ? "Stop recording" : "Start recording"}
      >
        {isRecording ? "STOP" : "REC"}
      </button>

      {/* Small status pill above it */}
      {uploadStatus && (
        <div
          style={{
            position: "fixed",
            bottom: "5.5rem",
            right: "1.5rem",
            padding: "0.4rem 0.75rem",
            borderRadius: "999px",
            background: "#020617",
            color: "white",
            fontSize: "0.75rem",
            boxShadow: "0 0 10px rgba(0,0,0,0.4)",
            zIndex: 1000,
          }}
        >
          {uploadStatus}
        </div>
      )}
    </>
  );
}
