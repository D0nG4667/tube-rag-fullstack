from fastapi.testclient import TestClient

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
