export default async function handler(req, res) {
  try {
    const k = Math.floor(Date.now() / 5000);
    const origin = req.headers.referer || (req.headers.host ? `https://${req.headers.host}` : '');
    const r = encodeURIComponent(origin);
    const url = `https://cricketdata.org/apis/prepscores.aspx?k=${k}&r=${r}`;

    const response = await fetch(url, { headers: { 'User-Agent': '24x7-json-proxy/1.0' }, timeout: 10000 });
    if (!response.ok) {
      res.status(502).json({ error: `Upstream fetch failed: ${response.status}` });
      return;
    }

    const text = await response.text();

    // Split slabs
    const slabHtmls = text.split(/<div\s+class="slab\b/).slice(1);
    const matches = slabHtmls.map((raw) => {
      const html = '<div class="slab' + raw;
      const idMatch = raw.match(/data-id=["']([a-f0-9-]+)["']/i);
      const id = idMatch?.[1] || null;

      // Date (first <div>...</div>)
      const dateMatch = raw.match(/<div[^>]*>\s*([^<>]+?)\s*<\/div>/);
      const dateText = dateMatch?.[1]?.trim() || '';

      // Match type (span near top with uppercase like t20, odi)
      const typeMatch = raw.match(/<span[^>]*>\s*([A-Za-z0-9\s']+)\s*<\/span>/i);
      const matchType = typeMatch?.[1]?.trim() || '';

      // Venue: "At <b>Venue</b>"
      const venueMatch = raw.match(/At\s*<b[^>]*>([^<]+)<\/b>/i);
      const venue = venueMatch?.[1]?.trim() || '';

      // Status: find a div that contains 'won' or words like 'need' or 'Live'
      const statusMatch = raw.match(/<div[^>]*>\s*([^<>]*?(won by|need|Live|FT|Full Time|won|chasing)[^<>]*)\s*<\/div>/i);
      const status = statusMatch?.[1]?.trim() || '';

      // Details URL from cricapi.showModal(...) or any link to cricketdata.org
      const modalMatch = raw.match(/cricapi\.showModal\(['"]([^'"]+)['"]\)/i) || raw.match(/https?:\/\/cricketdata\.org\/[^"'<>\s]+/i);
      const detailsUrl = modalMatch?.[1]?.trim() || (modalMatch ? modalMatch[0] : null);

      // Teams and scores from table rows
      const teamRows = Array.from(raw.matchAll(/<tr>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<\/tr>/gi));
      const teams = teamRows.map((m) => ({ name: m[1].trim(), score: m[2].trim() }));

      const team1 = teams[0] ? { ...teams[0] } : null;
      const team2 = teams[1] ? { ...teams[1] } : null;

      // Extract logos (criclogo images) - first two images are team logos
      const imgMatches = Array.from(raw.matchAll(/<img[^>]*class=["']criclogo["'][^>]*src=["']([^"']+)["']/gi));
      const logo1 = imgMatches[0]?.[1] || null;
      const logo2 = imgMatches[1]?.[1] || null;

      // Derive short codes (acronym from team names) as a fallback
      const acronym = (name = '') => {
        if (!name) return '';
        const parts = name.replace(/[^A-Za-z0-9 ]+/g, '').split(/\s+/).filter(Boolean);
        if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
        return parts.map(p => p[0]).slice(0,3).join('').toUpperCase();
      };

      if (team1) {
        team1.logo = logo1;
        team1.short = (team1.name && team1.name.length <= 4) ? team1.name.toUpperCase() : acronym(team1.name);
      }
      if (team2) {
        team2.logo = logo2;
        team2.short = (team2.name && team2.name.length <= 4) ? team2.name.toUpperCase() : acronym(team2.name);
      }

      const isLive = !/won by|won|Full Time|FT|won/i.test(status) && /need|chasing|Live|\d+'/.test(raw) || /need|chasing|Live|\d+'/i.test(raw);

      return {
        id,
        matchType,
        date: dateText,
        venue,
        status,
        detailsUrl,
        team1,
        team2,
        isLive,
        rawHtml: html.replace(/<script[\s\S]*?<\/script>/gi, '')
      };
    }).filter(m => m.id);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
    res.status(200).json({ matches });
  } catch (err) {
    console.error('cric-prepscores-json error:', err);
    res.status(500).json({ error: 'Failed to parse prepscores' });
  }
}
