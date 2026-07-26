from fastapi import APIRouter, Query
from typing import Optional
from app.data.mock_data import MOCK_ALERTS

router = APIRouter()


@router.get("")
async def get_alerts(
    type: Optional[str] = None,
    severity: Optional[str] = None,
):
    data = list(MOCK_ALERTS)
    if type:
        data = [a for a in data if a["type"] == type]
    if severity:
        data = [a for a in data if a["severity"] == severity]
    data.sort(key=lambda a: a["timestamp"], reverse=True)
    return data


@router.patch("/{alert_id}/read")
async def mark_read(alert_id: str):
    alert = next((a for a in MOCK_ALERTS if a["id"] == alert_id), None)
    if alert:
        alert["isRead"] = True
    return {"success": True}
