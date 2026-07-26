"""
populate_all_karnataka_districts.py
===================================
Expands the Karnataka State Police (KSP) database to cover ALL 31 Karnataka districts
with realistic, interconnected, synthetic police data:
• Police Stations / Units (3-5 per district)
• Police Officers / Employees (15-30 per district)
• Cases / FIRs (25-35 per district) with tight district-specific GPS bounding boxes
• Complainant Details (1 per FIR)
• Victim Records (1-2 per FIR)
• Accused & Suspect Records (1-2 per FIR)
• Evidence & Media (2-4 per FIR)
• Patrol & Suspect Vehicles (3-5 per district)
• Intelligence Alerts (2-4 per district)

Everything is inserted directly into Supabase PostgreSQL tables.
"""

import os
import sys
import random
from pathlib import Path
from datetime import datetime, timedelta

ROOT = Path(__file__).resolve().parents[2]   # Crime X/
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(ROOT / "backend" / ".env")

from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    sys.exit("ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in backend/.env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Geographical Bounds for Karnataka Districts ────────────────────────────────
DISTRICT_BOUNDS = {
    "Bengaluru Urban": (12.8300, 13.1400, 77.4500, 77.7500),
    "Mysuru": (12.1500, 12.5000, 76.5000, 76.8000),
    "Belagavi": (15.7000, 16.1000, 74.4000, 74.8000),
    "Hubballi-Dharwad": (15.3000, 15.5500, 75.0000, 75.2500),
    "Dharwad": (15.3000, 15.5500, 75.0000, 75.2500),
    "Mangaluru": (12.8000, 13.0500, 74.8000, 74.9800),
    "Dakshina Kannada": (12.7000, 13.1000, 74.8000, 75.4000),
    "Kalaburagi": (17.2500, 17.4500, 76.7500, 77.0000),
    "Shivamogga": (13.8500, 14.0500, 75.5000, 75.7000),
    "Tumakuru": (13.2500, 13.5000, 77.0000, 77.2000),
    "Bengaluru Rural": (13.1000, 13.4000, 77.3500, 77.8000),
    "Ballari": (15.0500, 15.2500, 76.8500, 77.0500),
    "Vijayapura": (16.7500, 16.9500, 75.6500, 75.8500),
    "Bidar": (17.8500, 18.0500, 77.4500, 77.6500),
    "Raichur": (16.1500, 16.3500, 77.3000, 77.4500),
    "Davanagere": (14.4000, 14.5500, 75.8500, 76.0500),
    "Udupi": (13.2500, 13.4500, 74.7000, 74.8500),
    "Uttara Kannada": (14.7500, 14.9500, 74.1000, 74.3500),
    "Kolar": (13.0500, 13.2500, 78.0500, 78.2500),
    "Chikkaballapura": (13.3500, 13.5500, 77.6500, 77.8500),
    "Chikkaballapur": (13.3500, 13.5500, 77.6500, 77.8500),
    "Chitradurga": (14.1500, 14.3500, 76.3500, 76.5500),
    "Hassan": (13.0000, 13.1500, 76.0500, 76.2000),
    "Chikkamagaluru": (13.2500, 13.4000, 75.7000, 75.8500),
    "Kodagu": (12.3500, 12.5500, 75.6500, 75.8500),
    "Mandya": (12.4500, 12.6500, 76.8000, 77.0000),
    "Ramanagara": (12.6500, 12.8000, 77.2000, 77.3800),
    "Chamarajanagar": (11.8500, 12.0500, 76.9000, 77.1000),
    "Gadag": (15.3500, 15.5500, 75.5500, 75.7500),
    "Haveri": (14.7300, 14.9000, 75.3000, 75.5000),
    "Bagalkote": (16.1200, 16.2500, 75.6000, 75.8000),
    "Bagalkot": (16.1200, 16.2500, 75.6000, 75.8000),
    "Koppal": (15.3000, 15.4500, 76.1000, 76.3000),
    "Vijayanagara": (15.2000, 15.3800, 76.3000, 76.5000),
    "Yadgir": (16.7000, 16.8500, 77.1000, 77.2500)
}

# ── Realistic Name Pool ───────────────────────────────────────────────────────
MALE_NAMES = [
    "Suresh", "Ramesh", "Anil", "Sunil", "Vinay", "Chetan", "Karthik", "Rajesh", "Mahesh", 
    "Prakash", "Santosh", "Manjunath", "Kumar", "Harish", "Sandeep", "Vijay", "Anand", "Naveen", 
    "Venkatesh", "Raghu", "Raghavendra", "Girish", "Satish", "Praveen", "Abhishek", "Basavaraj", 
    "Shivanand", "Kiran", "Prashanth", "Srinivas", "Mallikarjun", "Nagaraj", "Devendra"
]

FEMALE_NAMES = [
    "Kavitha", "Priya", "Anita", "Sunita", "Lakshmi", "Shruthi", "Deepa", "Meena", "Asha", 
    "Geetha", "Radha", "Pooja", "Sneha", "Divya", "Roopa", "Swathi", "Shilpa", "Rekha", "Jyothi", 
    "Sowmya", "Vidya", "Rashmi", "Nandini", "Kavya", "Savitha", "Preethi", "Bhavya", "Anusha"
]

LAST_NAMES = [
    "Rao", "Gowda", "Patil", "Nayak", "Hegde", "Shetty", "Bhat", "Kulkarni", "Joshi", "Deshpande", 
    "Reddy", "Murthy", "Prasad", "Acharya", "Naik", "Sharma", "Nair", "Kumar", "Singh", "Jadhav",
    "Pujari", "Kambali", "Angadi", "Hiremath", "Shettar", "Chavhan", "Hosamani"
]

CRIME_DESCRIPTIONS = {
    "Vehicle Theft": "Complainant reported that their vehicle parked outside their residence was stolen during midnight hours. Lock mechanism broken.",
    "Cyber Crime": "Victim was tricked into clicking a phishing link promising bank KYC updates, leading to unauthorized debit of funds.",
    "Robbery": "Accused intercepted victim on a highway stretch, threatened with sharp weapon and forcefully took cash, jewelry, and smartphone.",
    "Burglary": "House burglary reported during weekend. Culprits broke rear window latch and decamped with gold valuables and cash.",
    "Murder": "Fatal assault reported following personal dispute. Victim suffered head trauma. Crime scene sealed and evidence secured.",
    "Kidnapping": "Minor victim reported missing from school perimeter. Suspect demanded ransom via phone call.",
    "Drug Smuggling": "Seizure of illegal contraband substances during routine highway checkpoint inspection. Vehicle impounded.",
    "Human Trafficking": "Intercepted illegal labor trafficking operation at inter-district border transport terminal.",
    "Domestic Violence": "Complaint lodged regarding domestic abuse and dowry harassment by family members.",
    "Financial Fraud": "Fraudulent investment scheme operating without regulatory approval cheated multiple local residents of savings.",
    "Mobile Theft": "Smartphone snatched from victim's hand by two motorcycle-borne assailants in market area.",
    "Chain Snatching": "Gold chain snatched from elderly victim walking near residential park. Suspects fled on unmarked scooter.",
    "Hit and Run": "Unidentified speeding car struck pedestrian at crossroad junction and sped away without rendering assistance.",
    "Assault": "Physical altercation resulting in grievous injuries following a land boundary dispute between neighbors.",
    "Illegal Weapons": "Seizure of unlicensed country-made firearm and ammunition during search operation.",
    "Fake Documents": "Accused created forged property land deeds to claim unauthorized ownership of government land.",
    "ATM Theft": "Attempted break-in and gas-cutter vandalism at ATM kiosk during early morning hours.",
    "Missing Persons": "Individual went missing after leaving place of employment. Search notice published.",
    "Extortion": "Local business owner received threatening extortion calls demanding monthly protection money.",
    "Property Damage": "Vandalism and structural damage caused to commercial shopfront during violent mob protest."
}

SAMPLE_EVIDENCE_FILES = [
    ("G001-101.png", "image/png", "Crime Scene", "High resolution forensic photo of entry point and forced lock."),
    ("E001-005.png", "image/png", "Weapons", "Photograph of seized sharp weapon recovered near incident site."),
    ("F004-022.png", "image/png", "Fingerprints", "Latent fingerprint impression lifted from glass surface."),
    ("G010-028.png", "image/png", "CCTV", "CCTV video frame snapshot capturing suspects fleeing venue."),
    ("E012-004.png", "image/png", "Vehicles", "Vehicle registration plate image of suspect transport."),
    ("H001-042.png", "image/png", "Documents", "Scanned copy of fraudulent agreement document recovered.")
]

def batch_insert(table: str, data: list[dict]):
    if not data:
        return []
    try:
        res = supabase.table(table).insert(data).execute()
        return res.data or []
    except Exception as e:
        print(f"  [ERR] Batch insert for {table} failed: {e}. Trying single inserts...")
        inserted = []
        for item in data:
            try:
                r = supabase.table(table).insert(item).execute()
                if r.data:
                    inserted.extend(r.data)
            except Exception as e2:
                print(f"    [ERR] Single insert failed for {table}: {e2}")
        return inserted

def random_date(start_date: datetime, end_date: datetime) -> datetime:
    delta = end_date - start_date
    random_seconds = random.randint(0, int(delta.total_seconds()))
    return start_date + timedelta(seconds=random_seconds)

def get_max_id(table: str, id_col: str, fallback: int = 1000) -> int:
    try:
        res = supabase.table(table).select(id_col).order(id_col, desc=True).limit(1).execute()
        if res.data and len(res.data) > 0 and res.data[0].get(id_col) is not None:
            return int(res.data[0][id_col])
    except Exception as e:
        print(f"  Warning getting max ID for {table}.{id_col}: {e}")
    return fallback

def main():
    print("\n=========================================================")
    print("  KSP DATABASE EXPANSION: ALL 31 KARNATAKA DISTRICTS  ")
    print("=========================================================\n")

    districts = supabase.table("district").select("*").execute().data or []
    karnataka_districts = [d for d in districts if d.get("state_id") == 1]
    print(f"Found {len(karnataka_districts)} Karnataka Districts in database.")

    units = supabase.table("unit").select("*").execute().data or []
    employees = supabase.table("employee").select("*").execute().data or []
    subheads = supabase.table("crime_sub_head").select("*").execute().data or []
    subhead_map = {sh["crime_sub_head_id"]: sh["crime_head_id"] for sh in subheads}

    total_units_added = 0
    total_officers_added = 0
    total_firs_added = 0
    total_complainants_added = 0
    total_victims_added = 0
    total_accused_added = 0
    total_evidence_added = 0
    total_vehicles_added = 0
    total_alerts_added = 0

    start_dt = datetime(2025, 1, 1)
    end_dt = datetime(2026, 7, 22)

    for kd in karnataka_districts:
        did = kd["district_id"]
        dname = kd["district_name"]

        d_units = [u for u in units if u.get("district_id") == did]
        d_employees = [e for e in employees if e.get("district_id") == did]

        # 1. Police Stations / Units
        if len(d_units) < 3:
            new_units_payload = []
            station_types = ["Town Police Station", "Central PS", "Traffic PS", "Cyber Crime PS", "Rural PS"]
            current_unit_id = get_max_id("unit", "unit_id", 100)
            for i in range(4 - len(d_units)):
                current_unit_id += 1
                new_units_payload.append({
                    "unit_id": current_unit_id,
                    "unit_name": f"{dname} {station_types[i % len(station_types)]}",
                    "district_id": did,
                    "state_id": 1
                })
            inserted_u = batch_insert("unit", new_units_payload)
            d_units.extend(inserted_u)
            units.extend(inserted_u)
            total_units_added += len(inserted_u)

        if not d_units:
            d_units = [{"unit_id": 1}]

        # 2. Officers / Employees
        if len(d_employees) < 15:
            new_emp_payload = []
            ranks = [(1, "Inspector"), (2, "Sub-Inspector"), (3, "DySP"), (4, "SP"), (5, "Constable")]
            designations = [(1, "IO"), (2, "SHO"), (3, "Cyber Expert"), (4, "Crime Branch Lead")]
            current_employee_id = get_max_id("employee", "employee_id", 1000)
            for i in range(20 - len(d_employees)):
                current_employee_id += 1
                gender = "Male" if random.random() > 0.3 else "Female"
                fname = random.choice(MALE_NAMES if gender == "Male" else FEMALE_NAMES)
                lname = random.choice(LAST_NAMES)
                rank_id, _ = random.choice(ranks)
                desg_id, _ = random.choice(designations)
                assigned_u = random.choice(d_units)

                new_emp_payload.append({
                    "employee_id": current_employee_id,
                    "kgid": f"KSP{did}{current_employee_id}",
                    "first_name": f"{fname} {lname}",
                    "gender_id": 1 if gender == "Male" else 2,
                    "district_id": did,
                    "unit_id": assigned_u["unit_id"],
                    "rank_id": rank_id,
                    "designation_id": desg_id,
                    "appointment_date": random_date(datetime(2015, 1, 1), datetime(2024, 1, 1)).date().isoformat()
                })
            inserted_e = batch_insert("employee", new_emp_payload)
            d_employees.extend(inserted_e)
            employees.extend(inserted_e)
            total_officers_added += len(inserted_e)

        if not d_employees:
            d_employees = [{"employee_id": 1}]

        # 3. Cases / FIRs
        min_lat, max_lat, min_lng, max_lng = DISTRICT_BOUNDS.get(dname, (12.90, 13.10, 77.50, 77.70))
        num_firs = random.randint(25, 35)

        cases_payload = []
        cases_meta = []
        current_case_id = get_max_id("case_master", "case_master_id", 5000)

        for i in range(num_firs):
            current_case_id += 1
            cid = current_case_id
            fir_no = f"FIR-{dname[:3].upper()}-2026-{1000 + i + random.randint(10, 99)}"
            crime_no = f"3000{did:02d}2026{random.randint(1000, 9999)}"
            reg_dt = random_date(start_dt, end_dt)
            inc_dt = reg_dt - timedelta(days=random.randint(0, 14), hours=random.randint(0, 23))

            crime_type = random.choice(list(CRIME_DESCRIPTIONS.keys()))
            brief = f"{CRIME_DESCRIPTIONS[crime_type]} Location: {dname} Sector {random.randint(1, 12)}."

            officer = random.choice(d_employees)
            unit = random.choice(d_units)

            lat = round(random.uniform(min_lat, max_lat), 6)
            lng = round(random.uniform(min_lng, max_lng), 6)

            sh_id = random.choice(list(subhead_map.keys())) if subhead_map else 1
            mh_id = subhead_map.get(sh_id, 1)

            c_obj = {
                "case_master_id": cid,
                "crime_no": crime_no,
                "case_no": fir_no,
                "crime_registered_date": reg_dt.isoformat(),
                "police_person_id": officer["employee_id"],
                "police_station_id": unit["unit_id"],
                "case_category_id": random.choice([1, 2, 3, 4]),
                "gravity_offence_id": random.choice([1, 2]), # Valid keys in gravity_offence table: 1 (Heinous), 2 (Non-Heinous)
                "crime_major_head_id": mh_id,
                "crime_minor_head_id": sh_id,
                "case_status_id": random.choice([1, 2, 3, 4]),
                "court_id": 1,
                "incident_from_date": inc_dt.isoformat(),
                "incident_to_date": (inc_dt + timedelta(hours=random.randint(1, 6))).isoformat(),
                "info_received_ps_date": reg_dt.isoformat(),
                "latitude": lat,
                "longitude": lng,
                "brief_facts": brief
            }
            cases_payload.append(c_obj)
            cases_meta.append({
                "case_master_id": cid,
                "fir_no": fir_no,
                "reg_dt": reg_dt,
                "officer_id": officer["employee_id"],
                "crime_type": crime_type
            })

        inserted_cases = batch_insert("case_master", cases_payload)
        total_firs_added += len(inserted_cases)

        # 4. Link Complainants, Victims, Accused, Evidence
        d_complainants = []
        d_victims = []
        d_accused = []
        d_evidence = []

        current_comp_id = get_max_id("complainant_details", "complainant_id", 5000)
        current_victim_id = get_max_id("victim", "victim_master_id", 5000)
        current_accused_id = get_max_id("accused", "accused_master_id", 5000)

        # Use inserted_cases to get actual valid case_master_ids
        inserted_case_ids = [c["case_master_id"] for c in inserted_cases if "case_master_id" in c]

        for idx, cid in enumerate(inserted_case_ids):
            meta = cases_meta[idx] if idx < len(cases_meta) else {"reg_dt": start_dt, "officer_id": 1, "crime_type": "Theft", "fir_no": "FIR-001"}

            # Complainant
            current_comp_id += 1
            cg = "Male" if random.random() > 0.4 else "Female"
            cname = random.choice(MALE_NAMES if cg == "Male" else FEMALE_NAMES) + " " + random.choice(LAST_NAMES)
            d_complainants.append({
                "complainant_id": current_comp_id,
                "case_master_id": cid,
                "complainant_name": cname,
                "age_year": random.randint(22, 70),
                "occupation_id": 1,
                "religion_id": 1,
                "caste_id": 1,
                "gender_id": cg
            })

            # Victim
            current_victim_id += 1
            vg = "Male" if random.random() > 0.5 else "Female"
            vname = random.choice(MALE_NAMES if vg == "Male" else FEMALE_NAMES) + " " + random.choice(LAST_NAMES)
            d_victims.append({
                "victim_master_id": current_victim_id,
                "case_master_id": cid,
                "victim_name": vname,
                "age_year": random.randint(18, 75),
                "gender_id": vg,
                "victim_police": 0
            })

            # Accused
            current_accused_id += 1
            ag = "Male" if random.random() > 0.2 else "Female"
            aname = random.choice(MALE_NAMES if ag == "Male" else FEMALE_NAMES) + " " + random.choice(LAST_NAMES)
            d_accused.append({
                "accused_master_id": current_accused_id,
                "case_master_id": cid,
                "accused_name": aname,
                "age_year": random.randint(20, 60),
                "gender_id": ag,
                "person_id": f"P{random.randint(100000, 999999)}",
                "risk_score": random.randint(35, 95),
                "known_aliases": [f"{random.choice(['Chotta', 'Speed', 'Black', 'Bullet'])} {aname.split()[0]}"] if random.random() < 0.4 else [],
                "is_synthetic": True
            })

            # Evidence (2 items per FIR)
            for file_name, mime_type, category, desc_template in random.sample(SAMPLE_EVIDENCE_FILES, 2):
                bucket_folder = "crime-scenes" if category == "Crime Scene" else category.lower().replace(" ", "-")
                storage_path = f"{bucket_folder}/{file_name}"
                pub_url = f"https://ewzifvudriauuydrgiax.supabase.co/storage/v1/object/public/evidence-files/{storage_path}"
                d_evidence.append({
                    "case_master_id": cid,
                    "file_name": file_name,
                    "file_size": random.randint(200000, 4500000),
                    "mime_type": mime_type,
                    "storage_path": storage_path,
                    "public_url": pub_url,
                    "uploaded_by": meta["officer_id"],
                    "uploaded_at": meta["reg_dt"].isoformat(),
                    "description": f"{desc_template} (District: {dname}, FIR: {meta['fir_no']})",
                    "tags": [meta["crime_type"], category, dname],
                    "ai_analysis": f"{{\"confidence\": 0.94, \"category\": \"{category}\", \"district\": \"{dname}\"}}",
                    "is_sample": True
                })

        total_complainants_added += len(batch_insert("complainant_details", d_complainants))
        total_victims_added += len(batch_insert("victim", d_victims))
        total_accused_added += len(batch_insert("accused", d_accused))
        total_evidence_added += len(batch_insert("evidence", d_evidence))

        # 5. Patrol Vehicles (vehicle_type check constraint: Car, SUV, Motorcycle)
        d_vehicles = []
        for v_idx in range(random.randint(3, 5)):
            reg_no = f"KA-{did:02d}-P-{random.randint(1000, 9999)}"
            lat = round(random.uniform(min_lat, max_lat), 6)
            lng = round(random.uniform(min_lng, max_lng), 6)
            unit = random.choice(d_units)

            d_vehicles.append({
                "registration_number": reg_no,
                "vehicle_type": random.choice(["Car", "SUV", "Motorcycle"]),
                "make": random.choice(["Tata", "Mahindra", "TVS"]),
                "model": random.choice(["Safari", "Bolero", "Apache"]),
                "color": random.choice(["White", "Blue", "Black", "Silver"]),
                "status": random.choice(["Active", "Active", "Active", "Maintenance"]),
                "latitude": lat,
                "longitude": lng,
                "heading": round(random.uniform(0, 360), 2),
                "speed": round(random.uniform(0, 75), 2),
                "assigned_unit_id": unit["unit_id"],
                "is_synthetic": True
            })
        total_vehicles_added += len(batch_insert("patrol_vehicles", d_vehicles))

        # 6. Intelligence Alerts
        d_alerts = []
        alert_templates = [
            ("Highway Patrol Alert", "Vehicle Theft Spike", "High"),
            ("Border Checkpoint Surveillance", "Contraband Movement", "Critical"),
            ("Public Assembly Monitoring", "Law and Order", "Medium"),
            ("Cyber Fraud Cluster Alert", "Financial Crime", "High")
        ]
        for a_idx in range(random.randint(2, 4)):
            atitle, atype, asev = random.choice(alert_templates)
            lat = round(random.uniform(min_lat, max_lat), 6)
            lng = round(random.uniform(min_lng, max_lng), 6)
            d_alerts.append({
                "type": atype,
                "severity": asev,
                "title": f"{atitle} - {dname}",
                "description": f"Automated telemetry alert logged in {dname} sector.",
                "district": dname,
                "location": f"{dname} Sector {random.randint(1, 10)} Patrol Post",
                "latitude": lat,
                "longitude": lng,
                "timestamp": random_date(start_dt, end_dt).isoformat(),
                "is_read": False,
                "is_synthetic": True
            })
        total_alerts_added += len(batch_insert("alerts", d_alerts))

        print(f"[OK] District {did:02d} ({dname:20s}): {len(inserted_cases)} FIRs | {len(d_complainants)} Complainants | {len(d_victims)} Victims | {len(d_accused)} Accused | {len(d_evidence)} Evidence")

    print("\n=========================================================")
    print("  EXPANSION COMPLETE - SUMMARY REPORT                    ")
    print("=========================================================")
    print(f"  • Total Units/Stations Added : {total_units_added}")
    print(f"  • Total Officers Added       : {total_officers_added}")
    print(f"  • Total FIRs/Cases Added     : {total_firs_added}")
    print(f"  • Total Complainants Added   : {total_complainants_added}")
    print(f"  • Total Victims Added        : {total_victims_added}")
    print(f"  • Total Accused/Suspects     : {total_accused_added}")
    print(f"  • Total Evidence Records     : {total_evidence_added}")
    print(f"  • Total Vehicles Added       : {total_vehicles_added}")
    print(f"  • Total Alerts Added         : {total_alerts_added}")
    print("=========================================================\n")

if __name__ == "__main__":
    main()
