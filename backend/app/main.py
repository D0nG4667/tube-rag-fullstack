from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.ingest import router as ingest_router
from app.api.v1.webhook import router as webhook_router
from app.api.v1.chat import router as chat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup validation of core APIs
    yield
    # Cleanup handlers go here


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
