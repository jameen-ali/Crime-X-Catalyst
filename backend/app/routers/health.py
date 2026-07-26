from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def get_health():
    return {
        "postgresql":    {"status": "online",   "latency": 12,  "version": "15.4"},
        "neo4j":         {"status": "online",   "latency": 18,  "version": "5.12"},
        "qdrant":        {"status": "online",   "latency": 8,   "version": "1.7.0"},
        "elasticsearch": {"status": "degraded", "latency": 145, "version": "8.10.0"},
        "redis":         {"status": "online",   "latency": 2,   "version": "7.2.0"},
    }
