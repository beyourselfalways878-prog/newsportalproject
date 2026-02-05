import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Eye, ArrowRight, User, CalendarDays, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageWithPlaceholder from '@/components/ui/ImageWithPlaceholder';

const ArticleCard = ({ article, content, onReadMore, onEdit, index, language }) => {
  if (!article) return null;

  const { title, excerpt, category, image_url, author, published_at, view_count } = article;
  const categoryName = content.categories[category] || category;
  const authorName = author || (content.siteName || "News Team");
  const formattedDate = published_at
    ? new Date(published_at).toLocaleDateString('hi-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  // Calculate time ago (Hindi)
  const time_ago = useMemo(() => {
    if (!published_at) return 'N/A';
    const now = new Date();
    const published = new Date(published_at);
    const diffMs = now - published;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'अभी';
    if (diffMins < 60) return `${diffMins} मिनट पहले`;
    if (diffHours < 24) return `${diffHours} घंटे पहले`;
    return `${diffDays} दिन पहले`;
  }, [published_at]);

  const altText = article.image_alt_text_hi || article.title_hi || title;

  return (
    <motion.article
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="bg-card/70 backdrop-blur-md rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/10 flex flex-col md:flex-row group"
      aria-labelledby={`article-title-${article.id}`}
    >
      <div
        className="md:w-2/5 aspect-video md:aspect-auto overflow-hidden relative cursor-pointer"
        onClick={onReadMore}
        role="button"
        aria-label={`${title} पढ़ें`}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onReadMore()}
      >
        {image_url ? (
          <ImageWithPlaceholder
            src={image_url}
            alt={altText}
            className="group-hover:scale-105 transition-transform duration-500 ease-in-out"
            wrapperClassName="w-full h-full"
            aspectRatio="auto"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center" aria-hidden="true">
            <span className="text-muted-foreground text-sm">छवि उपलब्ध नहीं</span>
          </div>
        )}
      </div>

      <div className="p-5 md:p-6 flex flex-col flex-grow md:w-3/5">
        <span className="text-sm font-semibold text-primary mb-2" aria-label={`श्रेणी: ${categoryName}`}>
          {categoryName}
        </span>
        <h3
          id={`article-title-${article.id}`}
          className="text-xl font-bold mb-3 line-clamp-2 text-foreground group-hover:text-primary transition-colors cursor-pointer"
          onClick={onReadMore}
        >
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-grow">
          {excerpt}
        </p>

        <footer className="text-xs text-muted-foreground mt-auto pt-3 border-t border-white/10 space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center" aria-label={`लेखक: ${authorName}`}>
              <User className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> {authorName}
            </span>
            <span className="flex items-center" aria-label={`प्रकाशित: ${formattedDate}`}>
              <CalendarDays className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> {formattedDate}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="flex items-center" aria-label={`समय: ${time_ago}`}>
                <Clock className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> {time_ago}
              </span>
              <span className="flex items-center" aria-label={`${view_count || 0} बार देखा गया`}>
                <Eye className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> {view_count || 0}
              </span>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="text-xs h-auto py-1 px-2 text-muted-foreground hover:text-primary"
                  aria-label="लेख संपादित करें"
                >
                  <Edit className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> संपादित
                </Button>
              )}
            </div>
            <Button
              variant="link"
              size="sm"
              onClick={onReadMore}
              className="text-xs h-auto py-1 px-2 text-primary group-hover:underline"
              aria-label={`${title} पूरा पढ़ें`}
            >
              {content.readMore} <ArrowRight className="h-3.5 w-3.5 ml-1" aria-hidden="true" />
            </Button>
          </div>
        </footer>
      </div>
    </motion.article>
  );
};

export default ArticleCard;
