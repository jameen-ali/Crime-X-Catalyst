from fastapi import APIRouter
from app.data.mock_data import MOCK_OFFICERS, MOCK_AUDIT_LOGS
import time

router = APIRouter()


@router.get("")
async def get_all():
    return MOCK_OFFICERS


@router.get("/audit-logs")
async def audit_logs():
    return MOCK_AUDIT_LOGS


@router.get("/{officer_id}")
async def get_officer(officer_id: str):
    return next((o for o in MOCK_OFFICERS if o["id"] == officer_id), None)


@router.post("")
async def create_officer(data: dict):
    new_officer = {"id": f"off-{int(time.time())}", **data}
    MOCK_OFFICERS.append(new_officer)
    return new_officer


@router.delete("/{officer_id}")
async def delete_officer(officer_id: str):
    idx = next((i for i, o in enumerate(MOCK_OFFICERS) if o["id"] == officer_id), None)
    if idx is not None:
        MOCK_OFFICERS.pop(idx)
    return {"success": True}
