import { getOne } from '../_db.js';

export default async function handler(req, res) {
    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ error: 'Missing article ID' });
        }

        const article = await getOne(
            'SELECT * FROM articles WHERE id = $1',
            [id]
        );

        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        return res.status(200).json(article);
    } catch (err) {
        console.error('article error:', err);
        return res.status(500).json({ error: err?.message || 'Unknown error' });
    }
}
