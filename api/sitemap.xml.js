import { escapeXml, getSiteUrl, getSupabaseAdminReadClient } from './_supabase.js';

export default async function handler(req, res) {
  try {
    const siteUrl = getSiteUrl(req);
    const supabase = getSupabaseAdminReadClient();

    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, published_at, updated_at')
      .order('published_at', { ascending: false })
      .limit(2000);

    if (error) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.end(`<?xml version="1.0" encoding="UTF-8"?><error>${escapeXml(error.message)}</error>`);
      return;
    }

    const categoryKeys = [
      'indian',
      'global',
      'regional',
      'politics',
      'economy',
      'sports',
      'entertainment',
      'technology',
      'science',
      'health',
      'travel',
      'opinion',
      'video',
      'auto',
      'recipes',
      'beauty',
      'lifestyle',
      'jobs-education',
      'personal-finance',
      'astrology-spiritual',
      'agriculture',
      'crime-law',
      'weather',
      'fact-check',
    ];

    const staticUrls = [
      { loc: `${siteUrl}/`, changefreq: 'hourly', priority: '1.0' },
      ...categoryKeys.map((key) => ({
        loc: `${siteUrl}/category/${key}`,
        changefreq: 'hourly',
        priority: '0.8',
      })),
    ];

    const articleUrls = (articles || []).map((a) => {
      const lastmodRaw = a.updated_at || a.published_at;
      const lastmod = lastmodRaw ? new Date(lastmodRaw).toISOString() : undefined;
      return {
        loc: `${siteUrl}/article/${a.id}`,
        lastmod,
        changefreq: 'weekly',
        priority: '0.7',
      };
    });

    const urls = [...staticUrls, ...articleUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => {
    const parts = [
      `<url>`,
      `<loc>${escapeXml(u.loc)}</loc>`,
      u.lastmod ? `<lastmod>${escapeXml(u.lastmod)}</lastmod>` : '',
      u.changefreq ? `<changefreq>${escapeXml(u.changefreq)}</changefreq>` : '',
      u.priority ? `<priority>${escapeXml(u.priority)}</priority>` : '',
      `</url>`,
    ].filter(Boolean);

    return parts.join('');
  })
  .join('\n')}
</urlset>`;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.end(xml);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.end(`<?xml version="1.0" encoding="UTF-8"?><error>${escapeXml(err?.message || 'Unknown error')}</error>`);
  }
}
