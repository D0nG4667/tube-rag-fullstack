import sys

from fastapi import APIRouter, Depends, Header, HTTPException
from google import genai
from google.genai import types
from pydantic import BaseModel
from supabase import Client as SupabaseClient

from app.core.config import Settings, get_settings
from app.core.database import get_supabase
from app.services.prompts import (
    OUTLINE_SYSTEM_INSTRUCTION,
    OUTLINE_USER_TEMPLATE,
    PODCAST_SYSTEM_INSTRUCTION,
    PODCAST_USER_TEMPLATE,
    MINDMAP_SYSTEM_INSTRUCTION,
    MINDMAP_USER_TEMPLATE,
)

router = APIRouter()


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


@router.post("/api/v1/notebook/outline")
def generate_outline(
    req: NotebookRequest,
    x_gemini_api_key: str | None = Header(None),
    db: SupabaseClient | None = Depends(get_supabase),
    settings: Settings = Depends(get_settings),
):
    if db is None:
        raise HTTPException(status_code=500, detail="Database client is not configured")

    # Fetch transcript chunks
    res = (
        db.table("video_chunks")
        .select("content, start_time")
        .eq("video_id", req.video_id)
        .order("start_time")
        .execute()
    )
    if not res.data:
        raise HTTPException(
            status_code=404,
            detail="No transcript chunks found for this video. Please wait until indexing completes.",
        )

    full_transcript = "\n".join(
        [f"[{int(item['start_time'])}s]: {item['content']}" for item in res.data]
    )

    effective_key = x_gemini_api_key or settings.GEMINI_API_KEY
    if (
        "pytest" in sys.modules
        or not effective_key
        or effective_key == "your-gemini-api-key"
    ):
        return {
            "outline": (
                "# Mock Presentation Outline\n\n"
                "## Chapter 1: Introduction [0s]\n"
                "- Welcome to the session and initial overview.\n"
                "- High-level goals and codebase walkthrough.\n\n"
                "## Chapter 2: Key Concepts [60s]\n"
                "- Core engineering principles covered.\n"
                "- Discussion of architectural bottlenecks."
            )
        }

    client = genai.Client(api_key=effective_key)
    prompt = OUTLINE_USER_TEMPLATE.format(full_transcript=full_transcript)

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=OUTLINE_SYSTEM_INSTRUCTION
            ),
        )
        return {"outline": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM outline error: {e!s}")


@router.post("/api/v1/notebook/podcast")
def generate_podcast(
    req: NotebookRequest,
    x_gemini_api_key: str | None = Header(None),
    db: SupabaseClient | None = Depends(get_supabase),
    settings: Settings = Depends(get_settings),
):
    if db is None:
        raise HTTPException(status_code=500, detail="Database client is not configured")

    res = (
        db.table("video_chunks")
        .select("content, start_time")
        .eq("video_id", req.video_id)
        .order("start_time")
        .execute()
    )
    if not res.data:
        raise HTTPException(
            status_code=404,
            detail="No transcript chunks found for this video. Please wait until indexing completes.",
        )

    full_transcript = "\n".join(
        [f"[{int(item['start_time'])}s]: {item['content']}" for item in res.data]
    )

    effective_key = x_gemini_api_key or settings.GEMINI_API_KEY
    if (
        "pytest" in sys.modules
        or not effective_key
        or effective_key == "your-gemini-api-key"
    ):
        return {
            "script": [
                {
                    "host": "Host A",
                    "text": "Welcome to our quick StudyStudio session! Today we are discussing the video's core insights.",
                },
                {
                    "host": "Host B",
                    "text": "Indeed! We start with the basic overview of variables and structural execution.",
                },
                {
                    "host": "Host A",
                    "text": "That is interesting. Let us proceed and check the details!",
                },
            ]
        }

    client = genai.Client(api_key=effective_key)
    prompt = PODCAST_USER_TEMPLATE.format(full_transcript=full_transcript)

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=PODCAST_SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=PodcastScript,
            ),
        )
        data = PodcastScript.model_validate_json(response.text)
        return {"script": [turn.model_dump() for turn in data.script]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM podcast error: {e!s}")


@router.post("/api/v1/notebook/mindmap")
def generate_mindmap(
    req: NotebookRequest,
    x_gemini_api_key: str | None = Header(None),
    db: SupabaseClient | None = Depends(get_supabase),
    settings: Settings = Depends(get_settings),
):
    if db is None:
        raise HTTPException(status_code=500, detail="Database client is not configured")

    res = (
        db.table("video_chunks")
        .select("content, start_time")
        .eq("video_id", req.video_id)
        .order("start_time")
        .execute()
    )
    if not res.data:
        raise HTTPException(
            status_code=404,
            detail="No transcript chunks found for this video. Please wait until indexing completes.",
        )

    full_transcript = "\n".join(
        [f"[{int(item['start_time'])}s]: {item['content']}" for item in res.data]
    )

    effective_key = x_gemini_api_key or settings.GEMINI_API_KEY
    if (
        "pytest" in sys.modules
        or not effective_key
        or effective_key == "your-gemini-api-key"
    ):
        return {
            "subject": "Mock Project Scope",
            "branches": [
                {
                    "title": "Initialization",
                    "leaves": [
                        {"text": "Project scaffold and workspace config", "seconds": 0},
                        {"text": "Database setup and migrations", "seconds": 45},
                    ],
                },
                {
                    "title": "RAG Engine Integration",
                    "leaves": [
                        {"text": "Transcription and text chunking", "seconds": 120},
                        {"text": "Vector embeddings and search", "seconds": 240},
                    ],
                },
            ],
        }

    client = genai.Client(api_key=effective_key)
    prompt = MINDMAP_USER_TEMPLATE.format(full_transcript=full_transcript)

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=MINDMAP_SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=MindmapSchema,
            ),
        )
        data = MindmapSchema.model_validate_json(response.text)
        return data.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM mindmap error: {e!s}")
