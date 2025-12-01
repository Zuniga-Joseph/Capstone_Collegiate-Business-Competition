from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter()

# Folder where recordings will be saved (project root / recordings)
RECORDINGS_DIR = Path("recordings")
RECORDINGS_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/", summary="Upload a voice recording")
async def upload_recording(file: UploadFile = File(...)):
    """
    Receive an audio file from the frontend and save it on disk.
    Returns the filename so it can be referenced later.
    """
    # Basic safety check
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be an audio type")

    # Generate unique timestamp-based filename
    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S-%f")
    ext = Path(file.filename).suffix or ".webm"
    filename = f"recording-{timestamp}{ext}"
    save_path = RECORDINGS_DIR / filename

    try:
        contents = await file.read()
        save_path.write_bytes(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save recording: {e}")

    return {
        "message": "Recording uploaded successfully",
        "filename": filename,
        "path": str(save_path),
    }
