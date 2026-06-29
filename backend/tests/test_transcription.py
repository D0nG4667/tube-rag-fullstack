from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.api.v1.ingest import get_supabase
from app.api.v1.webhook import verify_qstash_signature
from app.main import app
from app.services.transcription import time_aware_chunker

client = TestClient(app)


def test_time_aware_chunker():
    items = [
        {"text": "Hello world", "start": 0.0, "duration": 1.0},
        {"text": "This is a sentence", "start": 2.0, "duration": 1.5},
        {
            "text": "A delayed text",
            "start": 10.0,
            "duration": 2.0,
        },  # Gap of 6.5s (> 3.0s max_gap)
    ]
    chunks = time_aware_chunker(items, max_chars=800, max_gap=3.0)
    assert len(chunks) == 2
    assert chunks[0]["content"] == "Hello world This is a sentence"
    assert chunks[0]["start_time"] == 0.0
    assert chunks[0]["end_time"] == 3.5
    assert chunks[1]["content"] == "A delayed text"
    assert chunks[1]["start_time"] == 10.0
    assert chunks[1]["end_time"] == 12.0


def test_process_video_webhook_native_success():
    mock_db = MagicMock()

    # Mock video fetch
    mock_video_select = MagicMock()
    mock_video_select.execute.return_value = MagicMock(
        data=[
            {
                "id": "test_video_uuid",
                "youtube_id": "dQw4w9WgXcQ",
                "title": "Rick Roll",
                "status": "pending",
                "duration": 210.0,
            }
        ]
    )
    mock_db.table.return_value.select.return_value.eq.return_value = mock_video_select

    # Override dependencies
    app.dependency_overrides[get_supabase] = lambda: mock_db
    app.dependency_overrides[verify_qstash_signature] = lambda: None

    # Patch native transcript fetch on instance and QStash client
    with patch("youtube_transcript_api.YouTubeTranscriptApi.fetch") as mock_fetch:
        with patch("qstash.QStash") as mock_qstash:
            mock_fetch.return_value = [
                {"text": "Never gonna give you up", "start": 0.0, "duration": 2.0}
            ]

            response = client.post(
                "/api/v1/internal/process-video",
                json={
                    "video_id": "test_video_uuid",
                    "step": "transcribe",
                    "offset": 0.0,
                },
            )

            assert response.status_code == 200
            assert response.json() == {"status": "ok"}
            mock_qstash.assert_called_once()

            # Verify db insert was called for chunks
            mock_db.table.assert_any_call("video_chunks")
            # Verify status update was called to progress to frame extraction
            mock_db.table.assert_any_call("videos")

    app.dependency_overrides.clear()


def test_process_video_webhook_fallback():
    mock_db = MagicMock()
    mock_video_select = MagicMock()
    mock_video_select.execute.return_value = MagicMock(
        data=[
            {
                "id": "test_video_uuid",
                "youtube_id": "dQw4w9WgXcQ",
                "title": "Rick Roll",
                "status": "pending",
                "duration": 1200.0,
            }
        ]
    )
    mock_db.table.return_value.select.return_value.eq.return_value = mock_video_select

    app.dependency_overrides[get_supabase] = lambda: mock_db
    app.dependency_overrides[verify_qstash_signature] = lambda: None

    # Force native transcript fetch to fail
    with patch(
        "youtube_transcript_api.YouTubeTranscriptApi.fetch",
        side_effect=Exception("No transcript"),
    ):
        # Patch download_audio_segment inside the webhook lookup namespace
        with patch("app.api.v1.webhook.download_audio_segment") as mock_download:
            with patch("qstash.QStash") as mock_qstash:
                response = client.post(
                    "/api/v1/internal/process-video",
                    json={
                        "video_id": "test_video_uuid",
                        "step": "transcribe",
                        "offset": 0.0,
                    },
                )

                assert response.status_code == 200
                assert response.json() == {"status": "ok"}
                mock_download.assert_called_once()
                mock_qstash.assert_called_once()

                # Verify status update recorded next offset
                mock_db.table.assert_any_call("videos")

    app.dependency_overrides.clear()
