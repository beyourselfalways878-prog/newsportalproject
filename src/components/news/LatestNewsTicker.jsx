import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchArticles } from '@/lib/db.js';

const LatestNewsTicker = () => {
  const [headlines, setHeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const fetchHeadlines = async () => {
      setLoading(true);
      try {
        const data = await fetchArticles({ limit: 12 });
        if (!isActive) return;

        const mapped = (data || []).map((article) => ({
          id: article.id,
          title: article.title_hi || article.title || 'Untitled',
        }));

        setHeadlines(mapped);
      } catch (error) {
        console.error('Latest ticker fetch error:', error);
        setHeadlines([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHeadlines();

    // Optional: refresh periodically (every 60s)
    const interval = setInterval(fetchHeadlines, 60000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) return <div className="text-sm text-muted-foreground">Loading...</div>;
  if (!headlines.length) return null;

  return (
    <div className="bg-blue-600 text-white py-2 overflow-hidden relative">
      <div className="flex items-center">
        <span className="font-bold whitespace-nowrap bg-blue-700 px-4 py-1 z-10">ताज़ा ख़बरें</span>
        <div className="flex-1 overflow-hidden ml-2">
          <div
            className="flex gap-12 whitespace-nowrap"
            style={{
              animation: 'ticker-scroll 30s linear infinite',
            }}
          >
            {/* Duplicate headlines for seamless loop */}
            {[...headlines, ...headlines].map((h, idx) => (
              <Link
                key={`${h.id}-${idx}`}
                to={`/article/${h.id}`}
                className="hover:underline flex-shrink-0"
              >
                • {h.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default LatestNewsTicker;
