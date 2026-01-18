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
        setMatches(json.matches || []);
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

  // Auto-advance logic
  useEffect(() => {
    const holder = holderRef.current;
    if (!holder || matches.length === 0) return;

    let paused = false;
    const doAdvance = () => {
      const w = holder.clientWidth;
      if ((holder.scrollLeft + w) >= holder.scrollWidth - 2) {
        holder.scrollLeft = 0;
      } else {
        holder.scrollLeft = holder.scrollLeft + w;
      }
    };

    const interval = setInterval(() => {
      if (!paused) doAdvance();
    }, 5000);

    holder.addEventListener('mouseenter', () => (paused = true));
    holder.addEventListener('mouseleave', () => (paused = false));

    const ro = new ResizeObserver(() => {
      // keep first card in view
      holder.scrollLeft = Math.floor(holder.scrollLeft / Math.max(1, holder.clientWidth)) * holder.clientWidth;
    });
    ro.observe(holder);

    return () => {
      clearInterval(interval);
      try { ro.disconnect(); } catch (e) {}
      try { holder.removeEventListener('mouseenter', () => (paused = true)); holder.removeEventListener('mouseleave', () => (paused = false)); } catch (e) {}
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
    <div className="w-full max-w-[320px] min-w-[280px]">
      <div ref={holderRef} className="slideholder overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800" style={{height: 320}}>
        <div className="flex" style={{gap: 12}}>
          {matches.map((m) => (
            <div key={m.id} className="slab p-4 bg-white dark:bg-slate-800 w-[280px] rounded-lg shadow-sm flex flex-col justify-between relative" style={{minWidth: 280}}>
              <div>
                <div className="text-xs text-muted-foreground">{m.matchType?.toUpperCase()} • {m.date}</div>

                {/* Top logos / short codes */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    {m.team1?.logo ? (
                      <img src={m.team1.logo} alt={`${m.team1.name} logo`} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">{m.team1?.short}</div>
                    )}
                    <div className="text-sm font-semibold truncate">{m.team1?.name}</div>
                  </div>

                  <div className="text-center">
                    <div className="w-6 h-6 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs">v</div>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <div className="text-sm font-semibold truncate text-right">{m.team2?.name}</div>
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


