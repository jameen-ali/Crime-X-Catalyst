from fastapi import APIRouter
from app.data.mock_data import MOCK_PREDICTIONS
import random

router = APIRouter()


@router.get("")
async def get_predictions():
    return MOCK_PREDICTIONS


@router.get("/forecast")
async def get_forecast():
    weeks = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"]
    return [{"name": w, "predicted": random.randint(40, 90), "actual": random.randint(35, 80)} for w in weeks]


@router.get("/risk-gauge")
async def get_risk_gauge():
    return {
        "riskScore": 72,
        "trend": "increasing",
        "factors": ["Weekend approaching", "Two upcoming events", "Historical spike pattern"],
    }
