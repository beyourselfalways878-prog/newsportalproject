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
    <div className="bg-red-600 text-white py-2 px-4 overflow-hidden">
      <div className="flex items-center gap-4">
        <span className="font-bold whitespace-nowrap">LATEST:</span>
        <div className="flex gap-8 animate-scroll">
          {headlines.map((h) => (
            <Link key={h.id} to={`/article/${h.id}`} className="whitespace-nowrap hover:underline">
              {h.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LatestNewsTicker;
