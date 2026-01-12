import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import process from 'process';

const argv = Object.fromEntries(process.argv.slice(2).map(s => {
  const [k, v] = s.split('=');
  return [k.replace(/^--/, ''), v];
}));

const email = argv.email || argv.e;
const password = argv.password || argv.p;
const name = argv.name || argv.full_name || 'Admin User';
const role = (argv.role || 'superuser').toLowerCase();
const skipUpload = argv['skip-upload'] === '1' || argv['skip-upload'] === 'true';

if (!email || !password) {
  console.error('Usage: node scripts/create_admin_user.mjs --email=<email> --password=<password> [--name="Full Name"] [--role=superuser] [--skip-upload=1]');
  process.exit(2);
}

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !serviceKey) {
  console.error('Missing server-side Supabase credentials. Set SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_SERVICE_ROLE_KEY) and SUPABASE_URL / VITE_SUPABASE_URL in environment.');
  process.exit(2);
}

(async () => {
  try {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    console.log('Creating auth user:', email);
    let userId = null;

    try {
      const createRes = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name }
      });

      if (createRes.error) {
        // If user exists, we'll try to find it below; otherwise throw
        console.warn('createUser returned error:', createRes.error.message || createRes.error);
      } else {
        // Depending on SDK version createRes may be { data: { user } } or { user }
        const createUserData = createRes.data || createRes.user || createRes;
        userId = createUserData?.user?.id || createUserData?.id || createUserData?.user_id || null;
        console.log('User created with id:', userId);
      }
    } catch (err) {
      console.warn('createUser threw:', err?.message || err);
    }

    // If no userId yet, look up existing user by email
    if (!userId) {
      console.log('Looking up existing user by email...');
      const listRes = await admin.auth.admin.listUsers();
      const users = listRes?.data?.users || listRes?.users || [];
      const found = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
      if (found) {
        userId = found.id;
        console.log('Found existing user id:', userId);
        // Try updating password to the provided one
        try {
          console.log('Updating password for existing user...');
          const updateRes = await admin.auth.admin.updateUser(userId, { password });
          if (updateRes?.error) {
            console.warn('updateUser returned error:', updateRes.error);
          } else {
            console.log('Password updated for user');
          }
        } catch (err) {
          console.warn('updateUser threw:', err?.message || err);
        }
      } else {
        console.error('Could not find or create user for email:', email);
        process.exit(3);
      }
    }

    // Upsert profile row with role and full_name
    try {
      const { data, error } = await admin.from('profiles').upsert([{
        id: userId,
        full_name: name,
        role
      }]);
      if (error) {
        console.error('Error upserting profile:', error);
        process.exit(4);
      }
      console.log('Profile upserted for user id:', userId, 'role:', role);
    } catch (err) {
      console.error('Unexpected error upserting profile:', err?.message || err);
      process.exit(99);
    }

    if (!skipUpload && anonKey) {
      // Verify we can sign in and access storage by uploading a tiny image via client flow
      try {
        const client = createClient(url, anonKey, { auth: { persistSession: false } });
        console.log('Signing in as new user to verify credentials...');
        const { data: signData, error: signErr } = await client.auth.signInWithPassword({ email, password });
        if (signErr) {
          console.error('Sign-in error:', signErr);
          process.exit(5);
        }
        const session = signData.session;
        if (!session) {
          console.error('No session returned from sign-in');
          process.exit(6);
        }

        await client.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });

        // upload small PNG
        const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';
        const buffer = Buffer.from(base64, 'base64');
        const fileName = `admin-verify/${Date.now()}.png`;
        console.log('Uploading test file to storage as the new user...');
        const { data: uploadData, error: uploadError } = await client.storage.from('article-images').upload(fileName, buffer, { contentType: 'image/png' });
        if (uploadError) {
          console.error('Client upload error:', uploadError);
          process.exit(7);
        }
        console.log('Client upload succeeded, path:', uploadData.path);

        // Cleanup test file
        try {
          await admin.storage.from('article-images').remove([uploadData.path]);
          console.log('Cleanup: removed test file');
        } catch (err) {
          console.warn('Cleanup failed:', err?.message || err);
        }
      } catch (err) {
        console.error('Verification (sign-in/upload) failed:', err?.message || err);
        process.exit(8);
      }
    } else if (!anonKey) {
      console.warn('Skipping client sign-in/storage verification because anon key is not available in environment. You may run verification manually.');
    } else {
      console.log('--skip-upload passed; skipping verification upload.');
    }

    console.log('Done. Created/updated user:', { email, userId });
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err?.message || err);
    process.exit(99);
  }
})();
