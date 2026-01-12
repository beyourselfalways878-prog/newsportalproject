import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Eye, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Optional section to show a list of featured/latest articles.
// Not wired by default; safe to import and use anywhere.
const FeaturedNews = ({ news, content, onArticleClick, title }) => {
  if (!news || news.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">{content?.noNews || 'No Articles Available'}</div>;
  }

  return (
    <section className="mb-12">
      <h2 className="text-2xl md:text-3xl font-extrabold mb-6 pb-2 border-b-2 border-primary inline-block text-foreground">
        {title || content?.latest || 'Latest'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {news.map((article, index) => {
          // Calculate time ago for each article
          const time_ago = useMemo(() => {
            if (!article.published_at) return 'N/A';
            const now = new Date();
            const published = new Date(article.published_at);
            const diffMs = now - published;
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            return `${diffDays}d ago`;
          }, [article.published_at]);

          return (
          <motion.article
            key={article.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="bg-card/70 backdrop-blur-md rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/10 group cursor-pointer"
            onClick={() => onArticleClick?.(article)}
          >
            <div className="aspect-video bg-muted relative overflow-hidden">
              {article.image_url ? (
                <img
                  src={article.image_url}
                  alt={article.image_alt_text || article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">No Image</span>
                </div>
              )}

              {/* Always-on subtle overlay for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-4">
                <span className="bg-primary/80 backdrop-blur-sm text-primary-foreground px-3 py-1.5 rounded-full text-xs font-semibold shadow-md inline-block">
                  {(content?.categories && content.categories[article.category]) || article.category}
                </span>
                <h3 className="mt-2 text-lg md:text-xl font-bold line-clamp-2 text-white shadow-text">
                  {article.title}
                </h3>
              </div>
            </div>

            <div className="p-5">
              <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>

              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-white/10 pt-3">
                <div className="flex items-center gap-4">
                  <span className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {time_ago || article.time || 'N/A'}
                  </span>
                  <span className="flex items-center">
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    {article.view_count || 0}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-auto py-1 px-2 text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onArticleClick?.(article);
                  }}
                >
                  {content?.readMore || 'Read'} <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </motion.article>
        );
        })}
      </div>
    </section>
  );
};

export default FeaturedNews;
