import logging
from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.chat import router as chat_router
from app.api.v1.ingest import router as ingest_router
from app.api.v1.notebook import router as notebook_router
from app.api.v1.webhook import router as webhook_router
from app.core.config import settings
from app.core.database import (
    close_db_connection,
    start_default_videos_ingestion,
    verify_db_connection,
)

logger = logging.getLogger("uvicorn.error")

if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=1.0,
        send_default_pii=True,
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup validation of core APIs
    db_ok = await verify_db_connection()
    if not db_ok:
        logger.warning("FastAPI startup: Database connection check failed.")
    else:
        start_default_videos_ingestion()

    # Log configuration states securely
    logger.info(f"FastAPI startup: ENVIRONMENT={settings.ENVIRONMENT}")
    logger.info(
        f"FastAPI startup: SUPABASE_URL={'configured' if settings.SUPABASE_URL else 'missing'}"
    )
    logger.info(
        f"FastAPI startup: QSTASH_TOKEN={'configured' if settings.QSTASH_TOKEN else 'missing'}"
    )

    gemini_key = settings.GEMINI_API_KEY
    if gemini_key:
        masked = (
            f"{gemini_key[:4]}...{gemini_key[-4:]}" if len(gemini_key) > 8 else "***"
        )
        logger.info(
            f"FastAPI startup: GEMINI_API_KEY={masked} (length {len(gemini_key)})"
        )
    else:
        logger.warning("FastAPI startup: GEMINI_API_KEY is missing/empty.")

    yield
    # Cleanup handlers go here
    logger.info("FastAPI shutdown: Cleaning up application lifecycle resources.")
    close_db_connection()


app = FastAPI(title="TubeRAG Backend", lifespan=lifespan)

# Add CORS Middleware to enable frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest_router)
app.include_router(webhook_router)
app.include_router(chat_router)
app.include_router(notebook_router)
