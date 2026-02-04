import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Bookmark, MessageSquare, Clock, Eye, User, CalendarDays, MapPin, Edit, Youtube, RefreshCw } from 'lucide-react';
import AdPlaceholder from '@/components/ads/AdPlaceholder';
import RelatedArticles from '@/components/news/RelatedArticles';
import ShareModal from '@/components/news/ShareModal';
import { fetchArticle } from '@/lib/db.js';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/components/ui/use-toast';


const EmbeddedVideoPlayer = ({ videoHtml }) => {
  const [hasPlayed, setHasPlayed] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const { user } = useAuth();
  const playerRef = useRef(null);

  const handleReplayClick = () => {
    if (user) {
      setHasPlayed(false);
      setShowOverlay(false);
      if (playerRef.current) {
        playerRef.current.seekTo(0);
        playerRef.current.playVideo();
      }
    } else {
      const youtubeRegex = /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/;
      const youtubeMatch = videoHtml.match(youtubeRegex);
      if (youtubeMatch) {
        const channelUrl = `https://www.youtube.com/watch?v=${youtubeMatch[1]}`;
        window.open(channelUrl, '_blank');
      } else {
        alert('Please subscribe to the channel to watch again.');
      }
    }
  };

  const handlePlayerStateChange = (event) => {
    if (event.data === 0) {
      setHasPlayed(true);
      setShowOverlay(true);
    }
  };

  const videoContainerRef = useRef(null);

  useEffect(() => {
    const scriptId = 'youtube-iframe-api';
    let script = document.getElementById(scriptId);

    const onScriptLoad = () => {
      const iframe = videoContainerRef.current?.querySelector('iframe');
      if (iframe && !iframe.player) {
        playerRef.current = new window.YT.Player(iframe, {
          events: {
            'onStateChange': handlePlayerStateChange
          }
        });
        iframe.player = playerRef.current;
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
      script.onload = onScriptLoad;

      window.onYouTubeIframeAPIReady = () => {
        const iframe = videoContainerRef.current?.querySelector('iframe');
        if (iframe && !iframe.player) {
          playerRef.current = new window.YT.Player(iframe, {
            events: {
              'onStateChange': handlePlayerStateChange
            }
          });
          iframe.player = playerRef.current;
        }
      };
    } else if (window.YT) {
      onScriptLoad();
    } else {
      window.onYouTubeIframeAPIReady = onScriptLoad;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoHtml]);

  return (
    <div className="relative aspect-video rounded-lg overflow-hidden bg-black" ref={videoContainerRef}>
      <div
        className={cn("w-full h-full", { "blur-sm pointer-events-none": showOverlay })}
        dangerouslySetInnerHTML={{ __html: videoHtml.replace(/width="[^"]*"/g, 'width="100%"').replace(/height="[^"]*"/g, 'height="100%"').replace(/<iframe /, '<iframe enablejsapi=1 ') }}
      />
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-4"
          >
            <h3 className="text-xl font-bold mb-4 text-center">Subscribe to watch again</h3>
            <Button onClick={handleReplayClick} className="bg-red-600 hover:bg-red-700">
              {user ? <RefreshCw className="mr-2 h-4 w-4" /> : <Youtube className="mr-2 h-4 w-4" />}
              {user ? "Replay" : "Subscribe & Replay"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const ArticleDetail = ({ article, onBack, currentContent, onEdit, baseUrl, language, onArticleSelect }) => {
  const [relatedArticles, setRelatedArticles] = useState([]);
  const articleContentRef = useRef(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { toast } = useToast();

  const handleShareClick = () => {
    const url = `${baseUrl}/article/${article.id}`;
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.excerpt,
        url: url,
      })
        .then(() => console.log('Successful share'))
        .catch((error) => console.log('Error sharing', error));
    } else {
      setIsShareModalOpen(true);
    }
  };

  const processArticleContent = (htmlContent) => {
    if (!htmlContent) return '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const iframes = doc.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="vimeo.com"]');

    iframes.forEach(iframe => {
      const wrapper = doc.createElement('div');
      wrapper.className = 'embedded-video-wrapper';
      iframe.parentNode.replaceChild(wrapper, iframe);
      wrapper.appendChild(iframe);
    });

    return doc.body.innerHTML;
  };

  const [processedContent, setProcessedContent] = useState('');

  useEffect(() => {
    setProcessedContent(processArticleContent(article.content));
  }, [article.content]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!article || !article.category) return;

      try {
        const data = await fetchArticles({ limit: 3, category: article.category });
        const related = data.filter(a => a.id !== article.id).slice(0, 3);

        const translatedRelated = related.map(a => ({
          ...a,
          title: a.title_hi || currentContent?.notAvailable || 'उपलब्ध नहीं',
          excerpt: a.excerpt_hi || '',
          image_alt_text: a.image_alt_text_hi || a.title_hi || currentContent?.notAvailable || 'उपलब्ध नहीं',
        }));
        setRelatedArticles(translatedRelated);
      } catch (error) {
        console.error('Error fetching related articles:', error);
      }
    };

    fetchRelated();
  }, [article, language]);

  if (!article) return null;

  const { id, title, excerpt, category, view_count, author, published_at, updated_at, image_url, image_alt_text, seo_title, seo_keywords, video_url } = article;
  const categoryName = currentContent.categories[category] || category;
  const authorName = author || (currentContent.siteName || "News Team");
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
  const generalKeywords = "भारत समाचार आज, आज की ताजा खबर, राष्ट्रीय समाचार, भाजपा, कांग्रेस, नवीनतम समाचार, ब्रेकिंग न्यूज";
  const combinedKeywords = [seo_keywords, generalKeywords].filter(Boolean).join(', ');

  const path = `/article/${id}`;
  const canonicalUrl = `${baseUrl}${path}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    },
    "headline": title,
    "image": [image_url],
    "datePublished": published_at,
    "dateModified": updated_at || published_at,
    "author": {
      "@type": "Person",
      "name": authorName
    },
    "publisher": {
      "@type": "Organization",
      "name": "24x7 Indian News",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.svg`
      }
    },
    "description": excerpt,
    "keywords": combinedKeywords,
    ...(video_url && {
      "video": {
        "@type": "VideoObject",
        "name": title,
        "description": excerpt,
        "thumbnailUrl": image_url,
        "embedUrl": video_url.match(/src="([^"]+)"/)?.[1] || video_url,
        "uploadDate": published_at,
      }
    })
  };

  return (
    <>
      <Helmet>
        <html lang={language} />
        <title>{`${seo_title || title} | ${currentContent?.siteName || '24x7 Indian News'}`}</title>
        <meta name="description" content={excerpt} />
        <meta name="keywords" content={combinedKeywords} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={seo_title || title} />
        <meta property="og:description" content={excerpt} />
        <meta property="og:image" content={image_url} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta name="news_keywords" content={combinedKeywords} />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": `${baseUrl}/`
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": categoryName || 'Article',
                "item": `${baseUrl}/category/${category}`
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": seo_title || title,
                "item": canonicalUrl
              }
            ]
          })}
        </script>
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
      >
        <div className="bg-card/70 backdrop-blur-md rounded-xl shadow-xl p-6 sm:p-8 border border-white/10">
          <div className="flex justify-between items-center mb-6">
            <Button variant="ghost" onClick={onBack} className="text-primary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {currentContent.categories.all}
            </Button>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(article)}>
                <Edit className="h-4 w-4 mr-2" /> {currentContent.edit}
              </Button>
            )}
          </div>

          <header className="mb-6">
            <span className="text-sm font-semibold text-primary mb-2 inline-block">{categoryName}</span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">{title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mt-4 border-t border-b border-white/10 py-3">
              <span className="flex items-center"><User className="h-4 w-4 mr-1.5" /> {authorName}</span>
              <span className="flex items-center"><CalendarDays className="h-4 w-4 mr-1.5" /> {formattedDate}</span>
              <span className="flex items-center"><Clock className="h-4 w-4 mr-1.5" /> {time_ago || 'N/A'}</span>
              <span className="flex items-center"><Eye className="h-4 w-4 mr-1.5" /> {view_count || 0} {currentContent.views}</span>
              {article.location && <span className="flex items-center"><MapPin className="h-4 w-4 mr-1.5" /> {article.location}</span>}
            </div>
          </header>

          {video_url ? (
            <div className="mb-8">
              <EmbeddedVideoPlayer videoHtml={video_url} />
            </div>
          ) : image_url && (
            <div className="mb-8 rounded-lg overflow-hidden aspect-video">
              <img alt={image_alt_text || title} className="w-full h-full object-cover" src={image_url} />
            </div>
          )}

          <AdPlaceholder type="inContent" />

          <div
            ref={articleContentRef}
            className="prose prose-lg dark:prose-invert max-w-none leading-relaxed text-foreground article-content"
          >
            {Array.from(new DOMParser().parseFromString(processedContent, 'text/html').body.childNodes).map((node, index) => {
              if (node.nodeName === 'DIV' && node.classList.contains('embedded-video-wrapper')) {
                return <EmbeddedVideoPlayer key={index} videoHtml={node.innerHTML} />;
              }
              return <div key={index} dangerouslySetInnerHTML={{ __html: node.outerHTML || node.textContent }} />;
            })}
          </div>

          <footer className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleShareClick}>
                <Share2 className="h-4 w-4 mr-2" /> {currentContent.shareArticle}
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast({ title: "🚧 Feature not implemented yet!" })}>
                <Bookmark className="h-4 w-4 mr-2" /> {currentContent.bookmark}
              </Button>
            </div>
            <Button size="sm" onClick={() => toast({ title: "🚧 Feature not implemented yet!" })}>
              <MessageSquare className="h-4 w-4 mr-2" /> {currentContent.comments} ({article.comment_count || 0})
            </Button>
          </footer>
        </div>

        {relatedArticles.length > 0 && (
          <RelatedArticles
            articles={relatedArticles}
            content={currentContent}
            onArticleSelect={onArticleSelect}
          />
        )}

        <ShareModal
          isOpen={isShareModalOpen}
          setIsOpen={setIsShareModalOpen}
          url={canonicalUrl}
          title={title}
          currentContent={currentContent}
        />
      </motion.div>
    </>
  );
};

export default ArticleDetail;
