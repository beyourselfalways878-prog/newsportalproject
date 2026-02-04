import { getAll, create, COLLECTIONS, createQuery } from './_appwrite.js';
import { Query } from 'node-appwrite';

export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const { email, language } = req.body;

        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Invalid email' });
        }

        // Check if subscriber already exists
        const existing = await getAll(COLLECTIONS.SUBSCRIBERS, [
            Query.equal('email', email),
        ]);

        if (existing.length > 0) {
            return res.status(200).json({ success: true, message: 'Already subscribed' });
        }

        // Create new subscriber
        await create(COLLECTIONS.SUBSCRIBERS, {
            email,
            language: language || 'hi',
            created_at: new Date().toISOString(),
        });

        return res.status(200).json({ success: true, message: 'Subscribed successfully' });
    } catch (err) {
        console.error('subscribe error:', err);
        return res.status(500).json({ error: err?.message || 'Unknown error' });
    }
}
