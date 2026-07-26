-- ============================================================
-- KSP Smart Police Intelligence Platform — Phase 2 Feature Tables
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. chat_messages — for AI Investigation Assistant
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id  UUID NOT NULL,
    user_id          TEXT,
    role             TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content          TEXT NOT NULL,
    metadata         JSONB DEFAULT '{}',
    created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS chat_messages_conversation_id_idx ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON public.chat_messages(created_at);

-- 2. conversations — track conversation sessions
CREATE TABLE IF NOT EXISTS public.conversations (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    TEXT,
    title      TEXT NOT NULL DEFAULT 'New Investigation',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. assignments — for Assign Work Module
CREATE TABLE IF NOT EXISTS public.assignments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_id  INTEGER REFERENCES public.employee(employee_id),
    type        TEXT NOT NULL CHECK (type IN ('Case', 'Evidence Review', 'Patrol Duty', 'Investigation')),
    ref_id      TEXT,
    title       TEXT NOT NULL,
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'Assigned' CHECK (status IN ('Assigned', 'Pending', 'In Progress', 'Completed', 'Rejected')),
    progress    INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    due_date    DATE,
    created_by  TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS assignments_officer_id_idx ON public.assignments(officer_id);
CREATE INDEX IF NOT EXISTS assignments_status_idx ON public.assignments(status);

-- 4. patrol_positions — for live patrol telemetry (simulated)
CREATE TABLE IF NOT EXISTS public.patrol_positions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id  UUID REFERENCES public.patrol_vehicles(id) ON DELETE CASCADE,
    latitude    NUMERIC(10,6) NOT NULL,
    longitude   NUMERIC(10,6) NOT NULL,
    heading     NUMERIC(5,2) DEFAULT 0,
    speed       NUMERIC(5,2) DEFAULT 0,
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    is_synthetic BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS patrol_positions_vehicle_id_idx ON public.patrol_positions(vehicle_id);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patrol_positions ENABLE ROW LEVEL SECURITY;

-- Allow public access (demo environment)
DROP POLICY IF EXISTS "Allow all on chat_messages" ON public.chat_messages;
CREATE POLICY "Allow all on chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on conversations" ON public.conversations;
CREATE POLICY "Allow all on conversations" ON public.conversations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on assignments" ON public.assignments;
CREATE POLICY "Allow all on assignments" ON public.assignments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on patrol_positions" ON public.patrol_positions;
CREATE POLICY "Allow all on patrol_positions" ON public.patrol_positions FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.patrol_positions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.patrol_vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee;

-- Seed patrol vehicles if not already present
INSERT INTO public.patrol_vehicles (registration_number, vehicle_type, make, model, color, status, latitude, longitude, heading, speed, is_synthetic)
SELECT * FROM (VALUES
  ('KA01P0001', 'Car',        'Tata',    'Safari',    'White',  'Active',      12.9716, 77.5946, 45,  30, true),
  ('KA01P0002', 'SUV',        'Mahindra','Scorpio',   'Grey',   'Active',      12.9352, 77.6245, 120, 20, true),
  ('KA01P0003', 'Car',        'Maruti',  'Gypsy',     'White',  'Active',      12.9516, 77.5700, 200, 15, true),
  ('KA01P0004', 'Motorcycle', 'Royal E', 'Bullet',    'Black',  'Active',      12.9800, 77.6100, 270, 40, true),
  ('KA01P0005', 'Car',        'Tata',    'Nexon',     'Blue',   'Active',      12.9615, 77.6412, 90,  25, true),
  ('KA01P0006', 'Motorcycle', 'Honda',   'Unicorn',   'Red',    'Maintenance', 12.9400, 77.5800, 0,   0,  true),
  ('KA01P0007', 'SUV',        'Toyota',  'Innova',    'White',  'Active',      12.9252, 77.5546, 315, 35, true),
  ('KA01P0008', 'Car',        'Hyundai', 'i20',       'Silver', 'Active',      12.9900, 77.5800, 180, 20, true)
) AS v(registration_number, vehicle_type, make, model, color, status, latitude, longitude, heading, speed, is_synthetic)
WHERE NOT EXISTS (SELECT 1 FROM public.patrol_vehicles WHERE registration_number = v.registration_number);
