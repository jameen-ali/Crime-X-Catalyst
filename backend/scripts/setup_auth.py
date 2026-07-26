import os
import sys
import uuid
from pathlib import Path

# ── path setup ───────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(ROOT / "backend" / ".env")

from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    sys.exit("ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in backend/.env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

DEMO_USERS = [
    {"email": "admin@ksp.gov.in", "password": "password123", "role": "Admin", "employee_id": 1, "name": "SP Suresh Rao"},
    {"email": "kavitha.nair@ksp.gov.in", "password": "password123", "role": "Officer", "employee_id": 2, "name": "SI Kavitha Nair"},
    {"email": "priya.sharma@ksp.gov.in", "password": "password123", "role": "Analyst", "employee_id": 3, "name": "Analyst Priya Sharma"}
]

def create_profiles_table():
    # Since we can't easily run DDL via REST API, we can use the Postgres function or we assume it's created.
    # Wait, we can't run arbitrary SQL easily without raw Postgres connection. 
    # Actually, we can use psycopg2 if DATABASE_URL is present.
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        import psycopg2
        print("Connecting to DB to create profiles table...")
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS public.profiles (
                id UUID PRIMARY KEY, -- References auth.users(id) but we don't enforce FK here just in case of permissions
                email TEXT,
                role TEXT CHECK (role IN ('Admin', 'ACP', 'Inspector', 'SI', 'Officer', 'Analyst')),
                employee_id INTEGER,
                name TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
            -- Drop existing policy if exists
            DROP POLICY IF EXISTS "Allow public read on profiles" ON public.profiles;
            CREATE POLICY "Allow public read on profiles" ON public.profiles FOR SELECT USING (true);
        """)
        conn.commit()
        cur.close()
        conn.close()
        print("Profiles table created.")
    else:
        print("WARNING: DATABASE_URL not found, cannot create profiles table. Please run SQL manually.")

def main():
    print("Setting up Supabase Auth Users and Profiles...")
    create_profiles_table()

    for u in DEMO_USERS:
        # Check if user exists (hacky way, we just try to create and catch error)
        try:
            res = supabase.auth.admin.create_user({
                "email": u["email"],
                "password": u["password"],
                "email_confirm": True
            })
            user_id = res.user.id
            print(f"Created user {u['email']} with ID {user_id}")
            
            # Insert into profiles
            supabase.table("profiles").upsert({
                "id": user_id,
                "email": u["email"],
                "role": u["role"],
                "employee_id": u["employee_id"],
                "name": u["name"]
            }).execute()
        except Exception as e:
            if "already exists" in str(e).lower() or "already registered" in str(e).lower():
                print(f"User {u['email']} already exists. Updating profile...")
                # Unfortunately, we can't easily get the ID of an existing user without listing all users.
                # Let's list users
                users_res = supabase.auth.admin.list_users()
                for existing_user in users_res:
                    if existing_user.email == u["email"]:
                        supabase.table("profiles").upsert({
                            "id": existing_user.id,
                            "email": u["email"],
                            "role": u["role"],
                            "employee_id": u["employee_id"],
                            "name": u["name"]
                        }).execute()
                        break
            else:
                print(f"Error creating {u['email']}: {e}")

if __name__ == '__main__':
    main()
