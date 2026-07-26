"""
fix_karnataka_coordinates.py
=============================
Fast batch update of all Supabase district, unit, and case_master coordinates
strictly within Karnataka district boundaries.
"""

import os
import sys
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(ROOT / "backend" / ".env")

from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    sys.exit("ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) must be set in backend/.env")

sp: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 31 Karnataka Districts with exact geographical bounds
KARNATAKA_DISTRICTS = {
    "Bengaluru Urban":  {"id": 1,  "lat_min": 12.830, "lat_max": 13.140, "lng_min": 77.450, "lng_max": 77.750},
    "Mysuru":           {"id": 2,  "lat_min": 12.100, "lat_max": 12.500, "lng_min": 76.350, "lng_max": 76.900},
    "Belagavi":         {"id": 3,  "lat_min": 15.550, "lat_max": 16.200, "lng_min": 74.200, "lng_max": 74.850},
    "Hubballi-Dharwad": {"id": 4,  "lat_min": 15.250, "lat_max": 15.650, "lng_min": 74.900, "lng_max": 75.250},
    "Mangaluru":        {"id": 5,  "lat_min": 12.700, "lat_max": 13.100, "lng_min": 74.800, "lng_max": 75.300},
    "Kalaburagi":       {"id": 6,  "lat_min": 17.000, "lat_max": 17.600, "lng_min": 76.450, "lng_max": 77.150},
    "Shivamogga":       {"id": 7,  "lat_min": 13.700, "lat_max": 14.200, "lng_min": 75.200, "lng_max": 75.850},
    "Tumakuru":         {"id": 8,  "lat_min": 13.150, "lat_max": 13.800, "lng_min": 76.600, "lng_max": 77.300},
    "Bengaluru Rural":  {"id": 16, "lat_min": 13.080, "lat_max": 13.400, "lng_min": 77.350, "lng_max": 77.800},
    "Ballari":          {"id": 17, "lat_min": 14.900, "lat_max": 15.400, "lng_min": 76.650, "lng_max": 77.150},
    "Vijayapura":       {"id": 18, "lat_min": 16.500, "lat_max": 17.150, "lng_min": 75.350, "lng_max": 76.100},
    "Bidar":            {"id": 19, "lat_min": 17.700, "lat_max": 18.050, "lng_min": 77.150, "lng_max": 77.600},
    "Raichur":          {"id": 20, "lat_min": 15.900, "lat_max": 16.500, "lng_min": 76.800, "lng_max": 77.500},
    "Davanagere":       {"id": 21, "lat_min": 14.250, "lat_max": 14.700, "lng_min": 75.650, "lng_max": 76.150},
    "Udupi":            {"id": 22, "lat_min": 13.150, "lat_max": 13.650, "lng_min": 74.680, "lng_max": 75.000},
    "Uttara Kannada":   {"id": 23, "lat_min": 14.300, "lat_max": 15.150, "lng_min": 74.150, "lng_max": 74.700},
    "Kolar":            {"id": 24, "lat_min": 12.950, "lat_max": 13.400, "lng_min": 77.900, "lng_max": 78.350},
    "Chikkaballapura":  {"id": 25, "lat_min": 13.250, "lat_max": 13.700, "lng_min": 77.450, "lng_max": 78.000},
    "Chitradurga":      {"id": 26, "lat_min": 13.900, "lat_max": 14.450, "lng_min": 76.100, "lng_max": 76.750},
    "Hassan":           {"id": 27, "lat_min": 12.750, "lat_max": 13.350, "lng_min": 75.750, "lng_max": 76.400},
    "Chikkamagaluru":   {"id": 28, "lat_min": 13.100, "lat_max": 13.650, "lng_min": 75.350, "lng_max": 75.950},
    "Kodagu":           {"id": 29, "lat_min": 12.100, "lat_max": 12.650, "lng_min": 75.450, "lng_max": 76.050},
    "Mandya":           {"id": 30, "lat_min": 12.300, "lat_max": 12.800, "lng_min": 76.550, "lng_max": 77.150},
    "Ramanagara":       {"id": 31, "lat_min": 12.450, "lat_max": 12.950, "lng_min": 77.100, "lng_max": 77.480},
    "Chamarajanagar":   {"id": 32, "lat_min": 11.700, "lat_max": 12.150, "lng_min": 76.600, "lng_max": 77.250},
    "Gadag":            {"id": 33, "lat_min": 15.150, "lat_max": 15.700, "lng_min": 75.350, "lng_max": 75.950},
    "Haveri":           {"id": 34, "lat_min": 14.450, "lat_max": 15.000, "lng_min": 75.100, "lng_max": 75.650},
    "Bagalkote":        {"id": 35, "lat_min": 15.900, "lat_max": 16.450, "lng_min": 75.300, "lng_max": 76.000},
    "Koppal":           {"id": 36, "lat_min": 15.100, "lat_max": 15.700, "lng_min": 75.850, "lng_max": 76.450},
    "Vijayanagara":     {"id": 37, "lat_min": 14.900, "lat_max": 15.500, "lng_min": 76.100, "lng_max": 76.700},
    "Yadgir":           {"id": 38, "lat_min": 16.450, "lat_max": 17.050, "lng_min": 76.750, "lng_max": 77.400},
}

def main():
    print("=== Fast Batch Updating Karnataka Coordinates ===")
    
    # 1. Upsert districts with state_id = 1
    district_records = [
        {"district_id": meta["id"], "district_name": name, "state_id": 1, "active": 1}
        for name, meta in KARNATAKA_DISTRICTS.items()
    ]
    sp.table("district").upsert(district_records).execute()
    print(f"Upserted {len(district_records)} districts.")

    # 2. Get units and map to district names
    units = sp.table("unit").select("unit_id, district_id, district(district_name)").execute().data
    ka_district_metas = list(KARNATAKA_DISTRICTS.values())
    unit_district_map = {}

    for u in units:
        d_name = u.get("district", {}).get("district_name") if u.get("district") else None
        if not d_name or d_name not in KARNATAKA_DISTRICTS:
            # Reassign unit to a valid KA district
            random_meta = random.choice(ka_district_metas)
            d_name = [name for name, meta in KARNATAKA_DISTRICTS.items() if meta["id"] == random_meta["id"]][0]
            sp.table("unit").update({"district_id": random_meta["id"]}).eq("unit_id", u["unit_id"]).execute()
        unit_district_map[u["unit_id"]] = d_name

    print("Units mapped.")

    # 3. Fetch all cases
    cases = sp.table("case_master").select("case_master_id, police_station_id").execute().data
    print(f"Updating {len(cases)} cases...")

    upsert_payload = []
    for c in cases:
        cid = c["case_master_id"]
        ps_id = c.get("police_station_id")
        d_name = unit_district_map.get(ps_id, "Bengaluru Urban")
        meta = KARNATAKA_DISTRICTS.get(d_name, KARNATAKA_DISTRICTS["Bengaluru Urban"])

        lat = round(random.uniform(meta["lat_min"], meta["lat_max"]), 6)
        lng = round(random.uniform(meta["lng_min"], meta["lng_max"]), 6)

        upsert_payload.append({
            "case_master_id": cid,
            "latitude": lat,
            "longitude": lng
        })

    # Upsert in chunks of 500
    for i in range(0, len(upsert_payload), 500):
        chunk = upsert_payload[i:i+500]
        sp.table("case_master").upsert(chunk).execute()
        print(f"Upserted chunk {i+len(chunk)}/{len(upsert_payload)}")

    print("=== Done! ===")

if __name__ == "__main__":
    main()
