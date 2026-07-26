import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!url || !serviceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables or backend/.env');
}

const supabase = createClient(url, serviceKey);

async function main() {
  console.log('Testing deleting top user-uploaded row...');
  const { data, error } = await supabase.from('evidence').select('id, file_name').order('uploaded_at', { ascending: false }).limit(3);
  console.log('Recent rows:', data, error);
}

main();
