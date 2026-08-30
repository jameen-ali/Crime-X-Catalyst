"""
Crime X Intelligence Dashboard -- FastAPI Backend
Real Supabase-backed API. Secrets stay on server.
"""

import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routers import firs, analytics, network, predictions, alerts, evidence, search, users, reports, health, chat

load_dotenv()

# Ensure UTF-8 output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# CORS: split comma-separated list, strip whitespace
raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173")
CORS_ORIGINS = [o.strip() for o in raw_origins.split(",") if o.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[Crime X] API starting up...")
    print(f"[Crime X] CORS allowed origins: {CORS_ORIGINS}")
    # Warm up Supabase connection on startup
    try:
        from app.db.supabase_client import get_supabase
        db = get_supabase()
        db.table("case_master").select("case_master_id").limit(1).execute()
        print("[Crime X] Supabase connection OK.")
    except Exception as e:
        print(f"[Crime X] WARNING: Supabase connection failed on startup: {e}")
    yield
    print("[Crime X] API shutting down.")


app = FastAPI(
    title="Crime X Intelligence API",
    description="Karnataka State Police Intelligence Dashboard Backend",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
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
    return {"message": "Crime X API is running", "version": "2.0.0", "docs": "/docs"}
