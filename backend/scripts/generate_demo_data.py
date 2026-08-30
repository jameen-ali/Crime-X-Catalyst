import sys
import os
import random
import uuid
import math
from datetime import datetime, timedelta

# Add backend to path so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

try:
    from app.db.supabase_client import get_supabase
    db = get_supabase()
except Exception as e:
    print(f"Failed to initialize Supabase client: {e}")
    sys.exit(1)

CRIME_TYPES = [
    "Theft", "Burglary", "Assault", "Cybercrime", "Fraud",
    "Missing Person", "Homicide", "Narcotics", "Vandalism", "Kidnapping"
]

DISTRICTS = [
    "Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Hubballi-Dharwad",
    "Mangaluru", "Belagavi", "Kalaburagi", "Tumakuru", "Shivamogga", "Ballari"
]

STATUSES = {
    1: "Open",
    2: "Under Investigation",
    3: "Closed",
    4: "Pending"
}

def generate_random_date(start_days_ago=365):
    now = datetime.now()
    delta = timedelta(days=random.randint(0, start_days_ago), hours=random.randint(0, 23))
    return (now - delta).isoformat()

def seed_data(num_cases=1000):
    print(f"Starting to seed {num_cases} demo FIRs and related records...")
    
    try:
        # We assume the schema exists (the user ran schema.sql)
        # Create Districts
        district_ids = []
        for d in DISTRICTS:
            res = db.table("district").insert({"district_name": d}).execute()
            district_ids.append(res.data[0]["district_id"])
            
        # Create Units (Police Stations)
        unit_ids = []
        for i in range(20):
            res = db.table("unit").insert({
                "unit_name": f"Station {i}",
                "district_id": random.choice(district_ids)
            }).execute()
            unit_ids.append(res.data[0]["police_station_id"])
            
        # Create Employees
        emp_ids = []
        for i in range(50):
            res = db.table("employee").insert({
                "first_name": f"Officer_{i}",
                "kgid": f"KGID{random.randint(10000, 99999)}_{i}"
            }).execute()
            emp_ids.append(res.data[0]["police_person_id"])
            
        # Create Crime Heads
        head_ids = []
        for ch in CRIME_TYPES:
            res = db.table("crime_head").insert({"crime_group_name": ch}).execute()
            head_ids.append(res.data[0]["crime_major_head_id"])
            
    except Exception as e:
        print(f"Failed to seed master data: {e}")
        return
        
    print("Master data created. Seeding cases...")
    
    cases_inserted = 0
    
    for i in range(num_cases):
        lat = 12.9716 + random.uniform(-2.0, 2.0)
        lng = 77.5946 + random.uniform(-2.0, 2.0)
        
        case_status = random.choice(list(STATUSES.keys()))
        
        try:
            # Insert Case
            c_res = db.table("case_master").insert({
                "crime_no": f"FIR-{datetime.now().year}-{random.randint(1000, 99999)}-{i}",
                "case_no": f"CR-{random.randint(100000, 999999)}-{i}",
                "crime_registered_date": generate_random_date(180),
                "incident_from_date": generate_random_date(200),
                "brief_facts": f"Demo case details for a reported incident.",
                "latitude": lat,
                "longitude": lng,
                "case_status_id": case_status,
                "crime_major_head_id": random.choice(head_ids),
                "police_person_id": random.choice(emp_ids),
                "police_station_id": random.choice(unit_ids),
            }).execute()
            
            case_id = c_res.data[0]["case_master_id"]
            
            # Insert Accused
            db.table("accused").insert({
                "case_master_id": case_id,
                "accused_name": f"Suspect_{random.randint(1, 1000)}",
                "age_year": random.randint(18, 60),
                "risk_score": random.randint(0, 100)
            }).execute()
            
            # Insert Victim
            db.table("victim").insert({
                "case_master_id": case_id,
                "victim_name": f"Victim_{random.randint(1, 1000)}",
                "age_year": random.randint(18, 80),
                "gender_id": random.randint(1, 2)
            }).execute()
            
            # Insert Evidence
            db.table("evidence").insert({
                "case_master_id": case_id,
                "file_name": f"evidence_{random.randint(100, 999)}.jpg",
                "description": "Scene photograph",
                "type": "Image"
            }).execute()
            
            cases_inserted += 1
            if cases_inserted % 50 == 0:
                print(f"Inserted {cases_inserted}/{num_cases} cases...")
                
        except Exception as e:
            print(f"Insert failed at index {i}: {e}")
            break

    print(f"Seeding complete. Inserted {cases_inserted} cases.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Seed demo data to Supabase.")
    parser.add_argument("--count", type=int, default=1000, help="Number of cases to generate.")
    args = parser.parse_args()
    seed_data(args.count)
