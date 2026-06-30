from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.api.v1.ingest import get_supabase
from app.main import app

client = TestClient(app)


def test_extract_youtube_id():
    from app.api.v1.ingest import extract_youtube_id

    assert (
        extract_youtube_id("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        == "dQw4w9WgXcQ"
    )
    assert extract_youtube_id("https://youtu.be/dQw4w9WgXcQ") == "dQw4w9WgXcQ"


def test_ingest_bad_url():
    response = client.post("/api/v1/ingest", json={"url": "bad_url"})
    assert response.status_code == 400


def test_ingest_manual_transcript():
    mock_db = MagicMock()
    mock_video_select = MagicMock()
    mock_video_select.execute.return_value = MagicMock(
        data=[
            {
                "id": "test_video_uuid",
                "youtube_id": "dQw4w9WgXcQ",
                "title": "Rick Roll",
                "status": "failed",
                "duration": 210.0,
            }
        ]
    )
    mock_db.table.return_value.select.return_value.eq.return_value = mock_video_select

    app.dependency_overrides[get_supabase] = lambda: mock_db

    # Patch get_embedding and background dispatcher
    with patch("app.services.transcription.get_embedding") as mock_embed:
        with patch("app.api.v1.ingest.dispatch_ingest_task") as mock_dispatch:
            mock_embed.return_value = [0.1] * 768

            response = client.post(
                "/api/v1/ingest/manual",
                json={
                    "video_id": "test_video_uuid",
                    "transcript_text": "0:00\nNever gonna give you up\n0:02\nNever gonna let you down",
                },
            )

            assert response.status_code == 200
            assert response.json() == {"status": "ok"}

            # Verify db insert was called for chunks
            mock_db.table.assert_any_call("video_chunks")
            # Verify status update was called to advance processing status
            mock_db.table.assert_any_call("videos")

            # Verify dispatcher was called once
            mock_dispatch.assert_called_once()

    app.dependency_overrides.clear()
