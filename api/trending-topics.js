import { getAll, COLLECTIONS, createQuery } from './_appwrite.js';
import { Query } from 'node-appwrite';

export default async function handler(req, res) {
    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const queries = [
            Query.orderDesc('created_at'),
            Query.limit(10),
        ];

        const topics = await getAll(COLLECTIONS.TRENDING_TOPICS, queries);
        return res.status(200).json(topics);
    } catch (err) {
        console.error('trending-topics error:', err);
        return res.status(500).json({ error: err?.message || 'Unknown error' });
    }
}
