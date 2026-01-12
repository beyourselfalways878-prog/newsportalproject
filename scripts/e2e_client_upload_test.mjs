import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !serviceKey || !anonKey) {
  console.error('Missing required env vars (URL, service key, anon key)');
  process.exit(2);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const client = createClient(url, anonKey, { auth: { persistSession: false } });

(async () => {
  const timestamp = Date.now();
  const testEmail = `e2e-test-${timestamp}@example.com`;
  const password = `TestPass!${Math.floor(Math.random()*9000)+1000}`;
  console.log('Creating temporary auth user:', testEmail);

  try {
    const createRes = await admin.auth.admin.createUser({
      email: testEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'E2E Tester' }
    });
    // createRes can be { data: { user }, error } or { user, error } depending on SDK version
    console.log('createUser response:', createRes);
    const createError = createRes.error;
    const createUserData = createRes.data || createRes.user || createRes;

    if (createError) {
      console.error('Error creating auth user:', createError);
      process.exit(3);
    }

    const userId = createUserData?.user?.id || createUserData?.id || createUserData?.user_id || null;
    console.log('Created user id:', userId);
    if (!userId) {
      console.error('Could not determine created user id from response');
      process.exit(4);
    }
    // Ensure profile exists and is admin
    const { data: upsertProfileData, error: upsertErr } = await admin.from('profiles').upsert([{ id: userId, full_name: 'E2E Tester', role: 'admin' }]);
    if (upsertErr) {
      console.error('Error upserting profile:', upsertErr);
      process.exit(4);
    }

    console.log('Profile upserted for user:', userId);

    // Sign in via anon client
    console.log('Signing in via anon client');
    const { data: signData, error: signErr } = await client.auth.signInWithPassword({ email: testEmail, password });
    if (signErr) {
      console.error('Sign-in error:', signErr);
      process.exit(5);
    }

    const session = signData.session;
    if (!session) {
      console.error('No session returned from sign-in');
      process.exit(6);
    }

    console.log('Signed in, user id:', session.user.id);

    // Use the client's auth with session access token
    // Set client auth session so the anon client behaves like the signed-in user
    await client.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });

    // Upload a tiny PNG file via client (client-side flow)
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(base64, 'base64');
    const fileName = `e2e/tests/test-image-${timestamp}.png`;

    console.log('Uploading image via client...');
    const { data: uploadData, error: uploadError } = await client.storage.from('article-images').upload(fileName, buffer, { contentType: 'image/png' });
    if (uploadError) {
      console.error('Client upload error:', uploadError);
      throw uploadError;
    }
    console.log('Client upload path:', uploadData.path);

    const { data: urlData } = client.storage.from('article-images').getPublicUrl(uploadData.path);
    const publicUrl = urlData.publicUrl;

    // Insert article as client
    console.log('Inserting article via client...');
    const now = new Date().toISOString();
    const { data: insertData, error: insertErr } = await client.from('articles').insert([{ 
      title_hi: `E2E Client Test ${timestamp}`,
      excerpt_hi: 'Client-side E2E test',
      content_hi: `<p>Client-side test article <img src="${publicUrl}" /></p>`,
      category: 'indian',
      author: 'E2E Client',
      location: 'Test',
      image_url: publicUrl,
      image_alt_text_hi: 'E2E image',
      seo_title_hi: 'E2E',
      seo_keywords_hi: 'e2e,client',
      published_at: now,
      updated_at: now
    }]).select().single();

    if (insertErr) {
      console.error('Client insert error:', insertErr);
      throw insertErr;
    }

    console.log('Client insert succeeded. Article id:', insertData.id);

    // Clean up
    console.log('Cleaning up: deleting article, image, and user...');
    await admin.from('articles').delete().eq('id', insertData.id);
    await admin.storage.from('article-images').remove([uploadData.path]);
    await admin.auth.admin.deleteUser(userId);
    await admin.from('profiles').delete().eq('id', userId);

    console.log('E2E client upload test completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('E2E client upload test failed:', err);
    process.exit(99);
  }
})();