import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const id = process.argv[2] || '13a030d7-0850-444c-a940-b1bcab127b1e';
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing service role key or URL in environment');
  process.exit(2);
}

(async () => {
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const { data, error } = await admin.from('profiles').select('*').eq('id', id).maybeSingle();
    if (error) {
      console.error('Error fetching profile:', error);
      process.exit(3);
    }
    console.log('Profile row:', data);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(99);
  }
})();