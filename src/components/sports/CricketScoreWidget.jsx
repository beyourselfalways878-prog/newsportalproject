import React, { useEffect } from 'react';

const CricketScoreWidget = () => {
  useEffect(() => {
    let mounted = true;
    const container = document.getElementById('cric_data_live_score');
    if (!container) return;

    const loading = () => {
      container.innerHTML = `<div class="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-300">Live cricket scores are loading...</div>`;
    };

    const fetchAndRender = async () => {
      loading();
      try {
        const res = await fetch('/api/cric-prepscores');
        if (!res.ok) throw new Error('Fetch failed');
        const html = await res.text();
        if (!mounted) return;

        container.innerHTML = html;

        // Post-process: replace "onclick=\"cricapi.showModal('url')\"" with normal links (open in new tab)
        container.querySelectorAll('[onclick]').forEach((el) => {
          const onclick = el.getAttribute('onclick');
          if (!onclick) return;
          // cricapi.showModal('URL')
          const modalMatch = onclick.match(/cricapi.showModal\(['\"]([^'\"]+)['\"]\)/i);
          if (modalMatch) {
            const url = modalMatch[1];
            el.setAttribute('href', url);
            el.setAttribute('target', '_blank');
            el.removeAttribute('onclick');
          }
          // cricapi_setSlide(n)
          const slideMatch = onclick.match(/cricapi_setSlide\((-?\d+)\)/i);
          if (slideMatch) {
            el.removeAttribute('onclick');
            el.addEventListener('click', (e) => {
              e.preventDefault();
              const slideNo = parseInt(slideMatch[1], 10);
              const slideHolder = container.querySelector('.slideholder');
              if (!slideHolder) return;
              const w = slideHolder.clientWidth;
              slideHolder.scrollLeft = Math.max(0, Math.min(slideHolder.scrollLeft + slideNo * w, slideHolder.scrollWidth - w));
            });
          }
        });

        // Enforce layout and sizes for slide elements (since original widget JS isn't executed)
        const slideHolder = container.querySelector('.slideholder');
        if (slideHolder) {
          // Basic styles to ensure horizontal layout
          slideHolder.style.display = 'flex';
          slideHolder.style.overflowX = 'hidden';
          slideHolder.style.scrollBehavior = 'smooth';

          const stylize = () => {
            const widgetWidth = Math.max(280, slideHolder.clientWidth);
            const widgetHeight = Math.max(220, slideHolder.clientHeight);
            Array.from(slideHolder.querySelectorAll('.slab')).forEach((s) => {
              s.style.boxSizing = 'border-box';
              s.style.flex = '0 0 auto';
              s.style.width = (widgetWidth - 20) + 'px';
              s.style.height = (widgetHeight - 20) + 'px';
              Array.from(s.children).forEach((c) => {
                if (c.style) {
                  c.style.width = '100%';
                  c.style.height = '100%';
                }
              });
            });
          };

          stylize();

          // Recalculate on resize
          let ro = null;
          try {
            ro = new ResizeObserver(() => stylize());
            ro.observe(slideHolder);
            ro.observe(container);
            window.addEventListener('resize', stylize);
          } catch (e) {
            window.addEventListener('resize', stylize);
          }

          let paused = false;
          let intervalId = null;

          const doAdvance = () => {
            const w = slideHolder.clientWidth;
            if ((slideHolder.scrollLeft + w) >= slideHolder.scrollWidth - 2) {
              slideHolder.scrollLeft = 0;
            } else {
              slideHolder.scrollLeft = slideHolder.scrollLeft + w;
            }
          };

          slideHolder.addEventListener('mouseenter', () => (paused = true));
          slideHolder.addEventListener('mouseleave', () => (paused = false));

          intervalId = setInterval(() => {
            if (!paused) doAdvance();
          }, 5000);

          // Clean up if the widget updates
          const observer = new MutationObserver(() => {
            stylize();
            slideHolder.scrollLeft = 0;
          });
          observer.observe(slideHolder, { childList: true, subtree: true });

          // store cleanup
          container._cricCleanup = () => {
            clearInterval(intervalId);
            observer.disconnect();
            try {
              if (ro) ro.disconnect();
            } catch (e) {}
            window.removeEventListener('resize', stylize);
          };
        }
      } catch (err) {
        console.error('Error loading cric data:', err);
        container.innerHTML = `<div class="flex h-full items-center justify-center text-sm text-destructive">Unable to load live scores</div>`;
      }
    };

    fetchAndRender();

    // Refresh periodically similar to original widget
    const refreshInterval = setInterval(fetchAndRender, 8000);

    return () => {
      mounted = false;
      clearInterval(refreshInterval);
      if (container && container._cricCleanup) container._cricCleanup();
    };
  }, []);

  return (
    <div className="w-full max-w-[320px] min-w-[280px]">
      <div
        id="cric_data_live_score"
        className="mx-auto h-[320px] w-full rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800 overflow-hidden relative"
        aria-label="Live cricket scores">
        <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-300">Live cricket scores are loading...</div>
      </div>
    </div>
  );
};

export default CricketScoreWidget;
