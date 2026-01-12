import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, Eye, User, CalendarDays } from 'lucide-react';

const FeaturedArticleHero = ({ article, content, onReadMore }) => {
  if (!article) {
    return (
      <div className="h-96 flex items-center justify-center bg-muted rounded-xl shadow-inner">
        <p className="text-muted-foreground">{content.noNews}</p>
      </div>
    );
  }

  const { title, excerpt, category, image_url, author, published_at, image_alt_text, view_count } = article;
  const categoryName = content.categories[category] || category;
  const authorName = author || (content.siteName || "News Team");
  const formattedDate = published_at
    ? new Date(published_at).toLocaleDateString(content.language === 'hi' ? 'hi-IN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
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

  // Heuristic: strengthen the overlay when the image is bright.
  // If canvas access fails (CORS/tainted canvas), fall back to a stronger overlay.
  const [isImageDark, setIsImageDark] = useState(true);

  const handleHeroImageLoad = (e) => {
    const img = e.currentTarget;

    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        setIsImageDark(true);
        return;
      }

      const sampleSize = 24;
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      context.drawImage(img, 0, 0, sampleSize, sampleSize);

      const { data } = context.getImageData(0, 0, sampleSize, sampleSize);
      let totalLuma = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        totalLuma += 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }

      const averageLuma = totalLuma / (data.length / 4);
      setIsImageDark(averageLuma < 140);
    } catch {
      setIsImageDark(true);
    }
  };

  const overlayClassName = useMemo(() => {
    // Bright image => stronger overlay for readability
    return isImageDark
      ? 'from-black/70 via-black/35 to-transparent'
      : 'from-black/90 via-black/60 to-transparent';
  }, [isImageDark]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative rounded-xl overflow-hidden shadow-2xl group bg-card border border-border/50"
    >
      <div className="relative aspect-video lg:aspect-[16/7]">
        {image_url ? (
          <img
            src={image_url}
            alt={image_alt_text || title}
            crossOrigin="anonymous"
            onLoad={handleHeroImageLoad}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover transform transition-transform duration-500 ease-in-out group-hover:scale-105"
          />
        ) : (
           <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-xl">No Image Available</span>
           </div>
        )}
        <div className={`absolute inset-0 bg-gradient-to-t ${overlayClassName}`}></div>
      </div>

      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <span className="bg-primary/80 backdrop-blur-sm text-primary-foreground px-4 py-1.5 rounded-full text-sm font-semibold shadow-md mb-3 inline-block">
            {categoryName}
          </span>
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold mb-3 leading-tight line-clamp-3 shadow-text">
            {title}
          </h1>
          <p className="text-sm md:text-base text-white/90 mb-4 line-clamp-2 md:line-clamp-3 max-w-3xl shadow-text">
            {excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs md:text-sm text-white/80 mb-6 shadow-text">
            <span className="flex items-center"><User className="h-4 w-4 mr-1.5" /> {authorName}</span>
            <span className="flex items-center"><CalendarDays className="h-4 w-4 mr-1.5" /> {formattedDate}</span>
            <span className="flex items-center"><Clock className="h-4 w-4 mr-1.5" /> {time_ago || 'N/A'}</span>
            <span className="flex items-center"><Eye className="h-4 w-4 mr-1.5" /> {view_count || 0} {content.views}</span>
          </div>

          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg group-hover:scale-105 transition-transform"
            onClick={onReadMore}
          >
            {content.readMore}
            <ArrowRight className="h-5 w-5 ml-2 transform transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default FeaturedArticleHero;
