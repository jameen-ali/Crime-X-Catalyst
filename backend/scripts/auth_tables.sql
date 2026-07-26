-- Run this in the Supabase SQL Editor to create the profiles table

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    email TEXT,
    role TEXT CHECK (role IN ('Admin', 'ACP', 'Inspector', 'SI', 'Officer', 'Analyst')),
    employee_id INTEGER REFERENCES public.employee(employee_id),
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on profiles" ON public.profiles;
CREATE POLICY "Allow public read on profiles" ON public.profiles FOR SELECT USING (true);
