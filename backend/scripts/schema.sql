-- schema.sql
-- Run this in the Supabase SQL Editor to recreate the schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-----------------------------------------
-- 1. DROP EXISTING TABLES (Safeguard)
-----------------------------------------
DROP TABLE IF EXISTS public.evidence CASCADE;
DROP TABLE IF EXISTS public.complainant_details CASCADE;
DROP TABLE IF EXISTS public.accused CASCADE;
DROP TABLE IF EXISTS public.victim CASCADE;
DROP TABLE IF EXISTS public.case_master CASCADE;
DROP TABLE IF EXISTS public.case_status_master CASCADE;
DROP TABLE IF EXISTS public.crime_head CASCADE;
DROP TABLE IF EXISTS public.employee CASCADE;
DROP TABLE IF EXISTS public.unit CASCADE;
DROP TABLE IF EXISTS public.district CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;

-----------------------------------------
-- 2. CREATE TABLES
-----------------------------------------

CREATE TABLE public.district (
    district_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    district_name TEXT NOT NULL
);

CREATE TABLE public.unit (
    police_station_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unit_name TEXT NOT NULL,
    district_id UUID REFERENCES public.district(district_id) ON DELETE CASCADE
);

CREATE TABLE public.employee (
    police_person_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    first_name TEXT NOT NULL,
    kgid TEXT UNIQUE
);

CREATE TABLE public.crime_head (
    crime_major_head_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    crime_group_name TEXT NOT NULL
);

CREATE TABLE public.case_status_master (
    case_status_id INT PRIMARY KEY,
    case_status_name TEXT NOT NULL
);

CREATE TABLE public.case_master (
    case_master_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    crime_no TEXT NOT NULL,
    case_no TEXT,
    crime_registered_date TIMESTAMPTZ DEFAULT now(),
    incident_from_date TIMESTAMPTZ,
    brief_facts TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    case_status_id INT REFERENCES public.case_status_master(case_status_id),
    crime_major_head_id UUID REFERENCES public.crime_head(crime_major_head_id),
    police_person_id UUID REFERENCES public.employee(police_person_id),
    police_station_id UUID REFERENCES public.unit(police_station_id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.victim (
    victim_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    case_master_id UUID REFERENCES public.case_master(case_master_id) ON DELETE CASCADE,
    victim_name TEXT,
    age_year INT,
    gender_id INT
);

CREATE TABLE public.accused (
    accused_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    case_master_id UUID REFERENCES public.case_master(case_master_id) ON DELETE CASCADE,
    accused_name TEXT,
    age_year INT,
    risk_score NUMERIC DEFAULT 0
);

CREATE TABLE public.complainant_details (
    complainant_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    case_master_id UUID REFERENCES public.case_master(case_master_id) ON DELETE CASCADE,
    complainant_name TEXT,
    phone_number TEXT
);

CREATE TABLE public.evidence (
    evidence_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    case_master_id UUID REFERENCES public.case_master(case_master_id) ON DELETE CASCADE,
    file_name TEXT,
    description TEXT,
    type TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-----------------------------------------
-- 3. INSERT STATIC LOOKUP DATA
-----------------------------------------
INSERT INTO public.case_status_master (case_status_id, case_status_name) VALUES 
(1, 'Open'),
(2, 'Under Investigation'),
(3, 'Closed'),
(4, 'Pending');

-----------------------------------------
-- 4. ROW LEVEL SECURITY (RLS)
-----------------------------------------
-- Enable RLS on all tables
ALTER TABLE public.district ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crime_head ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_status_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.victim ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accused ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complainant_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Deny all access to anon / authenticated by default, because all operations
-- are proxied securely through the FastAPI backend using the Service Role Key.
-- The service_role key automatically bypasses RLS.
-- (If any frontend direct access is strictly needed, uncomment below)
-- CREATE POLICY "Allow public read access" ON public.case_master FOR SELECT USING (true);
