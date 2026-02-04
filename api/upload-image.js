import { getOne, COLLECTIONS } from './_appwrite.js';
import jwt from 'jsonwebtoken';
import { Client, Storage } from 'node-appwrite';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function getStorage() {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  return new Storage(client);
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

    const { filename, content_type, data } = req.body || {};
    if (!filename || !content_type || !data) return res.status(400).json({ error: 'Missing filename, content_type or data' });

    // Upload to Appwrite Storage
    const storage = getStorage();
    const buffer = Buffer.from(data, 'base64');
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileId = `${Date.now()}-${safeName}`;

    const file = await storage.createFile(
      'images', // bucket ID
      fileId,
      new File([buffer], safeName, { type: content_type })
    );

    // Generate public URL
    const publicUrl = storage.getFileView('images', fileId);

    return res.status(200).json({
      fileId: file.$id,
      path: `/uploads/${fileId}`,
      publicUrl: publicUrl.toString(),
    });

  } catch (err) {
    console.error('upload-image error:', err);
    return res.status(500).json({ error: err?.message || 'Unknown error' });
  }
}
