import { getAll, COLLECTIONS, DB_ID, createQuery } from './_appwrite.js';
import { Query } from 'node-appwrite';

export default async function handler(req, res) {
    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const { category, limit = 20, offset = 0, featured } = req.query;

        let queries = [];

        // Add featured filter if requested
        if (featured === 'true') {
            queries.push(Query.equal('is_featured', true));
        }

        // Add category filter if provided
        if (category) {
            queries.push(Query.equal('category', category));
        }

        // Add sorting and pagination
        queries.push(Query.orderDesc('published_at'));
        queries.push(Query.limit(parseInt(limit)));
        queries.push(Query.offset(parseInt(offset)));

        const articles = await getAll(COLLECTIONS.ARTICLES, queries);
        return res.status(200).json(articles);
    } catch (err) {
        console.error('articles error:', err);
        return res.status(500).json({ error: err?.message || 'Unknown error' });
    }
}
