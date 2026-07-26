-- ============================================================
-- KSP Smart Police Intelligence Platform — Supabase Schema
-- Run this in the Supabase SQL Editor BEFORE running seed_from_excel.py
-- ============================================================

-- Reference / Lookup Tables

CREATE TABLE IF NOT EXISTS public.state (
    state_id    INTEGER PRIMARY KEY,
    state_name  TEXT NOT NULL,
    nationality_id INTEGER,
    active      SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.district (
    district_id   INTEGER PRIMARY KEY,
    district_name TEXT NOT NULL,
    state_id      INTEGER REFERENCES public.state(state_id),
    active        SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.unit_type (
    unit_type_id   INTEGER PRIMARY KEY,
    unit_type_name TEXT NOT NULL,
    city_dist_state TEXT,
    hierarchy      INTEGER,
    active         SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.unit (
    unit_id       INTEGER PRIMARY KEY,
    unit_name     TEXT NOT NULL,
    type_id       INTEGER REFERENCES public.unit_type(unit_type_id),
    parent_unit   INTEGER,
    nationality_id INTEGER,
    state_id      INTEGER REFERENCES public.state(state_id),
    district_id   INTEGER REFERENCES public.district(district_id),
    active        SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.rank (
    rank_id    INTEGER PRIMARY KEY,
    rank_name  TEXT NOT NULL,
    hierarchy  INTEGER,
    active     SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.designation (
    designation_id   INTEGER PRIMARY KEY,
    designation_name TEXT NOT NULL,
    active           SMALLINT DEFAULT 1,
    sort_order       INTEGER
);

CREATE TABLE IF NOT EXISTS public.case_category (
    case_category_id INTEGER PRIMARY KEY,
    lookup_value     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.gravity_offence (
    gravity_offence_id INTEGER PRIMARY KEY,
    lookup_value       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.crime_head (
    crime_head_id    INTEGER PRIMARY KEY,
    crime_group_name TEXT NOT NULL,
    active           SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.crime_sub_head (
    crime_sub_head_id INTEGER PRIMARY KEY,
    crime_head_id     INTEGER REFERENCES public.crime_head(crime_head_id),
    crime_head_name   TEXT NOT NULL,
    seq_id            INTEGER
);

CREATE TABLE IF NOT EXISTS public.court (
    court_id    INTEGER PRIMARY KEY,
    court_name  TEXT NOT NULL,
    district_id INTEGER REFERENCES public.district(district_id),
    state_id    INTEGER REFERENCES public.state(state_id),
    active      SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.case_status_master (
    case_status_id   INTEGER PRIMARY KEY,
    case_status_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.act (
    act_code        TEXT PRIMARY KEY,
    act_description TEXT NOT NULL,
    short_name      TEXT,
    active          SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.section (
    act_code            TEXT REFERENCES public.act(act_code),
    section_code        TEXT,
    section_description TEXT,
    active              SMALLINT DEFAULT 1,
    PRIMARY KEY (act_code, section_code)
);

CREATE TABLE IF NOT EXISTS public.caste_master (
    caste_id   INTEGER PRIMARY KEY,
    caste_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.religion_master (
    religion_id   INTEGER PRIMARY KEY,
    religion_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.occupation_master (
    occupation_id   INTEGER PRIMARY KEY,
    occupation_name TEXT NOT NULL
);

-- Core Operational Tables

CREATE TABLE IF NOT EXISTS public.employee (
    employee_id          INTEGER PRIMARY KEY,
    district_id          INTEGER REFERENCES public.district(district_id),
    unit_id              INTEGER REFERENCES public.unit(unit_id),
    rank_id              INTEGER REFERENCES public.rank(rank_id),
    designation_id       INTEGER REFERENCES public.designation(designation_id),
    kgid                 TEXT UNIQUE,
    first_name           TEXT NOT NULL,
    employee_dob         DATE,
    gender_id            TEXT,
    blood_group_id       INTEGER,
    physically_challenged SMALLINT DEFAULT 0,
    appointment_date     DATE,
    -- Synthetic fields
    photo_url            TEXT,
    is_synthetic         BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.case_master (
    case_master_id        INTEGER PRIMARY KEY,
    crime_no              TEXT UNIQUE,
    case_no               TEXT,
    crime_registered_date DATE,
    police_person_id      INTEGER REFERENCES public.employee(employee_id),
    police_station_id     INTEGER REFERENCES public.unit(unit_id),
    case_category_id      INTEGER REFERENCES public.case_category(case_category_id),
    gravity_offence_id    INTEGER REFERENCES public.gravity_offence(gravity_offence_id),
    crime_major_head_id   INTEGER REFERENCES public.crime_head(crime_head_id),
    crime_minor_head_id   INTEGER REFERENCES public.crime_sub_head(crime_sub_head_id),
    case_status_id        INTEGER REFERENCES public.case_status_master(case_status_id),
    court_id              INTEGER REFERENCES public.court(court_id),
    incident_from_date    TIMESTAMP,
    incident_to_date      TIMESTAMP,
    info_received_ps_date TIMESTAMP,
    latitude              NUMERIC(10,6),
    longitude             NUMERIC(10,6),
    brief_facts           TEXT
);

CREATE TABLE IF NOT EXISTS public.complainant_details (
    complainant_id   INTEGER PRIMARY KEY,
    case_master_id   INTEGER REFERENCES public.case_master(case_master_id),
    complainant_name TEXT,
    age_year         INTEGER,
    occupation_id    INTEGER REFERENCES public.occupation_master(occupation_id),
    religion_id      INTEGER REFERENCES public.religion_master(religion_id),
    caste_id         INTEGER REFERENCES public.caste_master(caste_id),
    gender_id        TEXT
);

CREATE TABLE IF NOT EXISTS public.victim (
    victim_master_id INTEGER PRIMARY KEY,
    case_master_id   INTEGER REFERENCES public.case_master(case_master_id),
    victim_name      TEXT,
    age_year         INTEGER,
    gender_id        TEXT,
    victim_police    SMALLINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.accused (
    accused_master_id INTEGER PRIMARY KEY,
    case_master_id    INTEGER REFERENCES public.case_master(case_master_id),
    accused_name      TEXT,
    age_year          INTEGER,
    gender_id         TEXT,
    person_id         TEXT,
    -- Synthetic fields (not in Excel)
    risk_score        INTEGER,
    known_aliases     TEXT[],
    is_synthetic      BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.arrest_surrender (
    arrest_surrender_id        INTEGER PRIMARY KEY,
    case_master_id             INTEGER REFERENCES public.case_master(case_master_id),
    arrest_surrender_type_id   INTEGER,
    arrest_surrender_date      DATE,
    arrest_surrender_state_id  INTEGER,
    arrest_surrender_district_id INTEGER,
    police_station_id          INTEGER REFERENCES public.unit(unit_id),
    io_id                      INTEGER REFERENCES public.employee(employee_id),
    court_id                   INTEGER REFERENCES public.court(court_id),
    accused_master_id          INTEGER REFERENCES public.accused(accused_master_id),
    is_accused                 SMALLINT,
    is_complainant_accused     SMALLINT
);

CREATE TABLE IF NOT EXISTS public.chargesheet_details (
    cs_id             INTEGER PRIMARY KEY,
    case_master_id    INTEGER REFERENCES public.case_master(case_master_id),
    cs_date           DATE,
    cs_type           TEXT,
    police_person_id  INTEGER REFERENCES public.employee(employee_id)
);

-- AI Chat persistence table (Phase 5)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL,
    user_id         UUID,
    role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments table (Phase 2 — Assign Work module)
CREATE TABLE IF NOT EXISTS public.assignments (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    officer_id  INTEGER REFERENCES public.employee(employee_id),
    type        TEXT NOT NULL CHECK (type IN ('Case', 'Evidence Review', 'Patrol Duty', 'Investigation')),
    ref_id      TEXT,
    status      TEXT NOT NULL DEFAULT 'Assigned' CHECK (status IN ('Assigned','Pending','Completed','Rejected')),
    progress    INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    due_date    DATE,
    created_by  INTEGER REFERENCES public.employee(employee_id),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log table (Phase 7)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor       TEXT,
    role        TEXT,
    action      TEXT NOT NULL,
    target      TEXT,
    target_id   TEXT,
    timestamp   TIMESTAMPTZ DEFAULT NOW(),
    ip_address  TEXT
);

-- Evidence table (Phase 3 — Supabase Storage backed)
CREATE TABLE IF NOT EXISTS public.evidence (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_master_id  INTEGER REFERENCES public.case_master(case_master_id),
    file_name       TEXT NOT NULL,
    file_size       BIGINT,
    mime_type       TEXT,
    storage_path    TEXT,
    public_url      TEXT,
    uploaded_by     INTEGER REFERENCES public.employee(employee_id),
    uploaded_at     TIMESTAMPTZ DEFAULT NOW(),
    description     TEXT,
    tags            TEXT[],
    ai_analysis     TEXT,
    is_sample       BOOLEAN DEFAULT FALSE
);

-- Enable Row Level Security (can be configured later)
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence       ENABLE ROW LEVEL SECURITY;
