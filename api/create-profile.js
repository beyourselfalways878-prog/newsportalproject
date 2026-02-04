import { create, update, getOne, COLLECTIONS } from './_appwrite.js';
import crypto from 'crypto';
import { Query } from 'node-appwrite';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const secret = req.headers['x-create-profile-secret'] || req.headers['x-admin-secret'];
    if (!secret || secret !== process.env.CREATE_PROFILE_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id, role, full_name, email, password } = req.body || {};
    if (!id || !role) return res.status(400).json({ error: 'Missing id or role' });

    const passwordHash = password ? hashPassword(password) : null;

    const userData = {
      email: email || `user-${id}@example.com`,
      full_name: full_name || '',
      role: role,
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
    };

    let result;
    try {
      // Try to get existing user
      result = await getOne(COLLECTIONS.USERS, id);
      // Update existing user
      result = await update(COLLECTIONS.USERS, id, userData);
    } catch (err) {
      // Create new user if doesn't exist
      result = await create(COLLECTIONS.USERS, userData, id);
    }

    return res.status(200).json({ ok: true, data: result });
  } catch (err) {
    console.error('create-profile error:', err);
    return res.status(500).json({ error: err?.message || 'Unknown error' });
  }
}
