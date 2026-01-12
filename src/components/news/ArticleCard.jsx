import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Eye, ArrowRight, User, CalendarDays, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ArticleCard = ({ article, content, onReadMore, onEdit, index, language }) => {
  if (!article) return null;

  const { title, excerpt, category, image_url, author, published_at, view_count } = article;
  const categoryName = content.categories[category] || category;
  const authorName = author || (content.siteName || "News Team");
  const formattedDate = published_at
    ? new Date(published_at).toLocaleDateString('hi-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  // Calculate time ago
  const time_ago = useMemo(() => {
    if (!published_at) return 'N/A';
    const now = new Date();
    const published = new Date(published_at);
    const diffMs = now - published;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }, [published_at]);

  const altText = article.image_alt_text_hi || article.title_hi || title;

  return (
    <motion.article
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="bg-card/70 backdrop-blur-md rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/10 flex flex-col md:flex-row group"
    >
      <div className="md:w-2/5 aspect-video md:aspect-auto overflow-hidden relative cursor-pointer" onClick={onReadMore}>
        {image_url ? (
          <img
            src={image_url}
            alt={altText}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No Image</span>
          </div>
        )}
      </div>

      <div className="p-5 md:p-6 flex flex-col flex-grow md:w-3/5">
        <span className="text-sm font-semibold text-primary mb-2">
          {categoryName}
        </span>
        <h3 className="text-xl font-bold mb-3 line-clamp-2 text-foreground group-hover:text-primary transition-colors cursor-pointer" onClick={onReadMore}>
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-grow">
          {excerpt}
        </p>

        <div className="text-xs text-muted-foreground mt-auto pt-3 border-t border-white/10 space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center"><User className="h-3.5 w-3.5 mr-1" /> {authorName}</span>
            <span className="flex items-center"><CalendarDays className="h-3.5 w-3.5 mr-1" /> {formattedDate}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="flex items-center"><Clock className="h-3.5 w-3.5 mr-1" /> {time_ago || 'N/A'}</span>
              <span className="flex items-center"><Eye className="h-3.5 w-3.5 mr-1" /> {view_count || 0}</span>
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={onEdit} className="text-xs h-auto py-1 px-2 text-muted-foreground hover:text-primary">
                  <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
              )}
            </div>
            <Button variant="link" size="sm" onClick={onReadMore} className="text-xs h-auto py-1 px-2 text-primary group-hover:underline">
              {content.readMore} <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default ArticleCard;
