"""
KSP Intelligence Dashboard — Synthetic Mock Data (Python port of frontend/src/mockApi/mockData.ts)
⚠️ All data is entirely fictional. No real persons, cases, or events are represented.
"""

import math
import random
from datetime import datetime, timedelta
from typing import Any

# ── Seeded RNG ────────────────────────────────────────────────────────────────
_seed = [0xDEADBEEF]

def _rng() -> float:
    _seed[0] = (_seed[0] * 1664525 + 1013904223) & 0xFFFFFFFF
    return (_seed[0] & 0xFFFFFFFF) / 0xFFFFFFFF

def _rand(a: int, b: int) -> int:
    return math.floor(_rng() * (b - a + 1)) + a

def _pick(lst: list) -> Any:
    return lst[_rand(0, len(lst) - 1)]

def _pick_n(lst: list, n: int) -> list:
    copy = list(lst)
    result = []
    for _ in range(n):
        if not copy:
            break
        idx = _rand(0, len(copy) - 1)
        result.append(copy.pop(idx))
    return result

def _rand_date(days_back: int) -> str:
    d = datetime.utcnow() - timedelta(days=_rand(0, days_back))
    d = d.replace(hour=_rand(0, 23), minute=_rand(0, 59), second=0, microsecond=0)
    return d.isoformat() + "Z"

# ── Constants ─────────────────────────────────────────────────────────────────
DISTRICTS = [
    "Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Mangaluru",
    "Hubballi-Dharwad", "Belagavi", "Kalaburagi", "Shivamogga",
    "Tumakuru", "Davangere",
]

STATIONS = [
    "Cubbon Park PS", "Sadashivanagar PS", "Rajajinagar PS", "Yeshwanthpur PS",
    "Whitefield PS", "Electronic City PS", "Hebbal PS", "KR Puram PS",
    "Yelahanka PS", "Koramangala PS", "Indiranagar PS", "Jayanagar PS",
    "Banashankari PS", "JP Nagar PS", "Silk Board PS", "Madivala PS",
    "Bellandur PS", "Marathahalli PS", "HSR Layout PS", "BTM Layout PS",
    "Basavanagudi PS", "Malleswaram PS", "Shivajinagar PS", "Cottonpet PS",
    "Vijayanagar PS",
]

CRIME_TYPES = [
    "Robbery", "Vehicle Theft", "Burglary", "Assault", "Cybercrime",
    "Drug Trafficking", "Murder", "Kidnapping", "Extortion", "Fraud",
    "Domestic Violence", "Chain Snatching", "Mob Violence", "Arms Trafficking",
    "Human Trafficking", "POCSO", "Cheating", "Forgery", "Arson",
]

WEAPONS = ["Knife", "Firearm", "Iron Rod", "Machete", "None", "Unknown", "Acid", "Explosive Device"]

MALE_NAMES = [
    "Arjun Sharma", "Ravi Kumar", "Manoj Nair", "Vikram Singh", "Suresh Gowda",
    "Kiran Patil", "Pradeep Rao", "Sanjay Reddy", "Anil Verma", "Deepak Hegde",
    "Ramesh Shetty", "Ganesh Kulkarni", "Naveen Murthy", "Rohit Desai", "Sunil Naik",
    "Ajay Bhat", "Mahesh Kumar", "Vinay Gowda", "Shiva Prasad", "Kartik Joshi",
]

FEMALE_NAMES = [
    "Priya Sharma", "Kavitha Nair", "Sunita Rao", "Meera Reddy", "Ananya Gowda",
    "Lakshmi Patil", "Divya Hegde", "Rekha Shetty", "Pooja Kulkarni", "Nandini Murthy",
    "Sindhu Desai", "Asha Naik", "Bhavana Bhat", "Swathi Kumar", "Rashmi Gowda",
]

ALL_NAMES = MALE_NAMES + FEMALE_NAMES

OFFICER_NAMES = [
    "SI Ramesh Kumar", "PSI Kavitha Nair", "SI Vikram Singh", "DySP Suresh Rao",
    "SI Ananya Gowda", "PSI Manoj Patil", "SI Priya Reddy", "Inspector Kiran Hegde",
    "SI Sunil Naik", "PSI Deepak Shetty",
]

LOCATIONS = [
    {"name": "MG Road", "lat": 12.9756, "lng": 77.6066},
    {"name": "Koramangala", "lat": 12.9352, "lng": 77.6245},
    {"name": "Whitefield", "lat": 12.9698, "lng": 77.7500},
    {"name": "Jayanagar 4th Block", "lat": 12.9254, "lng": 77.5838},
    {"name": "Marathahalli Bridge", "lat": 12.9591, "lng": 77.6974},
    {"name": "Silk Board", "lat": 12.9166, "lng": 77.6234},
    {"name": "Electronic City", "lat": 12.8456, "lng": 77.6603},
    {"name": "Hebbal Flyover", "lat": 13.0358, "lng": 77.5970},
    {"name": "KR Market", "lat": 12.9716, "lng": 77.5726},
    {"name": "Yelahanka", "lat": 13.1005, "lng": 77.5963},
    {"name": "BTM Layout", "lat": 12.9166, "lng": 77.6101},
    {"name": "HSR Layout", "lat": 12.9116, "lng": 77.6389},
    {"name": "Indiranagar 100ft Road", "lat": 12.9784, "lng": 77.6408},
    {"name": "Malleshwaram Circle", "lat": 13.0027, "lng": 77.5681},
    {"name": "Rajajinagar Main Road", "lat": 12.9938, "lng": 77.5527},
]

STATUSES = ["Open", "Under Investigation", "Closed", "Pending"]
SEVERITIES = ["Critical", "High", "Medium", "Low"]
RANKS = ["Constable", "Head Constable", "ASI", "SI", "PSI", "Inspector", "DySP", "SP", "DIG", "IG"]
AUDIT_ACTIONS = ["Login", "Logout", "View FIR", "Edit FIR", "Create User", "Delete User",
                 "Export Report", "View Network", "Search Records", "Assign Case"]
EV_TYPES = ["Image", "Video", "Audio", "Document", "Physical"]
EV_NAMES = ["crime_scene.jpg", "cctv_footage.mp4", "witness_recording.mp3",
            "fir_copy.pdf", "forensic_report.pdf", "suspect_photo.jpg",
            "map_screenshot.png", "phone_extract.pdf"]
ALERT_TYPES = ["Crime Spike", "Repeat Offender Released", "Vehicle Theft Alert",
               "Cyber Attack", "Gang Activity", "High Risk Zone"]
ALERT_SEVERITIES = ["Critical", "High", "Medium", "Low"]
CAR_MAKES = ["Maruti Suzuki", "Hyundai", "Honda", "Toyota", "Tata", "Mahindra", "KIA", "Bajaj", "Hero", "TVS"]
CAR_MODELS = ["Swift", "i20", "City", "Innova", "Nexon", "Bolero", "Seltos", "Pulsar", "Splendor", "Apache"]
COLORS = ["White", "Black", "Silver", "Red", "Blue", "Grey", "Green", "Yellow"]
VEHICLE_STATUSES = ["Clear", "Wanted", "Stolen", "Under Watch"]
PREDICTION_TYPES = ["Hotspot", "Repeat Offender", "Trend", "Patrol"]
PERSON_ROLES = ["Suspect", "Victim", "Witness", "Associate"]
EDGE_TYPES = ["Owns", "Called", "Visited", "Associated", "Arrested", "Investigated", "Linked"]

# ── FIRs ─────────────────────────────────────────────────────────────────────
MOCK_FIRS: list[dict] = []
for i in range(520):
    loc = _pick(LOCATIONS)
    crime_type = _pick(CRIME_TYPES)
    gender = "Male" if _rng() > 0.4 else "Female"
    victim_name = _pick(MALE_NAMES) if gender == "Male" else _pick(FEMALE_NAMES)
    suspect_gender = "Male" if _rng() > 0.3 else "Female"
    suspect_name = _pick(MALE_NAMES) if suspect_gender == "Male" else _pick(FEMALE_NAMES)
    date_reported = _rand_date(365)
    year = datetime.fromisoformat(date_reported.rstrip("Z")).year
    MOCK_FIRS.append({
        "id": f"fir-{i + 1}",
        "firNumber": f"KSP/{year}/{str(i + 1001).zfill(5)}",
        "crimeType": crime_type,
        "description": f"{crime_type} incident reported at {loc['name']}. Case under investigation by {_pick(STATIONS)}.",
        "victimName": victim_name,
        "victimAge": _rand(18, 75),
        "victimGender": gender,
        "suspectName": suspect_name,
        "suspectAge": _rand(18, 60),
        "officerName": _pick(OFFICER_NAMES),
        "officerId": f"off-{_rand(1, 10)}",
        "district": _pick(DISTRICTS),
        "station": _pick(STATIONS),
        "status": _pick(STATUSES),
        "dateReported": date_reported,
        "dateOccurred": _rand_date(370),
        "location": loc["name"],
        "latitude": loc["lat"] + (_rng() - 0.5) * 0.05,
        "longitude": loc["lng"] + (_rng() - 0.5) * 0.05,
        "severity": _pick(SEVERITIES),
        "weaponUsed": _pick(WEAPONS) if _rng() > 0.5 else None,
        "evidenceCount": _rand(0, 8),
    })

# ── Persons ───────────────────────────────────────────────────────────────────
MOCK_PERSONS: list[dict] = []
for i in range(55):
    gender = "Male" if _rng() > 0.35 else "Female"
    name = _pick(MALE_NAMES) if gender == "Male" else _pick(FEMALE_NAMES)
    linked_firs = [f["id"] for f in _pick_n(MOCK_FIRS, _rand(1, 5))]
    MOCK_PERSONS.append({
        "id": f"person-{i + 1}",
        "name": name,
        "age": _rand(18, 65),
        "gender": gender,
        "dob": f"{_rand(1960, 2003)}-{str(_rand(1, 12)).zfill(2)}-{str(_rand(1, 28)).zfill(2)}",
        "address": f"{_rand(1, 500)}, {_pick(LOCATIONS)['name']}, {_pick(DISTRICTS)}",
        "district": _pick(DISTRICTS),
        "phone": f"+91 {_rand(7000000000, 9999999999)}",
        "aadhaarLast4": str(_rand(1000, 9999)),
        "role": _pick(PERSON_ROLES),
        "riskScore": _rand(10, 98),
        "linkedFIRs": linked_firs,
        "linkedPersons": [],
        "notes": None,
    })

for i, p in enumerate(MOCK_PERSONS):
    others = [o["id"] for o in _pick_n(MOCK_PERSONS, _rand(1, 4)) if o["id"] != p["id"]]
    MOCK_PERSONS[i]["linkedPersons"] = others

# ── Vehicles ──────────────────────────────────────────────────────────────────
MOCK_VEHICLES: list[dict] = []
for i in range(80):
    owner = _pick(MOCK_PERSONS)
    reg = f"KA {str(_rand(1, 99)).zfill(2)} {chr(65 + _rand(0, 25))}{chr(65 + _rand(0, 25))} {_rand(1000, 9999)}"
    MOCK_VEHICLES.append({
        "id": f"vehicle-{i + 1}",
        "registrationNumber": reg,
        "type": "Car" if _rng() > 0.4 else "Motorcycle",
        "make": _pick(CAR_MAKES),
        "model": _pick(CAR_MODELS),
        "color": _pick(COLORS),
        "ownerId": owner["id"],
        "ownerName": owner["name"],
        "status": _pick(VEHICLE_STATUSES),
        "linkedFIRs": [f["id"] for f in _pick_n(MOCK_FIRS, _rand(0, 3))],
    })

# ── Evidence ──────────────────────────────────────────────────────────────────
MOCK_EVIDENCE: list[dict] = []
for i in range(200):
    fir = _pick(MOCK_FIRS)
    ev_type = _pick(EV_TYPES)
    base = _pick(EV_NAMES)
    dot_pos = base.rfind(".")
    fname = f"{base[:dot_pos]}_{i + 1}{base[dot_pos:]}"
    mime = {"Image": "image/jpeg", "Video": "video/mp4", "Audio": "audio/mpeg"}.get(ev_type, "application/pdf")
    MOCK_EVIDENCE.append({
        "id": f"ev-{i + 1}",
        "firId": fir["id"],
        "type": ev_type,
        "fileName": fname,
        "fileSize": _rand(50000, 50000000),
        "mimeType": mime,
        "uploadedBy": _pick(OFFICER_NAMES),
        "uploadedAt": _rand_date(180),
        "description": f"{ev_type} evidence collected from {fir['location']} for FIR {fir['firNumber']}.",
        "tags": _pick_n(["forensic", "cctv", "physical", "digital", "witness", "suspect"], _rand(1, 3)),
    })

# ── Alerts ────────────────────────────────────────────────────────────────────
MOCK_ALERTS: list[dict] = []
for i in range(60):
    a_type = _pick(ALERT_TYPES)
    severity = _pick(ALERT_SEVERITIES)
    district = _pick(DISTRICTS)
    loc = _pick(LOCATIONS)
    MOCK_ALERTS.append({
        "id": f"alert-{i + 1}",
        "type": a_type,
        "severity": severity,
        "title": f"{a_type} - {district}",
        "description": f"{a_type} detected in {loc['name']}, {district}. Immediate attention required. "
                       f"Estimated impact: {_rand(2, 25)} incidents within 24h.",
        "district": district,
        "location": loc["name"],
        "timestamp": _rand_date(7),
        "isRead": _rng() > 0.6,
    })

# ── Predictions ───────────────────────────────────────────────────────────────
MOCK_PREDICTIONS: list[dict] = []
for i in range(40):
    p_type = _pick(PREDICTION_TYPES)
    loc = _pick(LOCATIONS)
    MOCK_PREDICTIONS.append({
        "id": f"pred-{i + 1}",
        "type": p_type,
        "district": _pick(DISTRICTS),
        "location": loc["name"],
        "latitude": loc["lat"] + (_rng() - 0.5) * 0.02,
        "longitude": loc["lng"] + (_rng() - 0.5) * 0.02,
        "confidence": _rand(55, 95),
        "riskScore": _rand(30, 99),
        "description": f"Model predicts elevated {_pick(CRIME_TYPES)} activity in {loc['name']} area based on historical patterns.",
        "recommendation": f"Deploy {_rand(2, 6)} additional patrol units to {loc['name']}. "
                          f"Focus on {_pick(['evening', 'night', 'morning'])} hours.",
        "predictedDate": _rand_date(-7),
        "crimeType": _pick(CRIME_TYPES),
    })

# ── Criminal Network ──────────────────────────────────────────────────────────
MOCK_NETWORK_NODES: list[dict] = [
    *[{"id": p["id"], "label": p["name"], "type": "Person", "riskScore": p["riskScore"], "data": dict(p)} for p in MOCK_PERSONS[:30]],
    *[{"id": v["id"], "label": v["registrationNumber"], "type": "Vehicle", "data": dict(v)} for v in MOCK_VEHICLES[:10]],
    *[{"id": f["id"], "label": f["firNumber"], "type": "Case", "data": dict(f)} for f in MOCK_FIRS[:10]],
    {"id": "org-1", "label": "Shadow Network KA", "type": "Organization", "data": {"description": "Suspected organized crime group"}},
    {"id": "org-2", "label": "Eastern Cartel", "type": "Organization", "data": {"description": "Drug trafficking network"}},
    {"id": "loc-1", "label": "Warehouse A - Yeshwanthpur", "type": "Location", "data": {"lat": 13.0227, "lng": 77.5416}},
    {"id": "phone-1", "label": "+91-XXXXXXXX42", "type": "Phone", "data": {"carrier": "Jio"}},
    {"id": "phone-2", "label": "+91-XXXXXXXX17", "type": "Phone", "data": {"carrier": "Airtel"}},
    {"id": "weapon-1", "label": "Country-made Pistol", "type": "Weapon", "data": {"caliber": ".32"}},
    {"id": "weapon-2", "label": "Machete (Exhibit A)", "type": "Weapon", "data": {}},
]

MOCK_NETWORK_EDGES: list[dict] = []
for i in range(60):
    src = _pick(MOCK_NETWORK_NODES)
    tgt = _pick([n for n in MOCK_NETWORK_NODES if n["id"] != src["id"]])
    e_type = _pick(EDGE_TYPES)
    MOCK_NETWORK_EDGES.append({"id": f"edge-{i + 1}", "source": src["id"], "target": tgt["id"], "type": e_type, "label": e_type})

# ── KPIs ──────────────────────────────────────────────────────────────────────
MOCK_KPIS = {
    "totalFIRs": len(MOCK_FIRS),
    "openCases": sum(1 for f in MOCK_FIRS if f["status"] == "Open"),
    "solvedCases": sum(1 for f in MOCK_FIRS if f["status"] == "Closed"),
    "todayCrimes": 14,
    "todayArrests": 7,
    "activeInvestigations": sum(1 for f in MOCK_FIRS if f["status"] == "Under Investigation"),
    "repeatOffenders": 23,
    "crimeRiskScore": 72,
}

# ── Officers ──────────────────────────────────────────────────────────────────
MOCK_OFFICERS: list[dict] = []
for i in range(25):
    name = _pick(ALL_NAMES)
    role = "Admin" if i == 0 else "Analyst" if i < 5 else "Officer"
    MOCK_OFFICERS.append({
        "id": f"off-{i + 1}",
        "name": name,
        "rank": _pick(RANKS),
        "badgeNumber": f"KSP{_rand(10000, 99999)}",
        "district": _pick(DISTRICTS),
        "station": _pick(STATIONS),
        "role": role,
        "email": f"{name.lower().replace(' ', '.')}@ksp.gov.in",
        "phone": f"+91 {_rand(7000000000, 9999999999)}",
        "assignedCases": _rand(2, 25),
        "closedCases": _rand(1, 20),
        "joinedDate": f"{_rand(2010, 2023)}-{str(_rand(1, 12)).zfill(2)}-{str(_rand(1, 28)).zfill(2)}",
        "status": "Active" if _rng() > 0.1 else "On Leave",
    })

# ── Audit Logs ────────────────────────────────────────────────────────────────
MOCK_AUDIT_LOGS: list[dict] = []
for i in range(100):
    officer = _pick(MOCK_OFFICERS)
    action = _pick(AUDIT_ACTIONS)
    MOCK_AUDIT_LOGS.append({
        "id": f"audit-{i + 1}",
        "action": action,
        "performedBy": officer["name"],
        "targetUser": _pick(MOCK_OFFICERS)["name"] if _rng() > 0.5 else None,
        "timestamp": _rand_date(30),
        "details": f"{action} performed by {officer['name']} from {officer['station']}.",
        "ipAddress": f"192.168.{_rand(1, 10)}.{_rand(1, 254)}",
    })

# ── Activity Feed ─────────────────────────────────────────────────────────────
ACTIVITY_TYPES = ["FIR Filed", "Arrest Made", "Case Updated", "Alert Raised", "Evidence Added", "Case Closed"]
ACTIVITY_ICONS = {"FIR Filed": "📋", "Arrest Made": "🚔", "Case Updated": "📝", "Alert Raised": "🚨", "Evidence Added": "🔍", "Case Closed": "✅"}

LIVE_ACTIVITY_ITEMS: list[dict] = []
for i in range(30):
    fir = _pick(MOCK_FIRS)
    a_type = _pick(ACTIVITY_TYPES)
    LIVE_ACTIVITY_ITEMS.append({
        "id": f"activity-{i + 1}",
        "type": a_type,
        "icon": ACTIVITY_ICONS[a_type],
        "message": f"{a_type}: {fir['firNumber']} — {fir['crimeType']} at {fir['location']}",
        "officer": _pick(OFFICER_NAMES),
        "timestamp": _rand_date(1),
        "severity": fir["severity"],
    })

# ── Analytics helpers ─────────────────────────────────────────────────────────
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def get_crime_trend():
    return [{"name": m, "crimes": _rand(30, 120), "arrests": _rand(10, 60), "solved": _rand(8, 50)} for m in MONTHS]


def get_hourly_trend():
    return [{"name": f"{str(h).zfill(2)}:00", "crimes": _rand(0, 25)} for h in range(24)]


def get_crime_distribution():
    return [{"name": t, "value": _rand(20, 150)} for t in CRIME_TYPES[:8]]


def get_district_comparison():
    return [{"name": d.split("-")[0].strip(), "crimes": _rand(20, 200), "arrests": _rand(10, 80), "solved": _rand(5, 60)} for d in DISTRICTS]


def get_weapon_analysis():
    return [{"name": w, "value": _rand(5, 80)} for w in WEAPONS if w != "Unknown"]


def get_age_distribution():
    return [{"name": "18-25", "value": _rand(80, 150)}, {"name": "26-35", "value": _rand(120, 200)},
            {"name": "36-45", "value": _rand(80, 130)}, {"name": "46-55", "value": _rand(40, 90)},
            {"name": "55+", "value": _rand(10, 40)}]


def get_gender_distribution():
    return [{"name": "Male", "value": _rand(300, 420)}, {"name": "Female", "value": _rand(80, 180)},
            {"name": "Other", "value": _rand(5, 20)}]


MOCK_CHAT_RESPONSES = [
    {
        "content": f"Based on analysis of {len(MOCK_FIRS)} FIRs in the database, I've identified the following key trends:\n\n"
                   "**Top Crime Categories:**\n• Vehicle Theft: 18% of total cases\n• Robbery: 15% of cases\n• Cybercrime: 12% of cases\n\n"
                   "**High Risk Zones:**\n• MG Road corridor shows elevated activity (↑23% MoM)\n• Whitefield Industrial Area — 7 incidents last week\n\n"
                   "**Recommendation:** Increase patrol density in Koramangala and BTM Layout during 20:00–02:00 hours.",
        "sources": [
            {"title": "FIR Database Analysis", "confidence": 94, "type": "Database"},
            {"title": "Predictive Model v2.1", "confidence": 87, "type": "ML Model"},
            {"title": "Historical Trend Report Q4", "confidence": 91, "type": "Report"},
        ],
    },
    {
        "content": "I found **3 high-risk individuals** with multiple FIR linkages in the specified area.\n\n"
                   "**Arjun Sharma** (Risk Score: 89) — Linked to 4 FIRs, last seen Koramangala\n"
                   "**Vikram Singh** (Risk Score: 82) — Linked to 3 FIRs, known vehicle thief\n"
                   "**Ravi Kumar** (Risk Score: 77) — Linked to 2 FIRs, suspected drug network",
        "sources": [
            {"title": "Person-of-Interest Registry", "confidence": 96, "type": "Database"},
            {"title": "Network Analysis Engine", "confidence": 83, "type": "Graph DB"},
        ],
    },
]

AI_SUGGESTED_QUESTIONS = [
    "Summarize recent crime trends in Bengaluru Urban",
    "Who are the top repeat offenders in Koramangala?",
    "What is the predicted crime hotspot for next week?",
    "Show connections between suspects in Case KSP/2024/01007",
    "Analyze weapon usage patterns over the last 6 months",
    "List all open robbery cases in Whitefield",
    "What patrol recommendations does the model suggest for this weekend?",
    "Compare crime rates across districts this quarter",
]
