"""
seed_from_excel.py
==================
Phase 0 — Read Police_FIR_System_Sample_Data.xlsx and seed every sheet
into Supabase Postgres via the supabase-py client.

Usage:
    python backend/scripts/seed_from_excel.py

Requirements (already installed):
    pip install openpyxl supabase python-dotenv
"""

import os
import sys
from pathlib import Path
from datetime import datetime, date

# ── path setup ───────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parents[2]   # Crime X/
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(ROOT / "backend" / ".env")

import openpyxl
from supabase import create_client, Client

# ── Supabase client ───────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    sys.exit("ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) must be set in backend/.env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Excel file ────────────────────────────────────────────────────────────────
EXCEL_PATH = ROOT / "Police_FIR_System_Sample_Data.xlsx"
if not EXCEL_PATH.exists():
    sys.exit(f"ERROR: Excel file not found at {EXCEL_PATH}")

print(f"Loading workbook: {EXCEL_PATH}")
wb = openpyxl.load_workbook(EXCEL_PATH, read_only=True, data_only=True)


# ── helpers ───────────────────────────────────────────────────────────────────
def sheet_to_dicts(sheet_name: str) -> list[dict]:
    """Convert a worksheet to a list of {col: value} dicts, skipping header."""
    ws = wb[sheet_name]
    rows = list(ws.rows)
    if not rows:
        return []
    headers = [c.value for c in rows[0]]
    result = []
    for row in rows[1:]:
        d = {}
        for h, cell in zip(headers, row):
            val = cell.value
            # normalise datetime/date objects to ISO strings
            if isinstance(val, datetime):
                val = val.isoformat()
            elif isinstance(val, date):
                val = val.isoformat()
            d[h] = val
        result.append(d)
    return result


def upsert(table: str, records: list[dict], on_conflict: str = ""):
    """Upsert a batch of records into a Supabase table."""
    if not records:
        print(f"  [SKIP] {table} — no rows")
        return
    try:
        if on_conflict:
            res = supabase.table(table).upsert(records, on_conflict=on_conflict, count="exact").execute()
        else:
            res = supabase.table(table).upsert(records, count="exact").execute()
        print(f"  [OK]   {table} — {len(records)} rows upserted")
    except Exception as e:
        print(f"  [ERR]  {table} — {e}")


# ── mapping helpers ───────────────────────────────────────────────────────────
def remap(raw: list[dict], mapping: dict) -> list[dict]:
    """Rename keys from Excel column names to Postgres column names."""
    out = []
    for row in raw:
        r = {}
        for excel_col, pg_col in mapping.items():
            if pg_col is not None:
                val = row.get(excel_col)
                r[pg_col] = val
        out.append(r)
    return out


# ── seed functions ────────────────────────────────────────────────────────────

def seed_state():
    rows = sheet_to_dicts("State")
    mapped = remap(rows, {
        "StateID": "state_id", "StateName": "state_name",
        "NationalityID": "nationality_id", "Active": "active"
    })
    upsert("state", mapped, "state_id")


def seed_district():
    rows = sheet_to_dicts("District")
    mapped = remap(rows, {
        "DistrictID": "district_id", "DistrictName": "district_name",
        "StateID": "state_id", "Active": "active"
    })
    upsert("district", mapped, "district_id")


def seed_unit_type():
    rows = sheet_to_dicts("UnitType")
    mapped = remap(rows, {
        "UnitTypeID": "unit_type_id", "UnitTypeName": "unit_type_name",
        "CityDistState": "city_dist_state", "Hierarchy": "hierarchy",
        "Active": "active"
    })
    upsert("unit_type", mapped, "unit_type_id")


def seed_unit():
    rows = sheet_to_dicts("Unit")
    mapped = remap(rows, {
        "UnitID": "unit_id", "UnitName": "unit_name",
        "TypeID": "type_id", "ParentUnit": "parent_unit",
        "NationalityID": "nationality_id", "StateID": "state_id",
        "DistrictID": "district_id", "Active": "active"
    })
    upsert("unit", mapped, "unit_id")


def seed_rank():
    rows = sheet_to_dicts("Rank")
    mapped = remap(rows, {
        "RankID": "rank_id", "RankName": "rank_name",
        "Hierarchy": "hierarchy", "Active": "active"
    })
    upsert("rank", mapped, "rank_id")


def seed_designation():
    rows = sheet_to_dicts("Designation")
    mapped = remap(rows, {
        "DesignationID": "designation_id", "DesignationName": "designation_name",
        "Active": "active", "SortOrder": "sort_order"
    })
    upsert("designation", mapped, "designation_id")


def seed_case_category():
    rows = sheet_to_dicts("CaseCategory")
    mapped = remap(rows, {
        "CaseCategoryID": "case_category_id", "LookupValue": "lookup_value"
    })
    upsert("case_category", mapped, "case_category_id")


def seed_gravity_offence():
    rows = sheet_to_dicts("GravityOffence")
    mapped = remap(rows, {
        "GravityOffenceID": "gravity_offence_id", "LookupValue": "lookup_value"
    })
    upsert("gravity_offence", mapped, "gravity_offence_id")


def seed_crime_head():
    rows = sheet_to_dicts("CrimeHead")
    mapped = remap(rows, {
        "CrimeHeadID": "crime_head_id", "CrimeGroupName": "crime_group_name",
        "Active": "active"
    })
    upsert("crime_head", mapped, "crime_head_id")


def seed_crime_sub_head():
    rows = sheet_to_dicts("CrimeSubHead")
    mapped = remap(rows, {
        "CrimeSubHeadID": "crime_sub_head_id", "CrimeHeadID": "crime_head_id",
        "CrimeHeadName": "crime_head_name", "SeqID": "seq_id"
    })
    upsert("crime_sub_head", mapped, "crime_sub_head_id")


def seed_court():
    rows = sheet_to_dicts("Court")
    mapped = remap(rows, {
        "CourtID": "court_id", "CourtName": "court_name",
        "DistrictID": "district_id", "StateID": "state_id",
        "Active": "active"
    })
    upsert("court", mapped, "court_id")


def seed_case_status():
    rows = sheet_to_dicts("CaseStatusMaster")
    mapped = remap(rows, {
        "CaseStatusID": "case_status_id", "CaseStatusName": "case_status_name"
    })
    upsert("case_status_master", mapped, "case_status_id")


def seed_act():
    rows = sheet_to_dicts("Act")
    mapped = remap(rows, {
        "ActCode": "act_code", "ActDescription": "act_description",
        "ShortName": "short_name", "Active": "active"
    })
    upsert("act", mapped, "act_code")


def seed_section():
    rows = sheet_to_dicts("Section")
    mapped = remap(rows, {
        "ActCode": "act_code", "SectionCode": "section_code",
        "SectionDescription": "section_description", "Active": "active"
    })
    upsert("section", mapped, "act_code,section_code")


def seed_caste():
    try:
        rows = sheet_to_dicts("CasteMaster")
    except KeyError:
        print("  [SKIP] CasteMaster — sheet not found")
        return
    # Try to detect columns
    if rows and "CasteID" in rows[0]:
        mapped = [{"caste_id": r.get("CasteID"), "caste_name": r.get("CasteName", "")} for r in rows]
    else:
        mapped = [{"caste_id": i+1, "caste_name": list(r.values())[0]} for i, r in enumerate(rows)]
    upsert("caste_master", mapped, "caste_id")


def seed_religion():
    try:
        rows = sheet_to_dicts("ReligionMaster")
    except KeyError:
        print("  [SKIP] ReligionMaster — sheet not found")
        return
    if rows and "ReligionID" in rows[0]:
        mapped = [{"religion_id": r.get("ReligionID"), "religion_name": r.get("ReligionName", "")} for r in rows]
    else:
        mapped = [{"religion_id": i+1, "religion_name": list(r.values())[0]} for i, r in enumerate(rows)]
    upsert("religion_master", mapped, "religion_id")


def seed_occupation():
    try:
        rows = sheet_to_dicts("OccupationMaster")
    except KeyError:
        print("  [SKIP] OccupationMaster — sheet not found")
        return
    if rows and "OccupationID" in rows[0]:
        mapped = [{"occupation_id": r.get("OccupationID"), "occupation_name": r.get("OccupationName", "")} for r in rows]
    else:
        mapped = [{"occupation_id": i+1, "occupation_name": list(r.values())[0]} for i, r in enumerate(rows)]
    upsert("occupation_master", mapped, "occupation_id")


def seed_employee():
    rows = sheet_to_dicts("Employee")
    mapped = remap(rows, {
        "EmployeeID": "employee_id", "DistrictID": "district_id",
        "UnitID": "unit_id", "RankID": "rank_id",
        "DesignationID": "designation_id", "KGID": "kgid",
        "FirstName": "first_name", "EmployeeDOB": "employee_dob",
        "GenderID": "gender_id", "BloodGroupID": "blood_group_id",
        "PhysicallyChallenged": "physically_challenged",
        "AppointmentDate": "appointment_date"
    })
    upsert("employee", mapped, "employee_id")


def seed_case_master():
    rows = sheet_to_dicts("CaseMaster")
    mapped = remap(rows, {
        "CaseMasterID": "case_master_id", "CrimeNo": "crime_no",
        "CaseNo": "case_no", "CrimeRegisteredDate": "crime_registered_date",
        "PolicePersonID": "police_person_id", "PoliceStationID": "police_station_id",
        "CaseCategoryID": "case_category_id", "GravityOffenceID": "gravity_offence_id",
        "CrimeMajorHeadID": "crime_major_head_id", "CrimeMinorHeadID": "crime_minor_head_id",
        "CaseStatusID": "case_status_id", "CourtID": "court_id",
        "IncidentFromDate": "incident_from_date", "IncidentToDate": "incident_to_date",
        "InfoReceivedPSDate": "info_received_ps_date",
        "latitude": "latitude", "longitude": "longitude",
        "BriefFacts": "brief_facts"
    })
    # Clear dependent tables first, then clear case_master to allow clean re-seed
    for dep in ["chargesheet_details", "arrest_surrender", "accused", "victim",
                "complainant_details"]:
        try:
            supabase.table(dep).delete().gt("case_master_id", 0).execute()
        except Exception as ex:
            print(f"    [warn] could not clear {dep}: {ex}")
    try:
        supabase.table("case_master").delete().gt("case_master_id", 0).execute()
        print("    [OK] case_master cleared for re-seed")
    except Exception as ex:
        print(f"    [warn] could not clear case_master: {ex}")
    upsert("case_master", mapped, "case_master_id")


def seed_complainant_details():
    rows = sheet_to_dicts("ComplainantDetails")
    mapped = remap(rows, {
        "ComplainantID": "complainant_id", "CaseMasterID": "case_master_id",
        "ComplainantName": "complainant_name", "AgeYear": "age_year",
        "OccupationID": "occupation_id", "ReligionID": "religion_id",
        "CasteID": "caste_id", "GenderID": "gender_id"
    })
    upsert("complainant_details", mapped, "complainant_id")


def seed_victim():
    rows = sheet_to_dicts("Victim")
    mapped = remap(rows, {
        "VictimMasterID": "victim_master_id", "CaseMasterID": "case_master_id",
        "VictimName": "victim_name", "AgeYear": "age_year",
        "GenderID": "gender_id", "VictimPolice": "victim_police"
    })
    upsert("victim", mapped, "victim_master_id")


def seed_accused():
    rows = sheet_to_dicts("Accused")
    mapped = remap(rows, {
        "AccusedMasterID": "accused_master_id", "CaseMasterID": "case_master_id",
        "AccusedName": "accused_name", "AgeYear": "age_year",
        "GenderID": "gender_id", "PersonID": "person_id"
    })
    upsert("accused", mapped, "accused_master_id")


def seed_arrest_surrender():
    rows = sheet_to_dicts("ArrestSurrender")
    mapped = remap(rows, {
        "ArrestSurrenderID": "arrest_surrender_id",
        "CaseMasterID": "case_master_id",
        "ArrestSurrenderTypeID": "arrest_surrender_type_id",
        "ArrestSurrenderDate": "arrest_surrender_date",
        "ArrestSurrenderStateId": "arrest_surrender_state_id",
        "ArrestSurrenderDistrictId": "arrest_surrender_district_id",
        "PoliceStationID": "police_station_id",
        "IOID": "io_id",
        "CourtID": "court_id",
        "AccusedMasterID": "accused_master_id",
        "IsAccused": "is_accused",
        "IsComplainantAccused": "is_complainant_accused"
    })
    upsert("arrest_surrender", mapped, "arrest_surrender_id")


def seed_chargesheet():
    rows = sheet_to_dicts("ChargesheetDetails")
    mapped = remap(rows, {
        "CSID": "cs_id", "CaseMasterID": "case_master_id",
        "csdate": "cs_date", "cstype": "cs_type",
        "PolicePersonID": "police_person_id"
    })
    upsert("chargesheet_details", mapped, "cs_id")


# ── main ──────────────────────────────────────────────────────────────────────
def main():
    print("\n=== Phase 0: Seeding KSP database from Excel ===\n")
    print("NOTE: Run backend/scripts/create_tables.sql in the Supabase SQL Editor first!\n")

    # Seed order matters — respects FK dependencies
    print("[1/5] Seeding lookup/reference tables...")
    seed_state()
    seed_district()
    seed_unit_type()
    seed_unit()
    seed_rank()
    seed_designation()
    seed_case_category()
    seed_gravity_offence()
    seed_crime_head()
    seed_crime_sub_head()
    seed_court()
    seed_case_status()
    seed_act()
    seed_section()
    seed_caste()
    seed_religion()
    seed_occupation()

    print("\n[2/5] Seeding employees (officers)...")
    seed_employee()

    print("\n[3/5] Seeding cases (CaseMaster)...")
    seed_case_master()

    print("\n[4/5] Seeding complainants, victims, accused...")
    seed_complainant_details()
    seed_victim()
    seed_accused()

    print("\n[5/5] Seeding arrest / chargesheet records...")
    seed_arrest_surrender()
    seed_chargesheet()

    print("\n=== Phase 0 DONE! All Excel data loaded into Supabase. ===\n")


if __name__ == "__main__":
    main()
