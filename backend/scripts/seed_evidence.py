# -*- coding: utf-8 -*-
"""
seed_evidence.py
================
Phase 3 — Seeds placeholder/sample evidence into:
  1. Supabase Storage bucket "evidence"
  2. The public.evidence Postgres table

Uses royalty-free placeholder images downloaded from picsum.photos and
short sample video clips. All records are marked is_sample = true.

Usage:
    python backend/scripts/seed_evidence.py

Requirements:
    pip install supabase openpyxl python-dotenv requests
# -*- coding: utf-8 -*-
"""

import os, sys, io, uuid, time, random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(ROOT / "backend" / ".env")

from supabase import create_client, Client
import requests

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    sys.exit("ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in backend/.env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
BUCKET = "evidence"

# ── Ensure the bucket exists ────────────────────────────────────────────────
def ensure_bucket():
    try:
        buckets = supabase.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        if BUCKET not in bucket_names:
            supabase.storage.create_bucket(BUCKET, options={"public": True})
            print(f"[OK] Created storage bucket '{BUCKET}'")
        else:
            print(f"[OK] Bucket '{BUCKET}' already exists")
    except Exception as e:
        print(f"[WARN] Bucket check: {e}")

# ── Sample placeholder images from picsum.photos ────────────────────────────
SAMPLE_IMAGES = [
    # (seed_id, label, tags, description)
    (10,  "crime_scene_overview.jpg",       ["crime-scene", "overview", "outdoor"],
          "Crime scene overview — perimeter established, forensic team processing."),
    (20,  "suspect_cctv_still.jpg",         ["cctv", "suspect", "person"],
          "CCTV still capture: suspected individual near incident area at 02:14 AM."),
    (30,  "vehicle_scene.jpg",              ["vehicle", "scene", "physical"],
          "Vehicle sighted near crime scene. License plate partially visible."),
    (42,  "document_evidence.jpg",          ["document", "physical", "records"],
          "Printed document recovered as physical evidence at scene."),
    (56,  "fingerprint_analysis.jpg",       ["fingerprint", "forensic", "biometric"],
          "Latent fingerprint lifted from door handle — pending AFIS comparison."),
    (75,  "witness_statement_scan.jpg",     ["document", "witness", "statement"],
          "Scanned witness statement — signed and submitted to court."),
    (100, "aerial_location_map.jpg",        ["map", "location", "aerial"],
          "Satellite/aerial reference photo of the incident area."),
    (110, "contraband_recovery.jpg",        ["contraband", "physical", "recovery"],
          "Contraband items recovered during search operations — logged in evidence."),
    (120, "cash_evidence.jpg",              ["currency", "physical", "financial"],
          "Currency recovered from accused premises — denominations counted."),
    (133, "weapon_recovery.jpg",            ["weapon", "physical", "firearm"],
          "Weapon recovered at scene — ballistic examination pending."),
    (150, "medical_evidence.jpg",           ["medical", "forensic", "injury"],
          "Medical forensic photograph — injury documentation for court proceedings."),
    (167, "crowd_cctv.jpg",                 ["cctv", "public", "crowd"],
          "Public area CCTV footage frame — reviewing for suspect identification."),
]

SAMPLE_DOCS = [
    ("fir_scan_001.pdf",          ["document", "FIR", "official"],      "application/pdf", 245000,
     "Scanned original FIR document with complainant details."),
    ("forensic_report_lab.pdf",   ["document", "forensic", "lab"],      "application/pdf", 512000,
     "Forensic laboratory examination report — results attached."),
    ("court_order_copy.pdf",      ["document", "court", "legal"],       "application/pdf", 189000,
     "Copy of court remand order issued during the case proceedings."),
    ("vehicle_rc_document.pdf",   ["document", "vehicle", "RC"],        "application/pdf", 78000,
     "Vehicle registration certificate (RC) seized as evidence."),
]

def download_picsum(seed_id: int, width: int = 640, height: int = 480) -> bytes:
    """Download a deterministic placeholder image from picsum.photos."""
    url = f"https://picsum.photos/seed/{seed_id}/{width}/{height}"
    for attempt in range(3):
        try:
            resp = requests.get(url, timeout=15)
            if resp.status_code == 200:
                return resp.content
        except Exception as e:
            print(f"  [WARN] Download attempt {attempt+1} failed for seed {seed_id}: {e}")
            time.sleep(1)
    return b""

def create_dummy_pdf(name: str, size: int) -> bytes:
    """Create a minimal dummy PDF placeholder."""
    # Minimal valid PDF
    content = f"""%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
trailer<</Size 4/Root 1 0 R>>
startxref
190
%%EOF
% KSP Demo: {name} — sample placeholder document
""".encode()
    return content

def upload_to_storage(path: str, data: bytes, content_type: str) -> str | None:
    """Upload file to Supabase Storage and return public URL."""
    try:
        result = supabase.storage.from_(BUCKET).upload(
            path, data, file_options={"content-type": content_type, "upsert": "true"}
        )
        public_url = supabase.storage.from_(BUCKET).get_public_url(path)
        return public_url
    except Exception as e:
        print(f"  [ERR] Upload {path}: {e}")
        return None

def get_case_ids() -> list[int]:
    """Get a few real case IDs from the DB to link evidence to."""
    res = supabase.table("case_master").select("case_master_id").limit(20).execute()
    ids = [r["case_master_id"] for r in (res.data or [])]
    return ids if ids else [1, 2, 3]

def get_officer_ids() -> list[int]:
    """Get a few real officer IDs."""
    res = supabase.table("employee").select("employee_id, first_name").limit(10).execute()
    return [(r["employee_id"], r["first_name"]) for r in (res.data or [])] or [(1, "Demo Officer")]

def seed_images(case_ids: list[int], officers: list):
    print("\n[1/2] Seeding placeholder images...")
    for (seed_id, filename, tags, description) in SAMPLE_IMAGES:
        print(f"  Downloading {filename}...")
        data = download_picsum(seed_id)
        if not data:
            print(f"  [SKIP] Could not download {filename}")
            continue

        case_id = random.choice(case_ids)
        officer = random.choice(officers)
        storage_path = f"cases/{case_id}/{uuid.uuid4().hex[:8]}_{filename}"

        public_url = upload_to_storage(storage_path, data, "image/jpeg")
        if not public_url:
            continue

        record = {
            "case_master_id": case_id,
            "file_name": filename,
            "file_size": len(data),
            "mime_type": "image/jpeg",
            "storage_path": storage_path,
            "public_url": public_url,
            "uploaded_by": officer[0],
            "description": description,
            "tags": tags,
            "ai_analysis": (
                "[AI-Assisted - Demo Label] Image depicts: " + description[:80] + ". "
                "No real CV model applied - label generated by LLM from caption for demo only."
            ),
            "is_sample": True,
        }
        try:
            supabase.table("evidence").insert(record).execute()
            print(f"  [OK] {filename} → case {case_id}")
        except Exception as e:
            print(f"  [ERR] DB insert {filename}: {e}")

def seed_documents(case_ids: list[int], officers: list):
    print("\n[2/2] Seeding placeholder documents...")
    for (filename, tags, mime, size, description) in SAMPLE_DOCS:
        data = create_dummy_pdf(filename, size)
        case_id = random.choice(case_ids)
        officer = random.choice(officers)
        storage_path = f"cases/{case_id}/{uuid.uuid4().hex[:8]}_{filename}"

        public_url = upload_to_storage(storage_path, data, mime)
        if not public_url:
            continue

        record = {
            "case_master_id": case_id,
            "file_name": filename,
            "file_size": size,
            "mime_type": mime,
            "storage_path": storage_path,
            "public_url": public_url,
            "uploaded_by": officer[0],
            "description": description,
            "tags": tags,
            "ai_analysis": (
                "[Document - Demo Label] " + description + " OCR not applied in demo."
            ),
            "is_sample": True,
        }
        try:
            supabase.table("evidence").insert(record).execute()
            print(f"  [OK] {filename} → case {case_id}")
        except Exception as e:
            print(f"  [ERR] DB insert {filename}: {e}")

def main():
    print("=== Phase 3: Seeding Evidence into Supabase Storage ===\n")
    print("NOTE: All evidence is sample placeholder media for demo purposes.")
    print("      is_sample = true on all records.\n")

    ensure_bucket()

    case_ids = get_case_ids()
    officers = get_officer_ids()
    print(f"Linking evidence to {len(case_ids)} cases, {len(officers)} officers\n")

    seed_images(case_ids, officers)
    seed_documents(case_ids, officers)

    # Count total seeded
    try:
        res = supabase.table("evidence").select("id", count="exact").eq("is_sample", True).execute()
        print(f"\n=== Phase 3 DONE! Total sample evidence in DB: {res.count} ===\n")
    except Exception as e:
        print(f"\n=== Phase 3 DONE! (Count error: {e}) ===\n")

if __name__ == "__main__":
    main()
