from fastapi import APIRouter
from app.data.mock_data import MOCK_FIRS, MOCK_KPIS, get_crime_trend, get_crime_distribution
from datetime import datetime

router = APIRouter()


@router.post("/generate")
async def generate_report(body: dict):
    report_type = body.get("type", "summary")
    options = body.get("options", {})
    return {
        "type": report_type,
        "options": options,
        "firs": MOCK_FIRS[:20],
        "kpis": MOCK_KPIS,
        "trend": get_crime_trend(),
        "distribution": get_crime_distribution(),
        "generatedAt": datetime.utcnow().isoformat() + "Z",
    }
