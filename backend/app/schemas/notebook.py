from pydantic import BaseModel


class NotebookRequest(BaseModel):
    video_id: str


# Pydantic schemas for structured Gemini outputs


class DialogueTurn(BaseModel):
    host: str  # "Host A" or "Host B"
    text: str


class PodcastScript(BaseModel):
    script: list[DialogueTurn]


class MindmapLeaf(BaseModel):
    text: str
    seconds: int


class MindmapBranch(BaseModel):
    title: str
    leaves: list[MindmapLeaf]


class MindmapSchema(BaseModel):
    subject: str
    branches: list[MindmapBranch]


class PodcastAudioRequest(BaseModel):
    script: list[DialogueTurn]
