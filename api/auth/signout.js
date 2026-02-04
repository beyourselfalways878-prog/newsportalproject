export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        // Sign out is handled client-side by removing token
        // This endpoint can be used for server-side cleanup if needed
        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('signout error:', err);
        return res.status(500).json({ error: err?.message || 'Unknown error' });
    }
}
