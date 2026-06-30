from pydantic import BaseModel


class IngestRequest(BaseModel):
    url: str


class ManualIngestRequest(BaseModel):
    video_id: str
    transcript_text: str
