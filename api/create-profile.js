import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const secret = req.headers['x-create-profile-secret'] || req.headers['x-admin-secret'];
    if (!secret || secret !== process.env.CREATE_PROFILE_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id, role, full_name } = req.body || {};
    if (!id || !role) return res.status(400).json({ error: 'Missing id or role' });

    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return res.status(500).json({ error: 'Missing server-side Supabase credentials (service role key not set)' });

    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data, error } = await admin.from('profiles').upsert([{ id, role, full_name }]);
    if (error) return res.status(500).json({ error: error.message || error });

    return res.status(200).json({ ok: true, data });
  } catch (err) {
    console.error('create-profile error:', err);
    return res.status(500).json({ error: err?.message || 'Unknown error' });
  }
}