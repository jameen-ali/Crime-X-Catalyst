"""
expand_db.py
============
Expand the KSP database to the target counts:
• CaseMaster......................1000
• ComplainantDetails..............1000
• Victim..........................1500
• Accused.........................1800
• ArrestSurrender.................900
• ChargesheetDetails..............700
• Evidence........................3500
• Assignments.....................2500
• Notifications..................3000
• AuditLogs......................5000
• PatrolLogs.....................4000
• ChatMessages...................5000
• PatrolVehicles.................20 (exact)
• Alerts.........................50

Every generated record includes is_synthetic = true.
"""

import os
import sys
import random
import uuid
from pathlib import Path
from datetime import datetime, timedelta

# ── path setup ───────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parents[2]   # Crime X/
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(ROOT / "backend" / ".env")

from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    sys.exit("ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) must be set in backend/.env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Indian/Kannada Names & Data Lists ─────────────────────────────────────────
MALE_NAMES = ["Suresh", "Ramesh", "Anil", "Sunil", "Vinay", "Chetan", "Karthik", "Rajesh", "Mahesh", 
              "Prakash", "Santosh", "Manjunath", "Kumar", "Harish", "Sandeep", "Vijay", "Anand", "Naveen", 
              "Venkatesh", "Raghu", "Raghavendra", "Girish", "Satish", "Praveen", "Abhishek", "Basavaraj", 
              "Shivanand", "Kiran", "Prashanth", "Srinivas"]

FEMALE_NAMES = ["Kavitha", "Priya", "Anita", "Sunita", "Lakshmi", "Shruthi", "Deepa", "Meena", "Asha", 
                "Geetha", "Radha", "Pooja", "Sneha", "Divya", "Roopa", "Swathi", "Shilpa", "Rekha", "Jyothi", 
                "Sowmya", "Vidya", "Rashmi", "Nandini", "Kavya", "Savitha", "Preethi"]

LAST_NAMES = ["Rao", "Gowda", "Patil", "Nayak", "Hegde", "Shetty", "Bhat", "Kulkarni", "Joshi", "Deshpande", 
              "Reddy", "Murthy", "Prasad", "Acharya", "Naik", "Sharma", "Nair", "Kumar", "Singh", "Jadhav"]

BRIEF_FACTS_TEMPLATES = [
    "Complainant states that when they were away from home, unknown culprits broke into the house by forcing open the front door lock and stole gold ornaments weighing 80 grams and cash Rs 50,000.",
    "The accused persons formed an unlawful assembly, intercepted the complainant on the public road, abused him in filthy language, and physically assaulted him over a previous grudge.",
    "It is reported that the accused stole a Hero Honda Splendor motorcycle bearing registration number KA-03-EB-4829 parked outside the complainant's residential premises at night.",
    "The complainant received a call from an unknown person claiming to be a bank officer. The caller fraudulently obtained the complainant's OTP and transferred Rs 95,000 from the bank account.",
    "The accused, acting as a delivery agent, cheated the victim by delivering dummy items instead of the ordered smartphone, and collected cash Rs 15,000.",
    "Complainant states that the accused drove a car in a rash and negligent manner on the main road and dashed against a pedestrian, causing severe injuries.",
    "The accused, who is the husband of the victim, and his relatives harassed the victim both physically and mentally, demanding additional dowry.",
    "It is reported that the accused was found in possession of illegal country-made weapon and cartridges without a valid license near the railway station road.",
    "The accused created a fake social media profile using the complainant's photographs and sent abusive messages to the complainant's friends to defame her.",
    "The complainant states that their warehouse was broken into and copper wires worth Rs 1,20,000 were stolen by unknown suspects."
]

WEAPONS = ["Knife", "Iron Rod", "Wooden Log", "Country Pistol", "Screwdriver", "Sickle", "Stone", "None"]
TAGS = ["Burglary", "Assault", "Vehicle Theft", "Cyber Fraud", "Dowry", "Negligent Driving", "Weapon Seizure", "Robbery", "Public Nuisance", "Murder Suspect"]

# Helper to run batch inserts in chunks
def batch_insert(table: str, data: list[dict], chunk_size: int = 500):
    if not data:
        print(f"  [SKIP] {table} — no records to insert")
        return
    total = len(data)
    print(f"  [START] {table} — inserting {total} records in chunks of {chunk_size}...")
    inserted = 0
    for i in range(0, total, chunk_size):
        chunk = data[i:i + chunk_size]
        try:
            supabase.table(table).insert(chunk).execute()
            inserted += len(chunk)
            print(f"    Inserted {inserted}/{total}...")
        except Exception as e:
            print(f"    [ERR] failed to insert chunk: {e}")
            # Try once with smaller chunk or skip to proceed
            if chunk_size > 100:
                print("    Retrying with smaller chunk size 50...")
                for j in range(0, len(chunk), 50):
                    subchunk = chunk[j:j+50]
                    try:
                        supabase.table(table).insert(subchunk).execute()
                        inserted += len(subchunk)
                    except Exception as e2:
                        print(f"      [ERR] failed subchunk: {e2}")
            else:
                print("    Skipping corrupted chunk")
    print(f"  [OK]   {table} — successfully populated {inserted} records")

def random_date(start_date: datetime, end_date: datetime) -> datetime:
    delta = end_date - start_date
    random_seconds = random.randint(0, int(delta.total_seconds()))
    return start_date + timedelta(seconds=random_seconds)

def main():
    print("\n=== Phase 0.5: Expanding Database with Synthetic Data ===\n")
    
    # ── 1. Fetch lookups & reference data ─────────────────────────────────────
    print("Fetching existing database lookups...")
    try:
        employees = supabase.table("employee").select("employee_id").execute().data
        employee_ids = [e["employee_id"] for e in employees]
        
        units = supabase.table("unit").select("unit_id").execute().data
        unit_ids = [u["unit_id"] for u in units]
        
        case_categories = supabase.table("case_category").select("case_category_id").execute().data
        case_category_ids = [c["case_category_id"] for c in case_categories]
        
        gravity_offences = supabase.table("gravity_offence").select("gravity_offence_id").execute().data
        gravity_offence_ids = [g["gravity_offence_id"] for g in gravity_offences]
        
        courts = supabase.table("court").select("court_id").execute().data
        court_ids = [c["court_id"] for c in courts]
        
        case_statuses = supabase.table("case_status_master").select("case_status_id").execute().data
        case_status_ids = [c["case_status_id"] for c in case_statuses]
        
        occupations = supabase.table("occupation_master").select("occupation_id").execute().data
        occupation_ids = [o["occupation_id"] for o in occupations]
        
        religions = supabase.table("religion_master").select("religion_id").execute().data
        religion_ids = [r["religion_id"] for r in religions]
        
        castes = supabase.table("caste_master").select("caste_id").execute().data
        caste_ids = [c["caste_id"] for c in castes]
        
        districts = supabase.table("district").select("district_id, district_name").execute().data
        district_ids = [d["district_id"] for d in districts]
        district_names = [d["district_name"] for d in districts]
        
        subheads = supabase.table("crime_sub_head").select("crime_sub_head_id, crime_head_id").execute().data
        subhead_map = {sh["crime_sub_head_id"]: sh["crime_head_id"] for sh in subheads}
        crime_sub_head_ids = list(subhead_map.keys())
        
        print(f"  Found {len(employee_ids)} Employees, {len(unit_ids)} Units, {len(crime_sub_head_ids)} Crime Heads")
    except Exception as e:
        sys.exit(f"ERROR fetching lookup data: {e}. Please ensure database connection works and basic tables exist.")
        
    # Get current operational table counts
    try:
        cases_count = len(supabase.table("case_master").select("case_master_id").execute().data)
        complainants_count = len(supabase.table("complainant_details").select("complainant_id").execute().data)
        victims_count = len(supabase.table("victim").select("victim_master_id").execute().data)
        accused_count = len(supabase.table("accused").select("accused_master_id").execute().data)
        arrests_count = len(supabase.table("arrest_surrender").select("arrest_surrender_id").execute().data)
        cs_count = len(supabase.table("chargesheet_details").select("cs_id").execute().data)
        evidence_count = len(supabase.table("evidence").select("id").execute().data)
        assignments_count = len(supabase.table("assignments").select("id").execute().data)
        chat_count = len(supabase.table("chat_messages").select("id").execute().data)
        audit_count = len(supabase.table("audit_logs").select("id").execute().data)
        
        print(f"Current counts: Cases: {cases_count}, Complainants: {complainants_count}, Victims: {victims_count}, Accused: {accused_count}")
    except Exception as e:
        sys.exit(f"ERROR fetching operational counts: {e}")

    # Start date range (Jan 1, 2026 to Jul 20, 2026)
    start_dt = datetime(2026, 1, 1)
    end_dt = datetime(2026, 7, 20)

    # ── 2. CaseMaster (target 1000) ───────────────────────────────────────────
    cases_needed = max(0, 1000 - cases_count)
    synthetic_cases = []
    
    # We find the max ID to start incrementing
    max_case_id = 0
    if cases_count > 0:
        try:
            res = supabase.table("case_master").select("case_master_id").order("case_master_id", desc=True).limit(1).execute()
            if res.data:
                max_case_id = res.data[0]["case_master_id"]
        except Exception as e:
            print("  Warning getting max case ID:", e)
            
    print(f"Generating {cases_needed} CaseMaster records...")
    for i in range(cases_needed):
        cid = max_case_id + i + 1
        # crime_no format: 30002000620260000X or similar
        crime_no = f"3000200062026{100000 + cid}"
        case_no = f"FIR {random.randint(1, 400)}/2026"
        reg_date = random_date(start_dt, end_dt)
        inc_date = reg_date - timedelta(days=random.randint(0, 10), hours=random.randint(0, 23))
        info_date = reg_date + timedelta(hours=random.randint(1, 5))
        
        sh_id = random.choice(crime_sub_head_ids)
        mh_id = subhead_map[sh_id]
        
        ps_id = random.choice(unit_ids)
        # Fetch district for unit if mapped, else random Karnataka district bounds
        lat = round(random.uniform(12.83, 13.14), 6)
        lng = round(random.uniform(77.45, 77.75), 6)
        
        synthetic_cases.append({
            "case_master_id": cid,
            "crime_no": crime_no,
            "case_no": case_no,
            "crime_registered_date": reg_date.isoformat(),
            "police_person_id": random.choice(employee_ids),
            "police_station_id": ps_id,
            "case_category_id": random.choice(case_category_ids),
            "gravity_offence_id": random.choice(gravity_offence_ids),
            "crime_major_head_id": mh_id,
            "crime_minor_head_id": sh_id,
            "case_status_id": random.choice(case_status_ids),
            "court_id": random.choice(court_ids),
            "incident_from_date": inc_date.isoformat(),
            "incident_to_date": (inc_date + timedelta(hours=random.randint(1, 12))).isoformat(),
            "info_received_ps_date": info_date.isoformat(),
            "latitude": lat,
            "longitude": lng,
            "brief_facts": random.choice(BRIEF_FACTS_TEMPLATES)
        })

    batch_insert("case_master", synthetic_cases)
    
    # Refresh list of all case master IDs
    all_cases = supabase.table("case_master").select("case_master_id").execute().data
    all_case_ids = [c["case_master_id"] for c in all_cases]
    print(f"Total CaseMaster IDs available: {len(all_case_ids)}")

    # ── 3. ComplainantDetails (target 1000) ───────────────────────────────────
    # Each case should have exactly 1 complainant. Let's find cases that don't have complainants yet.
    existing_complainant_cases = set()
    if complainants_count > 0:
        try:
            res = supabase.table("complainant_details").select("case_master_id").execute()
            existing_complainant_cases = {r["case_master_id"] for r in res.data if r.get("case_master_id")}
        except Exception as e:
            print("  Warning reading existing complainant cases:", e)
            
    cases_needing_complainants = [cid for cid in all_case_ids if cid not in existing_complainant_cases]
    complainants_needed = max(0, 1000 - complainants_count)
    # limit to cases needing complainants
    cases_needing_complainants = cases_needing_complainants[:complainants_needed]
    
    max_comp_id = 0
    if complainants_count > 0:
        try:
            res = supabase.table("complainant_details").select("complainant_id").order("complainant_id", desc=True).limit(1).execute()
            if res.data:
                max_comp_id = res.data[0]["complainant_id"]
        except Exception as e:
            print("  Warning getting max complainant ID:", e)
            
    synthetic_complainants = []
    print(f"Generating {len(cases_needing_complainants)} ComplainantDetails records...")
    for idx, cid in enumerate(cases_needing_complainants):
        comp_id = max_comp_id + idx + 1
        gender = random.choice(["Male", "Female"])
        name = random.choice(MALE_NAMES if gender == "Male" else FEMALE_NAMES) + " " + random.choice(LAST_NAMES)
        
        synthetic_complainants.append({
            "complainant_id": comp_id,
            "case_master_id": cid,
            "complainant_name": name,
            "age_year": random.randint(18, 80),
            "occupation_id": random.choice(occupation_ids),
            "religion_id": random.choice(religion_ids),
            "caste_id": random.choice(caste_ids),
            "gender_id": gender
        })
    batch_insert("complainant_details", synthetic_complainants)

    # ── 4. Victim (target 1500) ───────────────────────────────────────────────
    victims_needed = max(0, 1500 - victims_count)
    max_victim_id = 0
    if victims_count > 0:
        try:
            res = supabase.table("victim").select("victim_master_id").order("victim_master_id", desc=True).limit(1).execute()
            if res.data:
                max_victim_id = res.data[0]["victim_master_id"]
        except Exception as e:
            print("  Warning getting max victim ID:", e)
            
    synthetic_victims = []
    print(f"Generating {victims_needed} Victim records...")
    for i in range(victims_needed):
        vid = max_victim_id + i + 1
        gender = random.choice(["Male", "Female"])
        name = random.choice(MALE_NAMES if gender == "Male" else FEMALE_NAMES) + " " + random.choice(LAST_NAMES)
        
        synthetic_victims.append({
            "victim_master_id": vid,
            "case_master_id": random.choice(all_case_ids),
            "victim_name": name,
            "age_year": random.randint(1, 90),
            "gender_id": gender,
            "victim_police": random.choice([0, 0, 0, 0, 0, 0, 1])  # rarely police
        })
    batch_insert("victim", synthetic_victims)

    # ── 5. Accused (target 1800) ──────────────────────────────────────────────
    accused_needed = max(0, 1800 - accused_count)
    max_accused_id = 0
    if accused_count > 0:
        try:
            res = supabase.table("accused").select("accused_master_id").order("accused_master_id", desc=True).limit(1).execute()
            if res.data:
                max_accused_id = res.data[0]["accused_master_id"]
        except Exception as e:
            print("  Warning getting max accused ID:", e)
            
    synthetic_accused = []
    print(f"Generating {accused_needed} Accused records...")
    for i in range(accused_needed):
        aid = max_accused_id + i + 1
        gender = random.choice(["Male", "Female"])
        name = random.choice(MALE_NAMES if gender == "Male" else FEMALE_NAMES) + " " + random.choice(LAST_NAMES)
        
        aliases = []
        if random.random() < 0.3:
            aliases = [random.choice(["Chotta", "Kariya", "Blade", "Pocket", "Silent", "Bullet"]) + " " + name.split()[0]]
            
        synthetic_accused.append({
            "accused_master_id": aid,
            "case_master_id": random.choice(all_case_ids),
            "accused_name": name,
            "age_year": random.randint(14, 75),
            "gender_id": gender,
            "person_id": f"P{random.randint(100000, 999999)}",
            "risk_score": random.randint(10, 99),
            "known_aliases": aliases,
            "is_synthetic": True
        })
    batch_insert("accused", synthetic_accused)

    # Refresh list of all accused master IDs
    all_accused = supabase.table("accused").select("accused_master_id, case_master_id").execute().data
    all_accused_ids = [a["accused_master_id"] for a in all_accused]
    accused_case_map = {a["accused_master_id"]: a["case_master_id"] for a in all_accused}
    print(f"Total Accused IDs available: {len(all_accused_ids)}")

    # ── 6. ArrestSurrender (target 900) ───────────────────────────────────────
    arrests_needed = max(0, 900 - arrests_count)
    max_arrest_id = 0
    if arrests_count > 0:
        try:
            res = supabase.table("arrest_surrender").select("arrest_surrender_id").order("arrest_surrender_id", desc=True).limit(1).execute()
            if res.data:
                max_arrest_id = res.data[0]["arrest_surrender_id"]
        except Exception as e:
            print("  Warning getting max arrest ID:", e)
            
    synthetic_arrests = []
    print(f"Generating {arrests_needed} ArrestSurrender records...")
    for i in range(arrests_needed):
        ar_id = max_arrest_id + i + 1
        accused_id = random.choice(all_accused_ids)
        case_id = accused_case_map[accused_id]
        
        # Arrest date should be after incident date
        arr_date = random_date(start_dt, end_dt)
        
        synthetic_arrests.append({
            "arrest_surrender_id": ar_id,
            "case_master_id": case_id,
            "arrest_surrender_type_id": random.choice([1, 2, 3]),
            "arrest_surrender_date": arr_date.date().isoformat(),
            "arrest_surrender_state_id": 16, # Karnataka state ID in sheet is typically 16
            "arrest_surrender_district_id": random.choice(district_ids),
            "police_station_id": random.choice(unit_ids),
            "io_id": random.choice(employee_ids),
            "court_id": random.choice(court_ids),
            "accused_master_id": accused_id,
            "is_accused": 1,
            "is_complainant_accused": 0
        })
    batch_insert("arrest_surrender", synthetic_arrests)

    # ── 7. ChargesheetDetails (target 700) ────────────────────────────────────
    cs_needed = max(0, 700 - cs_count)
    max_cs_id = 0
    if cs_count > 0:
        try:
            res = supabase.table("chargesheet_details").select("cs_id").order("cs_id", desc=True).limit(1).execute()
            if res.data:
                max_cs_id = res.data[0]["cs_id"]
        except Exception as e:
            print("  Warning getting max chargesheet ID:", e)
            
    synthetic_cs = []
    print(f"Generating {cs_needed} ChargesheetDetails records...")
    for i in range(cs_needed):
        c_id = max_cs_id + i + 1
        synthetic_cs.append({
            "cs_id": c_id,
            "case_master_id": random.choice(all_case_ids),
            "cs_date": random_date(start_dt, end_dt).date().isoformat(),
            "cs_type": random.choice(["Chargesheeted", "Abated", "Untraced", "False"]),
            "police_person_id": random.choice(employee_ids)
        })
    batch_insert("chargesheet_details", synthetic_cs)

    # ── 8. Evidence (target 3500) ─────────────────────────────────────────────
    evidence_needed = max(0, 3500 - evidence_count)
    synthetic_evidence = []
    print(f"Generating {evidence_needed} Evidence records...")
    
    file_types = [
        ("image/jpeg", "JPG", "Image"),
        ("image/png", "PNG", "Image"),
        ("video/mp4", "MP4", "Video"),
        ("audio/wav", "WAV", "Audio"),
        ("application/pdf", "PDF", "Document")
    ]
    
    for i in range(evidence_needed):
        mime, ext, e_type = random.choice(file_types)
        case_id = random.choice(all_case_ids)
        
        synthetic_evidence.append({
            "case_master_id": case_id,
            "file_name": f"EVID_{case_id}_{random.randint(100,999)}.{ext}",
            "file_size": random.randint(1024, 52428800), # 1KB to 50MB
            "mime_type": mime,
            "storage_path": f"evidence/case_{case_id}/{uuid.uuid4()}.{ext}",
            "public_url": f"https://ewzifvudriauuydrgiax.supabase.co/storage/v1/object/public/evidence/placeholder.{ext}",
            "uploaded_by": random.choice(employee_ids),
            "uploaded_at": random_date(start_dt, end_dt).isoformat(),
            "description": f"Synthetic evidence item of type {e_type} for investigation of case ID {case_id}",
            "tags": random.sample(TAGS, random.randint(1, 3)),
            "ai_analysis": f"AI classified this {e_type} evidence. High confidence detection of relevant features.",
            "is_sample": True
        })
    batch_insert("evidence", synthetic_evidence)

    # ── 9. Assignments (target 2500) ──────────────────────────────────────────
    assignments_needed = max(0, 2500 - assignments_count)
    synthetic_assignments = []
    print(f"Generating {assignments_needed} Assignments records...")
    for i in range(assignments_needed):
        due = random_date(end_dt, end_dt + timedelta(days=90))
        synthetic_assignments.append({
            "officer_id": random.choice(employee_ids),
            "type": random.choice(["Case", "Evidence Review", "Patrol Duty", "Investigation"]),
            "ref_id": f"REF-{random.randint(1000, 9999)}",
            "status": random.choice(["Assigned", "Pending", "Completed"]),
            "progress": random.randint(0, 100),
            "due_date": due.date().isoformat(),
            "created_by": random.choice(employee_ids),
            "created_at": random_date(start_dt, end_dt).isoformat()
        })
    batch_insert("assignments", synthetic_assignments)

    # ── 10. Notifications (target 3000) ───────────────────────────────────────
    # First check if notifications table exists. We'll try to check by querying it.
    try:
        notifs_count = len(supabase.table("notifications").select("id").execute().data)
    except Exception as e:
        print("  [SKIP] notifications seeding — table does not exist yet. Run SQL first.")
        notifs_count = 3000 # Skip

    if notifs_count < 3000:
        notifs_needed = 3000 - notifs_count
        synthetic_notifs = []
        print(f"Generating {notifs_needed} Notifications...")
        for i in range(notifs_needed):
            synthetic_notifs.append({
                "employee_id": random.choice(employee_ids),
                "title": f"New Case Notification",
                "description": f"You have been assigned to case or alert ID {random.randint(1000,9999)}.",
                "type": random.choice(["Alert", "Case Assignment", "System", "Broadcast"]),
                "is_read": random.choice([True, False]),
                "is_synthetic": True,
                "created_at": random_date(start_dt, end_dt).isoformat()
            })
        batch_insert("notifications", synthetic_notifs)

    # ── 11. AuditLogs (target 5000) ───────────────────────────────────────────
    audit_needed = max(0, 5000 - audit_count)
    synthetic_audits = []
    print(f"Generating {audit_needed} AuditLogs...")
    actions = ["View Case", "Update Case", "Delete Accused", "Upload Evidence", "Assign Task", "Log in", "Export Report"]
    actors = ["Suresh Rao", "Kavitha Nair", "Priya Sharma", "Ramesh Gowda", "Anil Patil"]
    
    for i in range(audit_needed):
        actor = random.choice(actors)
        synthetic_audits.append({
            "actor": actor,
            "role": "Admin" if actor == "Suresh Rao" else ("Analyst" if actor == "Priya Sharma" else "Officer"),
            "action": random.choice(actions),
            "target": "case_master" if random.random() < 0.6 else "accused",
            "target_id": str(random.choice(all_case_ids)),
            "ip_address": f"10.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}",
            "timestamp": random_date(start_dt, end_dt).isoformat()
        })
    batch_insert("audit_logs", synthetic_audits)

    # ── 12. PatrolVehicles (exactly 20) ───────────────────────────────────────
    try:
        vehicles_count = len(supabase.table("patrol_vehicles").select("id").execute().data)
    except Exception as e:
        print("  [SKIP] patrol_vehicles seeding — table does not exist yet. Run SQL first.")
        vehicles_count = 20 # Skip

    if vehicles_count < 20:
        vehicles_needed = 20 - vehicles_count
        synthetic_vehicles = []
        print(f"Generating {vehicles_needed} PatrolVehicles...")
        for i in range(vehicles_needed):
            v_num = f"KA-{random.randint(10,57)}-P-{random.randint(1000, 9999)}"
            synthetic_vehicles.append({
                "registration_number": v_num,
                "vehicle_type": random.choice(["Car", "SUV", "Motorcycle"]),
                "make": random.choice(["Maruti Suzuki", "Mahindra", "TVS"]),
                "model": random.choice(["Ertiga", "Bolero", "Apache"]),
                "color": random.choice(["White", "Blue", "Khaki"]),
                "status": random.choice(["Active", "Active", "Active", "Maintenance"]),
                "latitude": round(random.uniform(12.9, 13.1), 6), # Centered in Bengaluru
                "longitude": round(random.uniform(77.5, 77.7), 6),
                "heading": round(random.uniform(0, 360), 2),
                "speed": round(random.uniform(0, 80), 2),
                "assigned_unit_id": random.choice(unit_ids),
                "is_synthetic": True
            })
        batch_insert("patrol_vehicles", synthetic_vehicles)

    # Refresh vehicle list
    try:
        all_vehicles = supabase.table("patrol_vehicles").select("id").execute().data
        all_vehicle_ids = [v["id"] for v in all_vehicles]
    except Exception:
        all_vehicle_ids = []

    # ── 13. PatrolLogs (target 4000) ──────────────────────────────────────────
    try:
        patrol_logs_count = len(supabase.table("patrol_logs").select("id").execute().data)
    except Exception as e:
        print("  [SKIP] patrol_logs seeding — table does not exist yet. Run SQL first.")
        patrol_logs_count = 4000 # Skip

    if patrol_logs_count < 4000 and all_vehicle_ids:
        patrol_needed = 4000 - patrol_logs_count
        synthetic_patrols = []
        print(f"Generating {patrol_needed} PatrolLogs...")
        for i in range(patrol_needed):
            start = random_date(start_dt, end_dt)
            end = start + timedelta(hours=random.randint(2, 8))
            synthetic_patrols.append({
                "vehicle_id": random.choice(all_vehicle_ids),
                "officer_id": random.choice(employee_ids),
                "patrol_area": f"Sector {random.randint(1,15)} - {random.choice(district_names)}",
                "start_time": start.isoformat(),
                "end_time": end.isoformat(),
                "status": random.choice(["Completed", "Completed", "Suspended"]),
                "notes": f"Routine patrolling completed. Checked major checkpoints.",
                "is_synthetic": True
            })
        batch_insert("patrol_logs", synthetic_patrols)

    # ── 14. ChatMessages (target 5000) ────────────────────────────────────────
    chat_needed = max(0, 5000 - chat_count)
    synthetic_chats = []
    print(f"Generating {chat_needed} ChatMessages...")
    
    # We can pre-generate 50 conversation IDs
    conv_ids = [str(uuid.uuid4()) for _ in range(50)]
    chat_templates = [
        ("user", "Show me the recent burglary cases in Bengaluru."),
        ("assistant", "I found 5 recent burglary cases in Bengaluru. Here are the case IDs: CM003, CM012, CM029, CM045, CM077."),
        ("user", "Are there any repeated accused persons across these cases?"),
        ("assistant", "Yes, accused 'Raju Gowda' is linked to both CM012 and CM045 burglary cases. He has a risk score of 85."),
        ("user", "What is the recommended patrol deployment for Koramangala this weekend?"),
        ("assistant", "The Prediction Engine recommends deploying 3 patrol units around Koramangala 5th Block and 8th Block between 22:00 and 02:00 hours based on recent theft patterns.")
    ]
    
    for i in range(chat_needed):
        conv_id = random.choice(conv_ids)
        role, content = random.choice(chat_templates)
        # Add some variation
        if role == "user" and random.random() < 0.2:
            content = f"Check network graph for accused ID {random.randint(10,50)}."
        elif role == "assistant" and "Gowda" in content:
            content = f"Yes, accused 'Manjunath Hegde' is linked to multiple case records with a risk score of {random.randint(60,95)}."
            
        synthetic_chats.append({
            "conversation_id": conv_id,
            "role": role,
            "content": content,
            "created_at": random_date(start_dt, end_dt).isoformat()
        })
    batch_insert("chat_messages", synthetic_chats)

    # ── 15. Alerts (target 50) ────────────────────────────────────────────────
    try:
        alerts_count_db = len(supabase.table("alerts").select("id").execute().data)
    except Exception as e:
        print("  [SKIP] alerts seeding — table does not exist yet. Run SQL first.")
        alerts_count_db = 50 # Skip

    if alerts_count_db < 50:
        alerts_needed = 50 - alerts_count_db
        synthetic_alerts = []
        print(f"Generating {alerts_needed} Alerts...")
        alert_titles = [
            ("Looting Reported", "Assault/Robbery", "High"),
            ("Unusual Crowd Assembly", "Public Order", "Medium"),
            ("Vehicle Speeding Alert", "Traffic Violations", "Low"),
            ("Illegal Weapon Possession Reported", "Arms Act", "Critical"),
            ("Cyber Fraud Spike Detected", "Cyber Crime", "High")
        ]
        for i in range(alerts_needed):
            title, type_val, sev = random.choice(alert_titles)
            lat = round(random.uniform(12.9, 13.1), 6)
            lng = round(random.uniform(77.5, 77.7), 6)
            
            synthetic_alerts.append({
                "type": type_val,
                "severity": sev,
                "title": f"{title} in {random.choice(district_names)}",
                "description": f"Live telemetry alert: {title} observed near checkpoint. Immediate intervention suggested.",
                "district": random.choice(district_names),
                "location": f"Checkpoint {random.randint(1,20)} Main Road",
                "latitude": lat,
                "longitude": lng,
                "timestamp": random_date(start_dt, end_dt).isoformat(),
                "is_read": random.choice([True, False]),
                "is_synthetic": True
            })
        batch_insert("alerts", synthetic_alerts)

    print("\n=== Database expansion completed successfully! ===\n")

if __name__ == "__main__":
    main()
