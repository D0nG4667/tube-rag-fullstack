from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1.ingest import router as ingest_router
from app.api.v1.webhook import router as webhook_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup validation of core APIs
    yield
    # Cleanup handlers go here


app = FastAPI(title="TubeRAG Backend", lifespan=lifespan)
app.include_router(ingest_router)
app.include_router(webhook_router)
