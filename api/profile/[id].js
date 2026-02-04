import { getOne } from '../../api/_db.js';
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
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ error: 'Missing user ID' });
        }

        // Verify token
        const authHeader = req.headers.authorization || req.headers.Authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing Authorization header' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Get profile
        const profile = await getOne(
            'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1',
            [id]
        );

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        return res.status(200).json(profile);
    } catch (err) {
        console.error('profile error:', err);
        return res.status(500).json({ error: err?.message || 'Unknown error' });
    }
}
