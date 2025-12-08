from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, File, HTTPException, UploadFile
import subprocess
import tempfile

router = APIRouter()

# recordings/ at project root (inside container)
RECORDINGS_DIR = Path("recordings")
RECORDINGS_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/", summary="Upload a voice recording")
async def upload_recording(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be an audio type")

    # Unique filename for the final MP3
    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S-%f")
    mp3_filename = f"recording-{timestamp}.mp3"
    mp3_path = RECORDINGS_DIR / mp3_filename

    # Read uploaded blob into a temp webm file
    contents = await file.read()
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        tmp.write(contents)
        tmp_path = Path(tmp.name)

    try:
        # ffmpeg command: webm -> mp3
        cmd = [
            "ffmpeg",
            "-y",                 # overwrite if exists
            "-i", str(tmp_path),  # input file
            "-vn",                # no video
            "-acodec", "libmp3lame",
            str(mp3_path),
        ]
        subprocess.run(
            cmd,
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Conversion error: {e}") from e
    finally:
        # Clean up temp webm file
        try:
            tmp_path.unlink(missing_ok=True)
        except Exception:
            pass

    return {
        "message": "Recording uploaded successfully",
        "filename": mp3_filename,
        "path": str(mp3_path),
    }
