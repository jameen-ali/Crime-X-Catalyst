-- ============================================================
-- KSP Smart Police Intelligence Platform — Missing Tables Schema
-- Run this in the Supabase SQL Editor to support Phase 6 & 7 features
-- ============================================================

-- 1. Patrol Vehicles Table
CREATE TABLE IF NOT EXISTS public.patrol_vehicles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_number TEXT UNIQUE NOT NULL,
    vehicle_type        TEXT NOT NULL CHECK (vehicle_type IN ('Car', 'SUV', 'Motorcycle')),
    make                TEXT,
    model               TEXT,
    color               TEXT,
    status              TEXT NOT NULL CHECK (status IN ('Active', 'Maintenance', 'Inactive')),
    latitude            NUMERIC(10,6),
    longitude           NUMERIC(10,6),
    heading             NUMERIC(5,2),
    speed               NUMERIC(5,2),
    assigned_unit_id    INTEGER REFERENCES public.unit(unit_id),
    is_synthetic        BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Patrol Logs Table
CREATE TABLE IF NOT EXISTS public.patrol_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id  UUID REFERENCES public.patrol_vehicles(id) ON DELETE CASCADE,
    officer_id  INTEGER REFERENCES public.employee(employee_id),
    patrol_area TEXT NOT NULL,
    start_time  TIMESTAMPTZ DEFAULT NOW(),
    end_time    TIMESTAMPTZ,
    status      TEXT NOT NULL CHECK (status IN ('Ongoing', 'Completed', 'Suspended')),
    notes       TEXT,
    is_synthetic BOOLEAN DEFAULT TRUE
);

-- 3. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id  INTEGER REFERENCES public.employee(employee_id),
    title        TEXT NOT NULL,
    description  TEXT,
    type         TEXT NOT NULL CHECK (type IN ('Alert', 'Case Assignment', 'System', 'Broadcast')),
    is_read      BOOLEAN DEFAULT FALSE,
    is_synthetic BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Alerts Table
CREATE TABLE IF NOT EXISTS public.alerts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type         TEXT NOT NULL,
    severity     TEXT NOT NULL CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
    title        TEXT NOT NULL,
    description  TEXT,
    district     TEXT,
    location     TEXT,
    latitude     NUMERIC(10,6),
    longitude    NUMERIC(10,6),
    timestamp    TIMESTAMPTZ DEFAULT NOW(),
    is_read      BOOLEAN DEFAULT FALSE,
    is_synthetic BOOLEAN DEFAULT TRUE
);

-- Enable RLS for new tables
ALTER TABLE public.patrol_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patrol_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access (matching user's request "ACCEPT EVERYTHING AND ALLOW EVERYTHING")
DROP POLICY IF EXISTS "Allow public select on patrol_vehicles" ON public.patrol_vehicles;
CREATE POLICY "Allow public select on patrol_vehicles" ON public.patrol_vehicles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on patrol_vehicles" ON public.patrol_vehicles;
CREATE POLICY "Allow public insert on patrol_vehicles" ON public.patrol_vehicles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on patrol_vehicles" ON public.patrol_vehicles;
CREATE POLICY "Allow public update on patrol_vehicles" ON public.patrol_vehicles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public select on patrol_logs" ON public.patrol_logs;
CREATE POLICY "Allow public select on patrol_logs" ON public.patrol_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on patrol_logs" ON public.patrol_logs;
CREATE POLICY "Allow public insert on patrol_logs" ON public.patrol_logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on patrol_logs" ON public.patrol_logs;
CREATE POLICY "Allow public update on patrol_logs" ON public.patrol_logs FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public select on notifications" ON public.notifications;
CREATE POLICY "Allow public select on notifications" ON public.notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on notifications" ON public.notifications;
CREATE POLICY "Allow public insert on notifications" ON public.notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on notifications" ON public.notifications;
CREATE POLICY "Allow public update on notifications" ON public.notifications FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public select on alerts" ON public.alerts;
CREATE POLICY "Allow public select on alerts" ON public.alerts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on alerts" ON public.alerts;
CREATE POLICY "Allow public insert on alerts" ON public.alerts FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on alerts" ON public.alerts;
CREATE POLICY "Allow public update on alerts" ON public.alerts FOR UPDATE USING (true);
