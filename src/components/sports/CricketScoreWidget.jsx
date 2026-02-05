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
        const res = await fetch('/api/live-scores'); // New endpoint
        if (!res.ok) throw new Error('Fetch failed');
        const json = await res.json();

        if (!mounted) return;

        const matchesData = json.matches || [];
        setMatches(matchesData);

        // Fetch AI commentary for the first active match if available
        if (matchesData.length > 0) {
          try {
            const aiRes = await fetch('/api/ai-commentary', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ matchData: matchesData[0] })
            });
            const aiJson = await aiRes.json();
            if (aiJson.text) {
              console.log('AI Commentary:', aiJson.text);
              // Could store this in state to display in the widget
            }
          } catch (ignore) {
            // Ignore AI errors to keep widget functional
          }
        }

      } catch (err) {
        console.error('Error loading cricket scores:', err);
        setError('Unable to load live scores');
        setMatches([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchJson();
    const refresh = setInterval(fetchJson, 60000); // Poll every minute

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
    const isHorizontal = () => (holder.scrollWidth > holder.clientWidth) && (window.innerWidth >= 640);
    const doAdvanceHorizontal = () => {
      const w = holder.clientWidth;
      if ((holder.scrollLeft + w) >= holder.scrollWidth - 2) {
        holder.scrollLeft = 0;
      } else {
        holder.scrollLeft = holder.scrollLeft + w;
      }
    };

    let interval = null;
    if (isHorizontal()) {
      interval = setInterval(() => { if (!paused) doAdvanceHorizontal(); }, 8000); // Slower interval
    }

    const onMouseEnter = () => (paused = true);
    const onMouseLeave = () => (paused = false);
    const onTouchStart = () => (paused = true);
    const onTouchEnd = () => (paused = false);

    holder.addEventListener('mouseenter', onMouseEnter);
    holder.addEventListener('mouseleave', onMouseLeave);
    holder.addEventListener('touchstart', onTouchStart, { passive: true });
    holder.addEventListener('touchend', onTouchEnd);

    // Keyboard navigation
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

    return () => {
      if (interval) clearInterval(interval);
      try {
        holder.removeEventListener('mouseenter', onMouseEnter);
        holder.removeEventListener('mouseleave', onMouseLeave);
        holder.removeEventListener('touchstart', onTouchStart);
        holder.removeEventListener('touchend', onTouchEnd);
        holder.removeEventListener('keydown', onKey);
      } catch (e) { }
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
      <div ref={holderRef} className="slideholder sm:overflow-x-auto overflow-y-auto sm:snap-x snap-mandatory rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800" style={{ height: '100%', WebkitOverflowScrolling: 'touch' }}>
        <div className="flex sm:flex-row flex-col" style={{ gap: 12 }}>
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
                    <div className="raw-html-fallback mt-2 text-xs text-slate-500 hidden sm:block" style={{ maxHeight: 64, overflow: 'auto' }} dangerouslySetInnerHTML={{ __html: m.sanitizedHtml }} />
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


