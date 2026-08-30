"""
backend/app/routers/health.py
Real connectivity health check against Supabase.
"""
from fastapi import APIRouter
import time

router = APIRouter()


@router.get("")
async def get_health():
    results = {}

    # Check Supabase connectivity
    start = time.time()
    try:
        from app.db.supabase_client import get_supabase
        db   = get_supabase()
        resp = db.table("case_master").select("case_master_id").limit(1).execute()
        latency = round((time.time() - start) * 1000)
        results["postgresql"] = {
            "status":  "online",
            "latency": latency,
            "version": "Supabase PostgreSQL 15",
            "connected": True,
        }
    except Exception as e:
        results["postgresql"] = {
            "status":  "offline",
            "latency": round((time.time() - start) * 1000),
            "error":   str(e),
            "connected": False,
        }

    # Other services — marked as not configured if env vars absent
    import os
    results["mistral"] = {
        "status": "configured" if os.getenv("MISTRAL_API_KEY") else "not_configured",
        "latency": 0,
    }
    results["qdrant"] = {
        "status": "configured" if os.getenv("QDRANT_URL") else "not_configured",
        "latency": 0,
    }

    return results
