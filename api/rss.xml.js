import { escapeXml, getSiteUrl, getSupabaseAdminReadClient } from './_supabase.js';

export default async function handler(req, res) {
  try {
    const siteUrl = getSiteUrl(req);
    const supabase = getSupabaseAdminReadClient();

    const toCdata = (value) => {
      const raw = String(value ?? '');
      // If content contains ']]>', split CDATA sections to keep the XML valid.
      const safe = raw.replace(/]]>/g, ']]]]><![CDATA[>');
      return `<![CDATA[${safe}]]>`;
    };

    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title_hi, excerpt_hi, category, published_at, updated_at')
      .order('published_at', { ascending: false })
      .limit(50);

    if (error) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.end(`<?xml version="1.0" encoding="UTF-8"?><error>${escapeXml(error.message)}</error>`);
      return;
    }

    const now = new Date().toUTCString();
    const channelTitle = '24x7 इंडियन न्यूज़';
    const channelDescription = 'भारत और दुनिया की ताज़ा ख़बरें हिंदी में।';

    const items = (articles || []).map((a) => {
      const title = a.title_hi || 'शीर्षक उपलब्ध नहीं';
      const description = a.excerpt_hi || '';
      const link = `${siteUrl}/article/${a.id}`;
      const pubDateRaw = a.published_at || a.updated_at;
      const pubDate = pubDateRaw ? new Date(pubDateRaw).toUTCString() : now;
      const guid = link;

      return `
      <item>
        <title>${escapeXml(title)}</title>
        <link>${escapeXml(link)}</link>
        <guid isPermaLink="true">${escapeXml(guid)}</guid>
        <pubDate>${escapeXml(pubDate)}</pubDate>
        ${description ? `<description>${toCdata(description)}</description>` : ''}
        ${a.category ? `<category>${escapeXml(a.category)}</category>` : ''}
      </item>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(channelDescription)}</description>
    <language>hi-IN</language>
    <lastBuildDate>${escapeXml(now)}</lastBuildDate>
    ${items.join('\n')}
  </channel>
</rss>`;

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
