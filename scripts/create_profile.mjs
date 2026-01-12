import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import process from 'process';

const argv = Object.fromEntries(process.argv.slice(2).map(s => {
  const [k, v] = s.split('=');
  return [k.replace(/^--/, ''), v];
}));

const id = argv.id || argv.user;
const role = argv.role || 'admin';
const name = argv.name || argv.full_name || 'Admin User';

if (!id) {
  console.error('Usage: node scripts/create_profile.mjs --id=<user-uuid> [--role=admin] [--name="Full Name"]');
  process.exit(2);
}

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing service role key (SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_SERVICE_ROLE_KEY) or SUPABASE_URL/VITE_SUPABASE_URL in environment');
  process.exit(2);
}

(async () => {
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const { data, error } = await admin.from('profiles').upsert([{ id, full_name: name, role }]);
    if (error) {
      console.error('Error creating profile:', error);
      process.exit(3);
    }
    console.log('Profile upserted:', data);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(99);
  }
})();