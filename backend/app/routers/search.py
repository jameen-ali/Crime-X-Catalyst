"""
backend/app/routers/search.py
Real Supabase-backed multi-entity search using service role key.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional

router = APIRouter()


def _db():
    from app.db.supabase_client import get_supabase
    return get_supabase()


@router.get("")
async def search(
    q: str = "",
    district: Optional[str] = None,
    status: Optional[str] = None,
    sortBy: Optional[str] = None,
):
    if not q or len(q.strip()) < 2:
        return {"query": q, "total": 0, "firs": [], "persons": [], "vehicles": [], "evidence": [], "officers": []}

    raw = q.strip()
    try:
        db = _db()

        firs, persons, officers, vehicles, evidence = [], [], [], [], []

        try:
            cases_resp = db.table("case_master").select(
                "case_master_id,crime_no,case_no,crime_registered_date,incident_from_date,"
                "brief_facts,latitude,longitude,case_status_id,"
                "case_status_master:case_status_id(case_status_name),"
                "crime_head:crime_major_head_id(crime_group_name),"
                "employee:police_person_id(first_name),"
                "unit:police_station_id(unit_name,district:district_id(district_name)),"
                "victim(victim_name,age_year),"
                "accused(accused_name,age_year)"
            ).or_(
                f"crime_no.ilike.%{raw}%,case_no.ilike.%{raw}%,brief_facts.ilike.%{raw}%"
            ).limit(40).execute()
            firs = cases_resp.data or []
        except Exception: pass

        try:
            accused_resp = db.table("accused").select(
                "accused_id,accused_name,age_year,risk_score,"
                "case_master:case_master_id(case_no,crime_no)"
            ).ilike("accused_name", f"%{raw}%").limit(30).execute()
            persons.extend(accused_resp.data or [])
        except Exception: pass

        try:
            victim_resp = db.table("victim").select(
                "victim_id,victim_name,age_year,gender_id,"
                "case_master:case_master_id(case_no,crime_no)"
            ).ilike("victim_name", f"%{raw}%").limit(20).execute()
            persons.extend(victim_resp.data or [])
        except Exception: pass

        try:
            officer_resp = db.table("employee").select(
                "police_person_id,first_name,kgid"
            ).or_(f"first_name.ilike.%{raw}%,kgid.ilike.%{raw}%").limit(20).execute()
            officers = officer_resp.data or []
        except Exception: pass

        try:
            vehicles_resp = db.table("patrol_vehicles").select("*").or_(
                f"registration_number.ilike.%{raw}%,make.ilike.%{raw}%,model.ilike.%{raw}%"
            ).limit(20).execute()
            vehicles = vehicles_resp.data or []
        except Exception: pass

        try:
            evidence_resp = db.table("evidence").select(
                "*,case_master:case_master_id(case_no,crime_no)"
            ).or_(
                f"file_name.ilike.%{raw}%,description.ilike.%{raw}%"
            ).limit(20).execute()
            evidence = evidence_resp.data or []
        except Exception: pass

        total = len(firs) + len(persons) + len(officers) + len(vehicles) + len(evidence)

        return {
            "query": q, "total": total,
            "firs": firs, "persons": persons,
            "officers": officers, "vehicles": vehicles, "evidence": evidence,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {e}")


@router.get("/suggestions")
async def suggestions(q: str = ""):
    if not q or len(q.strip()) < 2:
        return []
    raw = q.strip()
    try:
        db = _db()
        items = []

        cases_r = db.table("case_master").select("case_no,crime_no").or_(
            f"crime_no.ilike.%{raw}%,case_no.ilike.%{raw}%"
        ).limit(3).execute()
        for c in (cases_r.data or []):
            no = c.get("case_no") or c.get("crime_no")
            if no:
                items.append({"label": f"Case {no}", "type": "FIR"})

        accused_r = db.table("accused").select("accused_name").ilike("accused_name", f"%{raw}%").limit(3).execute()
        for a in (accused_r.data or []):
            if a.get("accused_name"):
                items.append({"label": f"Suspect {a['accused_name']}", "type": "Person"})

        officer_r = db.table("employee").select("first_name").ilike("first_name", f"%{raw}%").limit(3).execute()
        for o in (officer_r.data or []):
            if o.get("first_name"):
                items.append({"label": f"Officer {o['first_name']}", "type": "Officer"})

        return items[:8]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Suggestions failed: {e}")
