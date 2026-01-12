import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Eye, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ArticleCard = ({ article, content, onArticleClick, index }) => {
  if (!article) return null;

  // Calculate time ago
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
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="bg-card/70 backdrop-blur-md rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/10 flex flex-col group cursor-pointer"
      onClick={() => onArticleClick(article)}
    >
      <div className="aspect-video overflow-hidden relative">
        {article.image_url ? (
          <img
            src={article.image_url}
            alt={article.image_alt_text || article.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No Image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <span className="absolute top-3 left-3 bg-primary/80 backdrop-blur-sm text-primary-foreground px-3 py-1.5 rounded-full text-xs font-semibold shadow-md">
          {content.categories[article.category] || article.category}
        </span>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold mb-2 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-grow">
          {article.excerpt}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-3 border-t border-white/10">
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1" />
              {time_ago || 'N/A'}
            </span>
            <span className="flex items-center">
              <Eye className="h-3.5 w-3.5 mr-1" />
              {article.view_count || 0}
            </span>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-auto py-1 px-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            {content.readMore} <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </motion.article>
  );
};


const ArticleGrid = ({ articles, content, onArticleClick, title }) => {
  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground col-span-full">
        <h2 className="text-2xl font-semibold mb-2">{content.noNews}</h2>
        <p className="text-sm">Please check back later for more updates.</p>
      </div>
    );
  }

  return (
    <section className="py-8">
      <h2 className="text-3xl font-extrabold mb-8 pb-2 border-b-2 border-primary inline-block text-foreground">
        {title || content.moreNewsTitle || 'Latest Articles'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((article, index) => (
          <ArticleCard
            key={article.id || index}
            article={article}
            content={content}
            onArticleClick={onArticleClick}
            index={index}
          />
        ))}
      </div>
    </section>
  );
};

export default ArticleGrid;
