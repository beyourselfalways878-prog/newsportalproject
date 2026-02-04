import express from 'express';
import authRoutes from './auth.routes.js';
import articleRoutes from './article.routes.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { db } from '../firebase.js';
import { collection, getDocs, orderBy, query, limit as firestoreLimit } from 'firebase/firestore';

const router = express.Router();

// Auth routes
router.use('/auth', authRoutes);

// Article routes
router.use('/', articleRoutes);

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
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

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
            xml += `
  <url>
    <loc>${SITE_URL}/article/${a.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
        });

        xml += '\n</urlset>';
        res.header('Content-Type', 'application/xml');
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
