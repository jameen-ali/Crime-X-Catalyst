"""
backend/app/routers/firs.py
Real Supabase-backed FIR/case endpoints using the service role key.
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
import math

router = APIRouter()


def _db():
    from app.db.supabase_client import get_supabase
    return get_supabase()


@router.get("")
async def get_all_firs(
    district: Optional[str] = None,
    status: Optional[str] = None,
    crimeType: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
):
    try:
        db = _db()
        query = db.table("case_master").select(
            "case_master_id,crime_no,case_no,crime_registered_date,incident_from_date,"
            "brief_facts,latitude,longitude,case_status_id,"
            "case_status_master:case_status_id(case_status_name),"
            "crime_head:crime_major_head_id(crime_group_name),"
            "employee:police_person_id(first_name),"
            "unit:police_station_id(unit_name,district:district_id(district_name)),"
            "victim(victim_name,age_year,gender_id),"
            "accused(accused_name,age_year)"
        )

        # Apply search filter
        if search:
            query = query.or_(
                f"crime_no.ilike.%{search}%,case_no.ilike.%{search}%,brief_facts.ilike.%{search}%"
            )

        # Status filter by name
        if status:
            status_map = {"Open": 1, "Under Investigation": 2, "Closed": 3, "Pending": 4}
            status_id = status_map.get(status)
            if status_id:
                query = query.eq("case_status_id", status_id)

        count_query = db.table("case_master").select("case_master_id", count="exact")
        if search:
            count_query = count_query.or_(
                f"crime_no.ilike.%{search}%,case_no.ilike.%{search}%,brief_facts.ilike.%{search}%"
            )
        count_resp = count_query.execute()
        total = count_resp.count or 0

        offset = (page - 1) * pageSize
        resp = query.order("crime_registered_date", desc=True).range(offset, offset + pageSize - 1).execute()
        items = resp.data or []

        return {
            "items": items, "total": total,
            "page": page, "pageSize": pageSize,
            "totalPages": math.ceil(total / pageSize) if total > 0 else 0,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FIR list query failed: {e}")


@router.get("/{fir_id}")
async def get_fir(fir_id: str):
    try:
        db = _db()
        resp = db.table("case_master").select(
            "*,"
            "case_status_master:case_status_id(case_status_name),"
            "crime_head:crime_major_head_id(crime_group_name),"
            "employee:police_person_id(first_name,kgid),"
            "unit:police_station_id(unit_name,district:district_id(district_name)),"
            "victim(*),accused(*),complainant_details(*),evidence(*)"
        ).eq("case_master_id", fir_id).single().execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="FIR not found")
        return resp.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FIR detail query failed: {e}")


@router.patch("/{fir_id}")
async def update_fir(fir_id: str, patch: dict):
    try:
        db = _db()
        # Remove fields that should not be directly patched
        safe_patch = {k: v for k, v in patch.items() if k not in ("case_master_id",)}
        resp = db.table("case_master").update(safe_patch).eq("case_master_id", fir_id).execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="FIR not found or no changes")
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FIR update failed: {e}")
