# Task 5 Report: Backend Ingestion Stage 3 (Frame Extraction, Deduplication & Vision)

## Implementation Details

We implemented the Stage 3 ingestion pipeline, which processes video files to sample, deduplicate, and analyze frames using computer vision:

1. **Frame Extractor & SSIM Deduplicator:** Created `backend/app/services/frame_extractor.py` containing:
   - `calculate_ssim`: Computes grayscale structural similarity (using Mean Squared Error calculation) between two frames.
   - `download_video_segment`: Uses `yt-dlp` to download the lowest resolution of a 10-minute video segment (`worst[ext=mp4]/worst`) to minimize bandwidth consumption.
   - `extract_frames_from_video`: Extracts frames from the segment at 10-second intervals and compresses them directly to WebP bytes.
   - `analyze_frame_with_gemini`: Queries Gemini 2.5 flash vision model with WebP bytes to extract slide OCR text, titles, code snippets, visual descriptions, and structural change flags.
2. **Webhook Frame Processing Branch:** Updated `backend/app/api/v1/webhook.py` to add the `extract_frames` step:
   - Deduplicates consecutive sampled frames using a `sim < 0.90` threshold.
   - Uploads unique frames to Supabase Storage bucket `video-frames`.
   - Generates text embeddings and inserts RAG document chunks with type `visual_frame` and slide metadata.
   - Schedules the next segment in QStash if video duration remains, or updates the status to `completed` upon finishing.

## Testing & Verification

1. **Unit Test Coverage:** Created `backend/tests/test_frames.py` containing:
   - `test_calculate_ssim`: Verifies matching white/black and offset SSIM outputs.
   - `test_process_video_webhook_extract_frames`: Verifies database client insertions and state progression to completed status.
2. **Test Run:** Executed `uv run pytest` and verified all **8/8 tests passed** successfully.

## Files Created/Modified

- [NEW] [backend/app/services/frame_extractor.py](../../backend/app/services/frame_extractor.py)
- [NEW] [backend/tests/test_frames.py](../../backend/tests/test_frames.py)
- [MODIFY] [backend/app/api/v1/webhook.py](../../backend/app/api/v1/webhook.py)
- [MODIFY] [backend/pyproject.toml](../../backend/pyproject.toml)

## Status

- **Status:** DONE
- **Test Summary:** 8/8 tests passing, OpenCV and Pillow dependencies verified.
