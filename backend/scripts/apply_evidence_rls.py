import os
from supabase import create_client

url = os.environ.get('SUPABASE_URL', '')
service_key = os.environ.get('SUPABASE_SERVICE_KEY', '')

if not url or not service_key:
    raise EnvironmentError('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in your environment or backend/.env')

supabase = create_client(url, service_key)

print("Applying RLS policies to public.evidence table...")
sql = """
DROP POLICY IF EXISTS "Allow public update on evidence" ON public.evidence;
DROP POLICY IF EXISTS "Allow public delete on evidence" ON public.evidence;

CREATE POLICY "Allow public update on evidence" ON public.evidence FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on evidence" ON public.evidence FOR DELETE USING (true);
"""

try:
    res = supabase.rpc("exec_sql", {"query": sql}).execute()
    print("RPC Success:", res.data)
except Exception as e:
    print("RPC Exception:", e)

# Test service_role client delete
print("Testing direct delete via service role client...")
# Check if any user-uploaded or sample item exists
rows = supabase.table("evidence").select("id, file_name").order("uploaded_at", desc=True).limit(5).execute()
print("Top 5 evidence rows:", rows.data)
