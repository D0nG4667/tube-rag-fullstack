from unittest.mock import MagicMock, patch

import numpy as np
from fastapi.testclient import TestClient

from app.api.v1.ingest import get_supabase
from app.api.v1.webhook import verify_qstash_signature
from app.main import app
from app.services.frame_extractor import calculate_ssim

client = TestClient(app)


def test_calculate_ssim():
    img1 = np.ones((100, 100, 3), dtype=np.uint8) * 255
    img2 = np.ones((100, 100, 3), dtype=np.uint8) * 255
    img3 = np.zeros((100, 100, 3), dtype=np.uint8)

    # Matching images should have SSIM of 1.0
    assert calculate_ssim(img1, img2) == 1.0
    # Completely opposite images should have much lower SSIM
    assert calculate_ssim(img1, img3) < 0.5


def test_process_video_webhook_extract_frames():
    mock_db = MagicMock()
    mock_video_select = MagicMock()
    mock_video_select.execute.return_value = MagicMock(
        data=[
            {
                "id": "test_video_uuid",
                "youtube_id": "dQw4w9WgXcQ",
                "title": "Rick Roll",
                "status": "processing_frames",
                "duration": 500.0,  # Finished frame segment (500 < 600) -> status goes to completed
            }
        ]
    )
    mock_db.table.return_value.select.return_value.eq.return_value = mock_video_select

    app.dependency_overrides[get_supabase] = lambda: mock_db
    app.dependency_overrides[verify_qstash_signature] = lambda: None

    with patch("app.api.v1.webhook.download_video_segment") as mock_download:
        with patch("qstash.QStash"):
            response = client.post(
                "/api/v1/internal/process-video",
                json={
                    "video_id": "test_video_uuid",
                    "step": "extract_frames",
                    "offset": 0.0,
                },
            )

            assert response.status_code == 200
            assert response.json() == {"status": "ok"}
            mock_download.assert_called_once()

            # Should set status to completed
            mock_db.table.assert_any_call("videos")
            mock_db.table.assert_any_call("video_chunks")

    app.dependency_overrides.clear()
