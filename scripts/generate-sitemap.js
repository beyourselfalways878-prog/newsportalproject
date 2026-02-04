/**
 * Sitemap Generator for 24x7 Indian News
 * Generates sitemap.xml and news-sitemap.xml
 * 
 * Run: node scripts/generate-sitemap.js
 */

import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, orderBy, query, limit } from 'firebase/firestore';

const SITE_URL = 'https://24x7indiannews.online';

const firebaseConfig = {
    apiKey: "AIzaSyAKBQN9HiniJ7uMWrrf9tIenEwMHB-gEmc",
    authDomain: "news-indian-24x7.firebaseapp.com",
    projectId: "news-indian-24x7",
    storageBucket: "news-indian-24x7.firebasestorage.app",
    messagingSenderId: "647285212122",
    appId: "1:647285212122:web:50273ef2e4f804208876e3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Static pages
const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'hourly' },
    { url: '/category/politics', priority: '0.8', changefreq: 'daily' },
    { url: '/category/business', priority: '0.8', changefreq: 'daily' },
    { url: '/category/sports', priority: '0.8', changefreq: 'daily' },
    { url: '/category/entertainment', priority: '0.8', changefreq: 'daily' },
    { url: '/category/technology', priority: '0.8', changefreq: 'daily' },
    { url: '/category/health', priority: '0.8', changefreq: 'daily' },
    { url: '/privacy-policy', priority: '0.3', changefreq: 'monthly' },
    { url: '/terms-of-service', priority: '0.3', changefreq: 'monthly' },
    { url: '/about', priority: '0.5', changefreq: 'monthly' },
    { url: '/contact', priority: '0.5', changefreq: 'monthly' },
];

async function generateSitemaps() {
    console.log('🗺️  Generating sitemaps...\n');

    try {
        // Fetch articles from Firebase
        console.log('📦 Fetching articles...');
        const articlesRef = collection(db, 'articles');
        const q = query(articlesRef, orderBy('updated_at', 'desc'), limit(1000));
        const snapshot = await getDocs(q);

        const articles = [];
        snapshot.forEach(doc => {
            articles.push({ id: doc.id, ...doc.data() });
        });
        console.log(`   Found ${articles.length} articles\n`);

        // Generate main sitemap.xml
        console.log('📝 Generating sitemap.xml...');
        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
        // Add static pages
        for (const page of staticPages) {
            sitemap += `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
        }

        // Add articles
        for (const article of articles) {
            const lastmod = article.updated_at ? new Date(article.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            sitemap += `  <url>
    <loc>${SITE_URL}/article/${article.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
        }

        sitemap += '</urlset>';
        fs.writeFileSync(path.join(process.cwd(), 'public', 'sitemap.xml'), sitemap);
        console.log('   ✓ sitemap.xml created\n');

        // Generate news-sitemap.xml (for Google News - last 2 days)
        console.log('📰 Generating news-sitemap.xml...');
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const recentArticles = articles.filter(a => {
            const pubDate = new Date(a.published_at || a.updated_at);
            return pubDate >= twoDaysAgo;
        });

        let newsSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
`;
        for (const article of recentArticles) {
            const pubDate = article.published_at || article.updated_at || new Date().toISOString();
            const title = (article.title_hi || 'Untitled').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

            newsSitemap += `  <url>
    <loc>${SITE_URL}/article/${article.id}</loc>
    <news:news>
      <news:publication>
        <news:name>24x7 Indian News</news:name>
        <news:language>hi</news:language>
      </news:publication>
      <news:publication_date>${new Date(pubDate).toISOString()}</news:publication_date>
      <news:title>${title}</news:title>
    </news:news>
  </url>
`;
        }
        newsSitemap += '</urlset>';
        fs.writeFileSync(path.join(process.cwd(), 'public', 'news-sitemap.xml'), newsSitemap);
        console.log(`   ✓ news-sitemap.xml created (${recentArticles.length} recent articles)\n`);

        console.log('✅ Sitemaps generated successfully!');
        console.log(`   📍 ${SITE_URL}/sitemap.xml`);
        console.log(`   📰 ${SITE_URL}/news-sitemap.xml`);

    } catch (error) {
        console.error('Error generating sitemaps:', error.message);
    }

    process.exit(0);
}

generateSitemaps();
