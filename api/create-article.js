import { getOne, create, update, COLLECTIONS } from './_appwrite.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }
    const token = authHeader.split(' ')[1];

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const userId = decoded.userId;

    // Check user role
    const user = await getOne(COLLECTIONS.USERS, userId);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const role = (user.role || '').toLowerCase();
    if (!(role === 'admin' || role === 'superuser')) {
      return res.status(403).json({ error: 'Insufficient privileges' });
    }

    const payload = req.body || {};
    // Basic validation
    if (!payload.title_hi || !payload.content_hi) return res.status(400).json({ error: 'Missing required fields' });

    const now = new Date().toISOString();
    let result;

    const articleData = {
      title_hi: payload.title_hi,
      excerpt_hi: payload.excerpt_hi || '',
      content_hi: payload.content_hi,
      category: payload.category || 'indian',
      author: payload.author || 'Edited by Twinkle Tiwari',
      location: payload.location || '',
      is_breaking: payload.is_breaking || false,
      is_featured: payload.is_featured || false,
      image_alt_text_hi: payload.image_alt_text_hi || '',
      seo_title_hi: payload.seo_title_hi || '',
      seo_keywords_hi: payload.seo_keywords_hi || '',
      video_url: payload.video_url || '',
      image_url: payload.image_url || '',
      views: payload.views || 0,
      updated_at: now,
    };

    if (payload.id) {
      // Update existing article
      result = await update(COLLECTIONS.ARTICLES, payload.id, articleData);
    } else {
      // Insert new article
      articleData.published_at = now;
      result = await create(COLLECTIONS.ARTICLES, articleData);
    }

    return res.status(200).json({ ok: true, data: result });

  } catch (err) {
    console.error('create-article error:', err);
    return res.status(500).json({ error: err?.message || 'Unknown error' });
  }
}
