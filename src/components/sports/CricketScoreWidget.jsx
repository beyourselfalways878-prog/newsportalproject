import React, { useEffect, useState, useRef } from 'react';

const CricketScoreWidget = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const idxRef = useRef(0);
  const holderRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const fetchJson = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/cric-prepscores-json');
        if (!res.ok) throw new Error('Fetch failed');
        const json = await res.json();
        if (!mounted) return;

        // Helper: sanitize vendor HTML (strip scripts, inline styles and event handlers)
        const sanitizeHtml = (raw) => {
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(raw || '', 'text/html');
            // remove risky nodes
            doc.querySelectorAll('script,iframe,form').forEach(n => n.remove());
            // strip inline styles and event handlers, sanitize hrefs
            doc.querySelectorAll('*').forEach(el => {
              [...el.attributes].forEach(attr => {
                const name = attr.name.toLowerCase();
                const value = attr.value || '';
                if (name.startsWith('on')) el.removeAttribute(attr.name);
                if (name === 'style') el.removeAttribute('style');
                if (name === 'href' && value.trim().toLowerCase().startsWith('javascript:')) el.removeAttribute('href');
              });
            });
            // make links safe
            doc.querySelectorAll('a').forEach(a => { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noreferrer noopener'); });
            return doc.body.innerHTML || '';
          } catch (e) {
            return '';
          }
        };

        const deriveShort = (name) => {
          if (!name) return '';
          const parts = name.replace(/[^A-Za-z0-9 ]+/g, '').split(/\s+/).filter(Boolean);
          if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
          return parts.map(p => p[0]).slice(0,3).join('').toUpperCase();
        };

        const enriched = (json.matches || []).map(m => {
          const cleaned = { ...m };
          // ensure team objects exist
          cleaned.team1 = cleaned.team1 || { name: '', score: '' };
          cleaned.team2 = cleaned.team2 || { name: '', score: '' };

          // extract images from rawHtml if missing
          try {
            const imgs = Array.from((cleaned.rawHtml || '').matchAll(/<img[^>]*class=['"]criclogo['"][^>]*src=['"]([^'"]+)['"]/gi)).map(a => a[1]);
            if (!cleaned.team1.logo && imgs[0]) cleaned.team1.logo = imgs[0];
            if (!cleaned.team2.logo && imgs[1]) cleaned.team2.logo = imgs[1];
          } catch (e) {}

          if (!cleaned.team1.short) cleaned.team1.short = deriveShort(cleaned.team1.name);
          if (!cleaned.team2.short) cleaned.team2.short = deriveShort(cleaned.team2.name);

          // sanitized HTML fallback (safe to insert)
          cleaned.sanitizedHtml = sanitizeHtml(cleaned.rawHtml || '');

          return cleaned;
        });

        setMatches(enriched);
      } catch (err) {
        console.error('Error loading cric JSON:', err);
        setError('Unable to load live scores');
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJson();
    const refresh = setInterval(fetchJson, 10000);

    return () => {
      mounted = false;
      clearInterval(refresh);
    };
  }, []);

  // Auto-advance / accessibility logic
  useEffect(() => {
    const holder = holderRef.current;
    if (!holder || matches.length === 0) return;

    let paused = false;

    // Decide horizontal vs vertical based on container dimensions and breakpoint
    const isHorizontal = () => (holder.scrollWidth > holder.clientWidth) && (window.innerWidth >= 640);

    const doAdvanceHorizontal = () => {
      const w = holder.clientWidth;
      if ((holder.scrollLeft + w) >= holder.scrollWidth - 2) {
        holder.scrollLeft = 0;
      } else {
        holder.scrollLeft = holder.scrollLeft + w;
      }
    };

    // Only auto-advance when horizontal (desktop/tablet); disable on mobile vertical layout
    let interval = null;
    if (isHorizontal()) {
      interval = setInterval(() => { if (!paused) doAdvanceHorizontal(); }, 5000);
    }

    // Pause on hover (desktop) / touchstart (mobile)
    const onMouseEnter = () => (paused = true);
    const onMouseLeave = () => (paused = false);
    const onTouchStart = () => (paused = true);
    const onTouchEnd = () => (paused = false);

    holder.addEventListener('mouseenter', onMouseEnter);
    holder.addEventListener('mouseleave', onMouseLeave);
    holder.addEventListener('touchstart', onTouchStart, { passive: true });
    holder.addEventListener('touchend', onTouchEnd);

    // Keyboard navigation for accessibility
    holder.tabIndex = 0;
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (isHorizontal()) doAdvanceHorizontal(); else holder.scrollTop += holder.clientHeight || 200;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (isHorizontal()) holder.scrollLeft = Math.max(0, holder.scrollLeft - holder.clientWidth); else holder.scrollTop = Math.max(0, holder.scrollTop - (holder.clientHeight || 200));
      }
    };

    holder.addEventListener('keydown', onKey);

    const ro = new ResizeObserver(() => {
      // Keep first card in view when resized
      if (isHorizontal()) {
        holder.scrollLeft = Math.floor(holder.scrollLeft / Math.max(1, holder.clientWidth)) * holder.clientWidth;
      } else {
        holder.scrollTop = Math.floor(holder.scrollTop / Math.max(1, holder.clientHeight || 200)) * (holder.clientHeight || 200);
      }
    });
    ro.observe(holder);

    return () => {
      if (interval) clearInterval(interval);
      try { ro.disconnect(); } catch (e) {}
      try {
        holder.removeEventListener('mouseenter', onMouseEnter);
        holder.removeEventListener('mouseleave', onMouseLeave);
        holder.removeEventListener('touchstart', onTouchStart);
        holder.removeEventListener('touchend', onTouchEnd);
        holder.removeEventListener('keydown', onKey);
      } catch (e) {}
    };
  }, [matches]);

  if (loading) {
    return (
      <div className="w-full max-w-[320px] min-w-[280px]">
        <div className="mx-auto h-[320px] w-full rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800 flex items-center justify-center text-sm text-slate-500">
          Loading live scores...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-[320px] min-w-[280px]">
        <div className="mx-auto h-[320px] w-full rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800 flex items-center justify-center text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!matches.length) {
    return (
      <div className="w-full max-w-[320px] min-w-[280px]">
        <div className="mx-auto h-[320px] w-full rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800 flex items-center justify-center text-sm text-slate-500">
          No live matches right now
        </div>
      </div>
    );
  }

  return (
    <div className="w-full sm:w-[300px] sm:h-[300px]">
      <div ref={holderRef} className="slideholder sm:overflow-x-auto overflow-y-auto sm:snap-x snap-mandatory rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800" style={{height: '100%', WebkitOverflowScrolling: 'touch'}}>
        <div className="flex sm:flex-row flex-col" style={{gap: 12}}>
          {matches.map((m) => (
            <div
              key={m.id}
              className="slab snap-start p-3 sm:p-4 bg-white dark:bg-slate-800 w-full sm:w-[300px] rounded-lg shadow-sm flex flex-col justify-between relative h-full flex-shrink-0"
              style={{ boxSizing: 'border-box' }}
            >
              <div>
                <div className="text-xs text-muted-foreground">{m.matchType?.toUpperCase()} • {m.date}</div>

                {/* Top logos / short codes */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {m.team1?.logo ? (
                      <img src={m.team1.logo} alt={`${m.team1.name} logo`} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">{m.team1?.short}</div>
                    )}
                    <div className="text-sm font-semibold truncate max-w-[120px]">{m.team1?.name}</div>
                  </div>

                  <div className="text-center">
                    <div className="w-6 h-6 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs">v</div>
                  </div>

                  <div className="flex items-center gap-2 justify-end overflow-hidden">
                    <div className="text-sm font-semibold truncate text-right max-w-[120px]">{m.team2?.name}</div>
                    {m.team2?.logo ? (
                      <img src={m.team2.logo} alt={`${m.team2.name} logo`} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">{m.team2?.short}</div>
                    )}
                  </div>
                </div>

                <div className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                  <table className="w-full text-sm">
                    <tbody>
                      {m.team1 && (
                        <tr>
                          <td className="truncate">{m.team1.name}</td>
                          <td className="text-right font-bold">{m.team1.score}</td>
                        </tr>
                      )}
                      {m.team2 && (
                        <tr>
                          <td className="truncate">{m.team2.name}</td>
                          <td className="text-right font-bold">{m.team2.score}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Safe vendor fallback HTML (sanitized) - hidden on very small screens */}
                  {m.sanitizedHtml ? (
                    <div className="raw-html-fallback mt-2 text-xs text-slate-500 hidden sm:block" style={{maxHeight: 64, overflow: 'auto'}} dangerouslySetInnerHTML={{ __html: m.sanitizedHtml }} />
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-muted-foreground truncate">{m.status}</div>
                {m.detailsUrl ? (
                  <a className="text-xs text-blue-600 hover:underline ml-2" href={m.detailsUrl} target="_blank" rel="noreferrer">Full</a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CricketScoreWidget;


