import os
import sys
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / "backend" / ".env")

from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

tables = [
    "state", "district", "unit_type", "unit", "rank", "designation", 
    "case_category", "gravity_offence", "crime_head", "crime_sub_head",
    "court", "case_status_master", "act", "section", "caste_master", 
    "religion_master", "occupation_master", "employee", "case_master", 
    "complainant_details", "victim", "accused", "arrest_surrender", 
    "chargesheet_details", "chat_messages", "assignments", "audit_logs", 
    "evidence", "notifications", "patrol_logs", "patrol_vehicles", "alerts"
]

print("Checking table row counts via Supabase REST API:")
for table in tables:
    try:
        res = supabase.table(table).select("*", count="exact").limit(0).execute()
        print(f"  {table}: {res.count} rows")
    except Exception as e:
        print(f"  [ERROR]  {table}: {e}")

