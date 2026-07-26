-- ============================================================
-- KSP Platform — Permissive RLS Policies
-- Run this in Supabase SQL Editor to allow frontend reads.
-- In production, replace with proper role-based policies.
-- ============================================================

-- Allow public reads on all lookup/reference tables
CREATE POLICY "Allow public read on state" ON public.state FOR SELECT USING (true);
CREATE POLICY "Allow public read on district" ON public.district FOR SELECT USING (true);
CREATE POLICY "Allow public read on unit_type" ON public.unit_type FOR SELECT USING (true);
CREATE POLICY "Allow public read on unit" ON public.unit FOR SELECT USING (true);
CREATE POLICY "Allow public read on rank" ON public.rank FOR SELECT USING (true);
CREATE POLICY "Allow public read on designation" ON public.designation FOR SELECT USING (true);
CREATE POLICY "Allow public read on case_category" ON public.case_category FOR SELECT USING (true);
CREATE POLICY "Allow public read on gravity_offence" ON public.gravity_offence FOR SELECT USING (true);
CREATE POLICY "Allow public read on crime_head" ON public.crime_head FOR SELECT USING (true);
CREATE POLICY "Allow public read on crime_sub_head" ON public.crime_sub_head FOR SELECT USING (true);
CREATE POLICY "Allow public read on court" ON public.court FOR SELECT USING (true);
CREATE POLICY "Allow public read on case_status_master" ON public.case_status_master FOR SELECT USING (true);
CREATE POLICY "Allow public read on act" ON public.act FOR SELECT USING (true);
CREATE POLICY "Allow public read on section" ON public.section FOR SELECT USING (true);
CREATE POLICY "Allow public read on caste_master" ON public.caste_master FOR SELECT USING (true);
CREATE POLICY "Allow public read on religion_master" ON public.religion_master FOR SELECT USING (true);
CREATE POLICY "Allow public read on occupation_master" ON public.occupation_master FOR SELECT USING (true);

-- Enable RLS on reference tables first (required before policies take effect)
ALTER TABLE public.state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.district ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gravity_offence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crime_head ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crime_sub_head ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_status_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.act ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caste_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.religion_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupation_master ENABLE ROW LEVEL SECURITY;

-- Allow public reads on operational tables
ALTER TABLE public.employee ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complainant_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.victim ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accused ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arrest_surrender ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chargesheet_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on employee" ON public.employee FOR SELECT USING (true);
CREATE POLICY "Allow public read on case_master" ON public.case_master FOR SELECT USING (true);
CREATE POLICY "Allow public read on complainant_details" ON public.complainant_details FOR SELECT USING (true);
CREATE POLICY "Allow public read on victim" ON public.victim FOR SELECT USING (true);
CREATE POLICY "Allow public read on accused" ON public.accused FOR SELECT USING (true);
CREATE POLICY "Allow public read on arrest_surrender" ON public.arrest_surrender FOR SELECT USING (true);
CREATE POLICY "Allow public read on chargesheet_details" ON public.chargesheet_details FOR SELECT USING (true);

-- Allow public reads + writes on app tables
CREATE POLICY "Allow public read on chat_messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert on chat_messages" ON public.chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read on assignments" ON public.assignments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on assignments" ON public.assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on assignments" ON public.assignments FOR UPDATE USING (true);
CREATE POLICY "Allow public read on audit_logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read on evidence" ON public.evidence FOR SELECT USING (true);
CREATE POLICY "Allow public insert on evidence" ON public.evidence FOR INSERT WITH CHECK (true);
