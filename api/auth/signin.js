import { getAll, COLLECTIONS } from '../_appwrite.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Query } from 'node-appwrite';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ error: 'Missing email or password' });
        }

        // Get user from Appwrite
        const users = await getAll(COLLECTIONS.USERS, [
            Query.equal('email', email),
        ]);

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // Verify password
        const hashedPassword = hashPassword(password);
        if (user.password_hash !== hashedPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.$id, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            user: {
                id: user.$id,
                email: user.email,
                role: user.role,
                full_name: user.full_name,
            },
            token,
        });
    } catch (err) {
        console.error('signin error:', err);
        return res.status(500).json({ error: err?.message || 'Unknown error' });
    }
}
