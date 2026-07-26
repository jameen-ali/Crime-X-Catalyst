"""
Crime X Intelligence Dashboard -- FastAPI Backend
Mirrors the mock API contract from frontend/src/mockApi/
"""

import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routers import firs, analytics, network, predictions, alerts, evidence, search, users, reports, health, chat

load_dotenv()

# Ensure UTF-8 output on Windows so logging never crashes on non-ASCII
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[Crime X] API starting up...")
    yield
    print("[Crime X] API shutting down.")


app = FastAPI(
    title="Crime X Intelligence API",
    description="Karnataka State Police Intelligence Dashboard Backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(firs.router,         prefix="/api/firs",        tags=["FIRs"])
app.include_router(analytics.router,    prefix="/api/analytics",   tags=["Analytics"])
app.include_router(network.router,      prefix="/api/network",     tags=["Criminal Network"])
app.include_router(predictions.router,  prefix="/api/predictions", tags=["Predictions"])
app.include_router(alerts.router,       prefix="/api/alerts",      tags=["Alerts"])
app.include_router(evidence.router,     prefix="/api/evidence",    tags=["Evidence"])
app.include_router(search.router,       prefix="/api/search",      tags=["Smart Search"])
app.include_router(users.router,        prefix="/api/users",       tags=["Users/Officers"])
app.include_router(reports.router,      prefix="/api/reports",     tags=["Reports"])
app.include_router(health.router,       prefix="/api/health",      tags=["Health"])
app.include_router(chat.router,         prefix="/api/chat",        tags=["AI Chat"])


@app.get("/", tags=["Root"])
async def root():
    return {"message": "Crime X API is running", "docs": "/docs"}
