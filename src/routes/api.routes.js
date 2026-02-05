import express from 'express';
import authRoutes from './auth.routes.js';
import articleRoutes from './article.routes.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { db } from '../firebase.js';
import { collection, getDocs, orderBy, query, limit as firestoreLimit } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch'; // Should be globally available in Node 18+ but good to safeguard

const router = express.Router();

// Auth routes
router.use('/auth', authRoutes);

// Article routes
router.use('/', articleRoutes);

// Search endpoint
router.get('/search', async (req, res) => {
    try {
        const searchQuery = (req.query.q || '').toLowerCase().trim();
        if (!searchQuery) {
            return res.json({ success: true, data: [] });
        }

        const articlesRef = collection(db, 'articles');
        const q = query(articlesRef, orderBy('published_at', 'desc'), firestoreLimit(50));
        const snapshot = await getDocs(q);

        const results = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const titleHi = (data.title_hi || '').toLowerCase();
            const title = (data.title || '').toLowerCase();
            const excerptHi = (data.excerpt_hi || '').toLowerCase();
            const excerpt = (data.excerpt || '').toLowerCase();

            if (titleHi.includes(searchQuery) || title.includes(searchQuery) ||
                excerptHi.includes(searchQuery) || excerpt.includes(searchQuery)) {
                results.push({ id: doc.id, ...data });
            }
        });

        res.json({ success: true, data: results.slice(0, 10) });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, error: 'Search failed' });
    }
});

// Sitemap Index for large article counts
router.get('/sitemap-index.xml', async (req, res) => {
    try {
        const SITE_URL = 'https://24x7indiannews.online';
        const articlesRef = collection(db, 'articles');
        const snapshot = await getDocs(articlesRef);
        const totalArticles = snapshot.size;
        const URLS_PER_SITEMAP = 1000;
        const numSitemaps = Math.ceil(totalArticles / URLS_PER_SITEMAP);

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/api/sitemap.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`;

        // Add additional sitemaps if needed
        for (let i = 1; i < numSitemaps; i++) {
            xml += `
  <sitemap>
    <loc>${SITE_URL}/api/sitemap-${i + 1}.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`;
        }

        xml += '\n</sitemapindex>';
        res.header('Content-Type', 'application/xml');
        res.header('Cache-Control', 'public, max-age=3600');
        res.send(xml);
    } catch (error) {
        console.error('Sitemap index error:', error);
        res.status(500).send('Error generating sitemap index');
    }
});

// Sitemap.xml handler
router.get('/sitemap.xml', async (req, res) => {
    try {
        const SITE_URL = 'https://24x7indiannews.online';
        const articlesRef = collection(db, 'articles');
        const q = query(articlesRef, orderBy('updated_at', 'desc'), firestoreLimit(1000));
        const snapshot = await getDocs(q);

        const articles = [];
        snapshot.forEach(doc => {
            articles.push({ id: doc.id, ...doc.data() });
        });

        const categoryKeys = ['politics', 'business', 'sports', 'entertainment', 'technology', 'health'];
        const staticPages = [
            { url: '/', priority: '1.0' },
            ...categoryKeys.map(key => ({ url: `/category/${key}`, priority: '0.8' }))
        ];

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">`;

        staticPages.forEach(p => {
            xml += `
  <url>
    <loc>${SITE_URL}${p.url}</loc>
    <changefreq>daily</changefreq>
    <priority>${p.priority}</priority>
  </url>`;
        });

        articles.forEach(a => {
            const lastmod = a.updated_at ? new Date(a.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            const pubDate = a.published_at ? new Date(a.published_at).toISOString() : new Date().toISOString();
            xml += `
  <url>
    <loc>${SITE_URL}/article/${a.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <news:news>
      <news:publication>
        <news:name>24x7 Indian News</news:name>
        <news:language>hi</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${(a.title_hi || a.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</news:title>
    </news:news>
  </url>`;
        });

        xml += '\n</urlset>';
        res.header('Content-Type', 'application/xml');
        res.header('Cache-Control', 'public, max-age=3600');
        res.send(xml);
    } catch (error) {
        console.error('Sitemap error:', error);
        res.status(500).send('Error generating sitemap');
    }
});

// RSS.xml handler
router.get('/rss.xml', async (req, res) => {
    try {
        const SITE_URL = 'https://24x7indiannews.online';
        const articlesRef = collection(db, 'articles');
        const q = query(articlesRef, orderBy('published_at', 'desc'), firestoreLimit(50));
        const snapshot = await getDocs(q);

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>24x7 इंडियन न्यूज़</title>
    <link>${SITE_URL}</link>
    <description>भारत और दुनिया की ताज़ा ख़बरें हिंदी में।</description>
    <language>hi-IN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`;

        snapshot.forEach(doc => {
            const a = doc.data();
            const pubDate = a.published_at ? new Date(a.published_at).toUTCString() : new Date().toUTCString();
            xml += `
    <item>
      <title><![CDATA[${a.title_hi || 'No Title'}]]></title>
      <link>${SITE_URL}/article/${doc.id}</link>
      <guid>${SITE_URL}/article/${doc.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${a.excerpt_hi || ''}]]></description>
      <category>${a.category || 'General'}</category>
    </item>`;
        });

        xml += '\n  </channel>\n</rss>';
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (error) {
        console.error('RSS error:', error);
        res.status(500).send('Error generating RSS');
    }
});

// Live Cricket Scores (CricketData.org)
router.get('/live-scores', async (req, res) => {
    try {
        const apiKey = process.env.CRICKETDATA_API_KEY;
        if (!apiKey) throw new Error('API Key missing');

        // Fetch current matches
        const response = await fetch(`https://api.cricapi.com/v1/currentMatches?apikey=${apiKey}&offset=0`);
        const data = await response.json();

        if (data.status !== 'success') throw new Error(data.reason || 'API Error');

        // Transform data for widget
        const matches = (data.data || []).slice(0, 5).map(m => {
            // Basic transformation to match widget expectations
            return {
                id: m.id,
                matchType: m.matchType,
                date: m.date,
                status: m.status,
                venue: m.venue,
                team1: {
                    name: m.teamInfo?.[0]?.name || m.teams?.[0],
                    short: m.teamInfo?.[0]?.shortname,
                    logo: m.teamInfo?.[0]?.img,
                    score: m.score?.find(s => s.inning.includes(m.teamInfo?.[0]?.name))?.r || ''
                },
                team2: {
                    name: m.teamInfo?.[1]?.name || m.teams?.[1],
                    short: m.teamInfo?.[1]?.shortname,
                    logo: m.teamInfo?.[1]?.img,
                    score: m.score?.find(s => s.inning.includes(m.teamInfo?.[1]?.name))?.r || ''
                },
                rawHtml: '' // No longer needed
            };
        });

        res.json({ matches });
    } catch (error) {
        console.error('Cricket API error:', error);
        // Fallback or error
        res.status(500).json({ error: 'Failed to fetch score', matches: [] });
    }
});

// Gemini AI Commentary
router.post('/ai-commentary', async (req, res) => {
    try {
        const { matchData } = req.body;
        const genAI = new GoogleGenerativeAI(process.env.OPENAI_API_KEY); // Using existing env var for Gemini key per user agreement
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are a lively cricket commentator. Generate a short, exciting 1-sentence commentary update (in Hindi and English mixed) for this match status: 
        ${JSON.stringify(matchData)}
        Keep it under 20 words. Example: "Virat is looking dangerous today! क्या शानदार शॉट है!"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ text });
    } catch (error) {
        console.error('Gemini error:', error);
        res.status(500).json({ text: 'Commentary unavailable temporarily.' });
    }
});


// Protected API routes
router.get('/protected', authenticate, (req, res) => {
    res.json({
        success: true,
        message: 'This is a protected route',
        user: req.user
    });
});

// Admin-only route
router.get('/admin', authenticate, authorize('admin'), (req, res) => {
    res.json({
        success: true,
        message: 'Welcome admin!',
        user: req.user
    });
});

export default router;
