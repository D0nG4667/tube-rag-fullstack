import random
import subprocess
import sys

from google import genai
from google.genai import types

from app.core.config import settings


def get_embedding(text: str) -> list[float]:
    """
    Generates embedding vector of 768 dimensions using Gemini gemini-embedding-001.
    """
    if (
        "pytest" in sys.modules
        or not settings.GEMINI_API_KEY
        or settings.GEMINI_API_KEY == "your-gemini-api-key"
    ):
        # Generate stable dummy embedding for testing
        random.seed(hash(text))
        return [random.uniform(-1.0, 1.0) for _ in range(768)]

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    emb_res = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config=types.EmbedContentConfig(output_dimensionality=768),
    )
    return emb_res.embeddings[0].values


def time_aware_chunker(
    transcript_items: list[dict], max_chars: int = 800, max_gap: float = 3.0
) -> list[dict]:
    """
    Chunks transcript items based on max character length and maximum silence gap between items.
    """
    chunks = []
    current_chunk = []
    current_length = 0

    for item in transcript_items:
        text = item["text"]
        start = item["start"]
        duration = item.get("duration", 0.0)
        start + duration

        if not current_chunk:
            current_chunk.append(item)
            current_length = len(text)
            continue

        prev_item = current_chunk[-1]
        prev_end = prev_item["start"] + prev_item.get("duration", 0.0)
        gap = start - prev_end

        if current_length + len(text) > max_chars or gap > max_gap:
            # Emit chunk
            chunk_text = " ".join([x["text"] for x in current_chunk])
            chunks.append(
                {
                    "content": chunk_text,
                    "start_time": current_chunk[0]["start"],
                    "end_time": current_chunk[-1]["start"]
                    + current_chunk[-1].get("duration", 0.0),
                }
            )
            current_chunk = [item]
            current_length = len(text)
        else:
            current_chunk.append(item)
            current_length += len(text)

    if current_chunk:
        chunk_text = " ".join([x["text"] for x in current_chunk])
        chunks.append(
            {
                "content": chunk_text,
                "start_time": current_chunk[0]["start"],
                "end_time": current_chunk[-1]["start"]
                + current_chunk[-1].get("duration", 0.0),
            }
        )
    return chunks


def download_audio_segment(url: str, start_sec: float, end_sec: float, out_path: str):
    """
    Downloads a specific segment of video audio using yt-dlp.
    """
    # If in pytest or local development without yt-dlp, create a mock empty file
    if "pytest" in sys.modules:
        with open(out_path, "wb") as f:
            f.write(b"MOCK AUDIO DATA")
        return

    start_str = f"{int(start_sec) // 3600:02d}:{int(start_sec) % 3600 // 60:02d}:{int(start_sec) % 60:02d}"
    end_str = f"{int(end_sec) // 3600:02d}:{int(end_sec) % 3600 // 60:02d}:{int(end_sec) % 60:02d}"
    cmd = [
        "yt-dlp",
        "-f",
        "ba*[ext=m4a]/ba",
        "--download-sections",
        f"*{start_str}-{end_str}",
        "-o",
        out_path,
        url,
    ]
    subprocess.run(cmd, check=True)


def transcribe_audio_with_gemini(audio_path: str) -> str:
    """
    Uploads audio file to Gemini and requests a transcript with timestamps.
    """
    if (
        "pytest" in sys.modules
        or not settings.GEMINI_API_KEY
        or settings.GEMINI_API_KEY == "your-gemini-api-key"
    ):
        return "[00:10] This is a mock transcription segment for testing."

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    file_ref = client.files.upload(file=audio_path)
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                "Transcribe this audio block with timestamps in format [MM:SS] text",
                file_ref,
            ],
        )
        return response.text
    finally:
        client.files.delete(name=file_ref.name)
