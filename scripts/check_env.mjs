import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const required = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

let missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error('Missing required environment variables:', missing.join(', '));
  console.error('Set them in your .env file or in your environment before starting the app.');
  process.exitCode = 2;
} else {
  console.log('Found required env vars:', required.join(', '));
}

// Optional checks with service role key (accept both SUPABASE_SERVICE_ROLE_KEY and VITE_SUPABASE_SERVICE_ROLE_KEY)
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
if (!serviceKey) {
  console.warn('Service role key not provided (SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_SERVICE_ROLE_KEY); some deeper checks will be skipped.');
  console.warn('Set SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_SERVICE_ROLE_KEY to run bucket/table checks.');
  process.exit(process.exitCode || 0);
}

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
if (!url) {
  console.error('No Supabase URL found (VITE_SUPABASE_URL or SUPABASE_URL).');
  process.exitCode = 2;
}

(async () => {
  try {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    console.log('Checking `articles` table access...');
    const { data: articles, error: articlesErr } = await admin.from('articles').select('id').limit(1);
    if (articlesErr) {
      console.error('Error accessing `articles` table:', articlesErr.message || articlesErr);
      process.exitCode = 3;
    } else {
      console.log('OK: access to `articles` table');
    }

    console.log('Checking storage bucket `article-images`...');
    const { data: listData, error: listErr } = await admin.storage.from('article-images').list();
    if (listErr) {
      console.error('Error listing `article-images` bucket:', listErr.message || listErr);
      process.exitCode = 4;
    } else {
      console.log('OK: `article-images` bucket exists and is accessible. (Found', listData?.length || 0, 'items)');
    }

    if (process.exitCode) process.exit(process.exitCode);
    console.log('Environment check completed successfully.');
  } catch (err) {
    console.error('Unexpected error during checks:', err?.message || err);
    process.exitCode = 99;
  }
})();