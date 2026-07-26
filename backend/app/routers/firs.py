from fastapi import APIRouter, Query
from typing import Optional
from app.data.mock_data import MOCK_FIRS
import math

router = APIRouter()


@router.get("")
async def get_all_firs(
    district: Optional[str] = None,
    station: Optional[str] = None,
    crimeType: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
):
    data = list(MOCK_FIRS)

    if district:
        data = [f for f in data if f["district"] == district]
    if station:
        data = [f for f in data if f["station"] == station]
    if crimeType:
        data = [f for f in data if f["crimeType"] == crimeType]
    if status:
        data = [f for f in data if f["status"] == status]
    if search:
        q = search.lower()
        data = [
            f for f in data
            if q in f["firNumber"].lower() or q in f["crimeType"].lower()
            or q in f["victimName"].lower() or q in f["suspectName"].lower()
            or q in f["location"].lower()
        ]

    total = len(data)
    items = data[(page - 1) * pageSize: page * pageSize]
    return {"items": items, "total": total, "page": page, "pageSize": pageSize, "totalPages": math.ceil(total / pageSize)}


@router.get("/{fir_id}")
async def get_fir(fir_id: str):
    fir = next((f for f in MOCK_FIRS if f["id"] == fir_id), None)
    return fir


@router.patch("/{fir_id}")
async def update_fir(fir_id: str, patch: dict):
    idx = next((i for i, f in enumerate(MOCK_FIRS) if f["id"] == fir_id), None)
    if idx is not None:
        MOCK_FIRS[idx].update(patch)
        return MOCK_FIRS[idx]
    return {"error": "FIR not found"}
