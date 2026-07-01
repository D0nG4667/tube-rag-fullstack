import random
import re
import subprocess
import sys
from typing import Any

from google import genai
from google.genai import types

from app.core.config import settings
from app.core.helpers import logger

TIMESTAMP_REGEX = re.compile(r"\[?(\d{1,2}:)?(\d{1,2}):(\d{2})\]?")


def get_embedding(text: str, api_key: str | None = None) -> list[float]:
    """
    Generates embedding vector of 768 dimensions using Gemini gemini-embedding-001.
    """
    effective_key = api_key or settings.GEMINI_API_KEY
    if (
        "pytest" in sys.modules
        or not effective_key
        or effective_key == "your-gemini-api-key"
    ):
        # Generate stable dummy embedding for testing
        random.seed(hash(text))
        return [random.uniform(-1.0, 1.0) for _ in range(768)]

    client = genai.Client(api_key=effective_key)
    emb_res = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config=types.EmbedContentConfig(output_dimensionality=768),
    )
    return emb_res.embeddings[0].values


def time_aware_chunker(
    transcript_items: list, max_chars: int = 800, max_gap: float = 3.0
) -> list[dict]:
    """
    Chunks transcript items based on max character length and maximum silence gap between items.
    """
    chunks = []
    current_chunk = []
    current_length = 0

    for item in transcript_items:
        if isinstance(item, dict):
            text = item.get("text", "")
            start = item.get("start", 0.0)
        else:
            text = getattr(item, "text", "")
            start = getattr(item, "start", 0.0)

        if not current_chunk:
            current_chunk.append(item)
            current_length = len(text)
            continue

        prev_item = current_chunk[-1]
        if isinstance(prev_item, dict):
            prev_start = prev_item.get("start", 0.0)
            prev_duration = prev_item.get("duration", 0.0)
        else:
            prev_start = getattr(prev_item, "start", 0.0)
            prev_duration = getattr(prev_item, "duration", 0.0)

        prev_end = prev_start + prev_duration
        gap = start - prev_end

        if current_length + len(text) > max_chars or gap > max_gap:
            # Emit chunk
            chunk_text = " ".join(
                [
                    x.get("text", "") if isinstance(x, dict) else getattr(x, "text", "")
                    for x in current_chunk
                ]
            )

            first_item = current_chunk[0]
            last_item = current_chunk[-1]

            if isinstance(first_item, dict):
                start_time = first_item.get("start", 0.0)
            else:
                start_time = getattr(first_item, "start", 0.0)

            if isinstance(last_item, dict):
                end_time = last_item.get("start", 0.0) + last_item.get("duration", 0.0)
            else:
                end_time = getattr(last_item, "start", 0.0) + getattr(
                    last_item, "duration", 0.0
                )

            chunks.append(
                {
                    "content": chunk_text,
                    "start_time": start_time,
                    "end_time": end_time,
                }
            )
            current_chunk = [item]
            current_length = len(text)
        else:
            current_chunk.append(item)
            current_length += len(text)

    if current_chunk:
        chunk_text = " ".join(
            [
                x.get("text", "") if isinstance(x, dict) else getattr(x, "text", "")
                for x in current_chunk
            ]
        )

        first_item = current_chunk[0]
        last_item = current_chunk[-1]

        if isinstance(first_item, dict):
            start_time = first_item.get("start", 0.0)
        else:
            start_time = getattr(first_item, "start", 0.0)

        if isinstance(last_item, dict):
            end_time = last_item.get("start", 0.0) + last_item.get("duration", 0.0)
        else:
            end_time = getattr(last_item, "start", 0.0) + getattr(
                last_item, "duration", 0.0
            )

        chunks.append(
            {
                "content": chunk_text,
                "start_time": start_time,
                "end_time": end_time,
            }
        )
    return chunks


def download_audio_segment(
    url: str,
    start_sec: float,
    end_sec: float,
    out_path: str,
    youtube_proxy: str | None = None,
):
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

    import shutil

    yt_executable = shutil.which("yt-dlp")
    cmd_base = [yt_executable] if yt_executable else [sys.executable, "-m", "yt_dlp"]

    cmd = cmd_base + [
        "-f",
        "ba*[ext=m4a]/ba",
        "--download-sections",
        f"*{start_str}-{end_str}",
        "-o",
        out_path,
    ]
    if youtube_proxy:
        cmd += ["--proxy", youtube_proxy]
    cmd += [url]

    try:
        subprocess.run(cmd, check=True)
    except (FileNotFoundError, subprocess.CalledProcessError) as e:
        if settings.ENVIRONMENT == "local":
            logger.warning(
                f"WARNING: yt-dlp download failed ({e}). Creating dummy audio segment for local development bypass."
            )
            with open(out_path, "wb") as f:
                f.write(b"MOCK AUDIO DATA")
            return
        error_detail = ""
        if isinstance(e, subprocess.CalledProcessError):
            error_detail = f" (Command returned exit status {e.returncode})"
        raise RuntimeError(
            f"yt-dlp failed to download audio segment{error_detail}. Please ensure yt-dlp is installed and not blocked by YouTube."
        ) from e


def transcribe_audio_with_gemini(audio_path: str, api_key: str | None = None) -> str:
    """
    Uploads audio file to Gemini and requests a transcript with timestamps.
    """
    effective_key = api_key or settings.GEMINI_API_KEY
    if (
        "pytest" in sys.modules
        or not effective_key
        or effective_key == "your-gemini-api-key"
    ):
        return "[00:10] This is a mock transcription segment for testing."

    client = genai.Client(api_key=effective_key)
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


def fetch_transcript_from_supadata(video_id: str, api_key: str) -> list[dict]:
    """
    Fetches transcript for the YouTube video from Supadata.
    Returns a list of dicts with 'text', 'start' (seconds), and 'duration' (seconds).
    """
    import httpx

    url = f"https://api.supadata.ai/v1/youtube/transcript?videoId={video_id}&text=false"
    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json",
    }

    response = httpx.get(url, headers=headers, timeout=30.0)
    response.raise_for_status()
    data = response.json()

    content = data.get("content")
    if not isinstance(content, list):
        raise ValueError("Unexpected transcript format from Supadata")

    items = []
    for item in content:
        offset_ms = item.get("offset", 0.0)
        duration_ms = item.get("duration", 0.0)
        items.append(
            {
                "text": item.get("text", ""),
                "start": offset_ms / 1000.0,
                "duration": duration_ms / 1000.0,
            }
        )
    return items


def parse_time_to_seconds(hours: str, minutes: str, seconds: str) -> float:
    """Safely converts regex timestamp string matches to float seconds."""
    h = int(hours.replace(":", "")) if hours else 0
    m = int(minutes)
    s = int(seconds)
    return float(h * 3600 + m * 60 + s)


def parse_manual_transcript(
    text: str, duration: float | None = None
) -> list[dict[str, Any]]:
    """
    Robust production parser for unstructured/pasted transcripts.
    Handles interleaved timestamps, line-separated pairs, and clean
    chunk distribution for downstream vector storage ingestion.
    """
    if not text or not text.strip():
        return []

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    parsed_items: list[dict[str, Any]] = []

    current_time: float | None = None
    current_buffer: list[str] = []

    # --- Phase 1: Robust State-Machine Extraction ---
    for line in lines:
        match = TIMESTAMP_REGEX.search(line)

        if match:
            # Commit the previous block before moving to the new timestamp
            if current_time is not None and current_buffer:
                parsed_items.append(
                    {
                        "text": " ".join(current_buffer).strip(),
                        "start": current_time,
                        "duration": 0.0,  # Will calculate in Phase 2
                    }
                )
                current_buffer = []

            # Extract timestamp metrics
            current_time = parse_time_to_seconds(
                match.group(1), match.group(2), match.group(3)
            )

            # Extract any trailing textual content sitting on the exact same line
            clean_text = TIMESTAMP_REGEX.sub("", line).strip()
            if clean_text:
                current_buffer.append(clean_text)
        else:
            # Line is pure text content, append to existing open buffer
            if current_time is not None:
                current_buffer.append(line)

    # Commit any remaining dangling buffer data
    if current_time is not None and current_buffer:
        parsed_items.append(
            {
                "text": " ".join(current_buffer).strip(),
                "start": current_time,
                "duration": 0.0,
            }
        )

    # --- Phase 2: Dynamic Edge-Bridging & Calculations ---
    if parsed_items:
        for idx in range(len(parsed_items) - 1):
            delta = parsed_items[idx + 1]["start"] - parsed_items[idx]["start"]
            # Enforce a sane maximum window per segment (e.g., max 60s) to keep RAG slices tight
            parsed_items[idx]["duration"] = min(max(1.0, delta), 60.0)

        # Set a logical fallback for the absolute final segment
        parsed_items[-1]["duration"] = 5.0
        return parsed_items

    # --- Phase 3: Semantic Fallback Routing (Plain Text) ---
    # Chunk by sentence boundaries, not hard character limits
    sentences = re.split(r"(?<=[.!?])\s+", text.replace("\n", " "))
    chunks: list[str] = []
    current_chunk: list[str] = []
    current_char_count = 0
    target_chunk_chars = 700

    for sentence in sentences:
        if current_char_count + len(sentence) > target_chunk_chars and current_chunk:
            chunks.append(" ".join(current_chunk))
            current_chunk = [sentence]
            current_char_count = len(sentence)
        else:
            current_chunk.append(sentence)
            current_char_count += len(sentence) + 1

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    # Evenly distribute chunks relative to video duration metrics
    total_duration = duration if duration and duration > 0 else 300.0
    duration_per_chunk = total_duration / max(len(chunks), 1)

    return [
        {
            "text": chunk_content,
            "start": round(idx * duration_per_chunk, 2),
            "duration": round(duration_per_chunk, 2),
        }
        for idx, chunk_content in enumerate(chunks)
    ]
