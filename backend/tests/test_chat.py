from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.api.v1.ingest import get_supabase
from app.main import app

client = TestClient(app)


def test_chat_endpoint_success():
    mock_db = MagicMock()

    # Mock RRF hybrid search results
    mock_rpc = MagicMock()
    mock_rpc.execute.return_value = MagicMock(
        data=[
            {
                "chunk_id": "mock_chunk_uuid",
                "content": "Never gonna give you up",
                "start_time": 0.0,
                "end_time": 2.0,
                "chunk_type": "transcript",
                "image_url": None,
                "metadata": {},
                "combined_score": 1.95,
            }
        ]
    )
    mock_db.rpc.return_value = mock_rpc

    # Override database client
    app.dependency_overrides[get_supabase] = lambda: mock_db

    response = client.post(
        "/api/v1/chat",
        json={"video_id": "test_video_uuid", "message": "tell me about this video"},
    )

    assert response.status_code == 200
    res_data = response.json()
    assert "response" in res_data
    assert "sources" in res_data
    assert len(res_data["sources"]) == 1
    assert res_data["sources"][0]["content"] == "Never gonna give you up"

    # Verify hybrid_search RPC call parameter bindings
    mock_db.rpc.assert_called_once_with(
        "hybrid_search",
        {
            "query_text": "tell me about this video",
            "query_embedding": mock_db.rpc.call_args[0][1][
                "query_embedding"
            ],  # Any list
            "target_video_id": "test_video_uuid",
            "match_count": 5,
        },
    )

    app.dependency_overrides.clear()


def test_chat_endpoint_no_results():
    mock_db = MagicMock()
    mock_rpc = MagicMock()
    mock_rpc.execute.return_value = MagicMock(data=[])
    mock_db.rpc.return_value = mock_rpc

    app.dependency_overrides[get_supabase] = lambda: mock_db

    response = client.post(
        "/api/v1/chat",
        json={"video_id": "test_video_uuid", "message": "tell me about this video"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "No matching video segments found"

    app.dependency_overrides.clear()
