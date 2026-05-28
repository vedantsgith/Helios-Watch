"""
Helios-Watch Backend — FastAPI Application Entry Point

New clean architecture entry point. Replaces the old flat backend/app.py.
Run with: uvicorn app.main:app --reload --port 8001
"""

import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api import auth, solar

app = FastAPI(
    title="Helios-Watch API",
    description="Real-time solar anomaly monitoring system — NOAA data pipeline",
    version="3.0.0",
)

# ─── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(solar.router)

# ─── Startup ──────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    """Start the background heartbeat task on server startup."""
    asyncio.create_task(solar.heartbeat())
