import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { toast } from '@/components/ui/use-toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import ArticleGrid from '@/components/news/ArticleGrid';
import AuthModal from '@/components/admin/AuthModal.jsx';
import ArticleUploader from '@/components/admin/ArticleUploader.jsx';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { contentData } from '@/lib/data';
import { supabase } from '@/lib/customSupabaseClient.js';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';

const CategoryPage = () => {
  const { categoryKey } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const language = 'hi';
  const [darkMode, setDarkMode] = useState(false);
  const [email, setEmail] = useState('');
  const [articles, setArticles] = useState([]);
  const [trendingDbTopics, setTrendingDbTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [nextFrom, setNextFrom] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const baseUrl = window.location.origin;

  const INITIAL_FETCH_SIZE = 11;
  const LOAD_MORE_SIZE = 10;

  const ARTICLES_CACHE_KEY = `category:${language}:${categoryKey || 'all'}:articles:v1`;
  const TRENDING_CACHE_KEY = `category:${language}:trending:v1`;
  const CACHE_TTL_MS = 1000 * 60 * 3; // 3 minutes

  const listSelect =
    'id,title_hi,excerpt_hi,category,is_breaking,is_featured,image_url,image_alt_text_hi,author,location,published_at,updated_at,views,time_ago,video_url';

  const fetchNews = useCallback(async ({ showLoader = true } = {}) => {
    if (showLoader) setIsLoading(true);
    const from = 0;
    const to = INITIAL_FETCH_SIZE - 1;

    let query = supabase
      .from('articles')
      .select(listSelect)
      .order('published_at', { ascending: false })
      .range(from, to);
    if (categoryKey) {
      query = query.eq('category', categoryKey);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching articles:', error);
      toast({
        title: 'Error Fetching News',
        description: 'Could not load articles for this category.',
        variant: 'destructive',
      });
      setArticles([]);
    } else {
      setArticles(data);
      setVisibleCount(10);
      setNextFrom(data?.length || 0);
      setHasMore((data?.length || 0) === INITIAL_FETCH_SIZE);

      try {
        sessionStorage.setItem(ARTICLES_CACHE_KEY, JSON.stringify({ ts: Date.now(), articles: data, nextFrom: data?.length || 0, hasMore: (data?.length || 0) === INITIAL_FETCH_SIZE }));
      } catch {
        // ignore cache write issues
      }
    }
    if (showLoader) setIsLoading(false);
  }, [ARTICLES_CACHE_KEY, INITIAL_FETCH_SIZE, categoryKey, listSelect]);

  const fetchMoreNews = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const from = nextFrom;
    const to = from + LOAD_MORE_SIZE - 1;

    let query = supabase
      .from('articles')
      .select(listSelect)
      .order('published_at', { ascending: false })
      .range(from, to);
    if (categoryKey) {
      query = query.eq('category', categoryKey);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching more articles:', error);
      setHasMore(false);
      setIsLoadingMore(false);
      return;
    }

    setArticles((prev) => [...prev, ...(data || [])]);
    setNextFrom(from + (data?.length || 0));
    setHasMore((data?.length || 0) === LOAD_MORE_SIZE);
    setIsLoadingMore(false);
  }, [LOAD_MORE_SIZE, categoryKey, hasMore, isLoadingMore, listSelect, nextFrom]);

  const handleLoadMore = async () => {
    const target = visibleCount + LOAD_MORE_SIZE;
    setVisibleCount(target);

    if (target <= articles.length) return;
    if (!hasMore) return;
    await fetchMoreNews();
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setDarkMode(savedTheme === 'dark');
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    document.documentElement.lang = 'hi';

    try {
      const cached = JSON.parse(sessionStorage.getItem(ARTICLES_CACHE_KEY) || 'null');
      if (cached?.ts && Array.isArray(cached?.articles) && Date.now() - cached.ts < CACHE_TTL_MS) {
        setArticles(cached.articles);
        setVisibleCount(10);
        setNextFrom(typeof cached.nextFrom === 'number' ? cached.nextFrom : cached.articles.length);
        setHasMore(!!cached.hasMore);
        setIsLoading(false);
        fetchNews({ showLoader: false });
      } else {
        fetchNews({ showLoader: true });
      }
    } catch {
      fetchNews({ showLoader: true });
    }

    fetchTrendingTopics();
  }, [fetchNews]);

  const fetchTrendingTopics = async () => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(TRENDING_CACHE_KEY) || 'null');
      if (cached?.ts && Array.isArray(cached?.data) && Date.now() - cached.ts < CACHE_TTL_MS) {
        setTrendingDbTopics(cached.data);
      }
    } catch {
      // ignore cache read issues
    }

    const { data, error } = await supabase
      .from('trending_topics')
      .select('name_en,name_hi,rank')
      .order('rank', { ascending: true });

    if (error) {
      console.error('Error fetching trending topics:', error);
    } else {
      setTrendingDbTopics(data);

      try {
        sessionStorage.setItem(TRENDING_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
      } catch {
        // ignore cache write issues
      }
    }
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newMode);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (email) {
      const { error } = await supabase.from('subscribers').insert([{ email, language }]);
      if (error) {
        toast({
          title: 'Subscription Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Subscribed!',
          description: 'You have been added to our newsletter.',
        });
        setEmail('');
      }
    }
  };

  const handleCategorySelect = (key) => {
    if (key === 'all') {
      navigate('/');
    } else {
      navigate(`/category/${key}`);
    }
  };

  const handleArticleSelect = (article) => {
    navigate(`/article/${article.id}`);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleUploadClick = () => {
    if (user?.email === 'pushkarraj207@gmail.com') {
      setIsUploaderOpen(true);
    } else {
      toast({
        title: 'Admin Access Required',
        description: 'Please log in as an admin to upload content.',
      });
      if(!user) {
        setIsAuthModalOpen(true);
      }
    }
  };

  const handleLoginClick = () => {
    setIsAuthModalOpen(true);
  }

  const handleUploadSuccess = () => {
    setIsUploaderOpen(false);
    fetchNews(); // Refresh news after upload
  };

  const currentContent = contentData[language];
  const categories = Object.entries(currentContent.categories);

  const getTranslatedArticle = (article) => {
    if (!article) return null;
    return {
      ...article,
      title: article.title_hi || currentContent.notAvailable || 'उपलब्ध नहीं',
      excerpt: article.excerpt_hi || '',
      image_alt_text: article.image_alt_text_hi || article.title_hi || currentContent.notAvailable || 'उपलब्ध नहीं',
    };
  };

  const translatedArticles = useMemo(() => articles.map(getTranslatedArticle), [articles]);
  const visibleArticles = useMemo(() => translatedArticles.slice(0, visibleCount), [translatedArticles, visibleCount]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      );
    }

    if (!translatedArticles || translatedArticles.length === 0) {
      const suggestedKeys = Object.keys(currentContent.categories)
        .filter((k) => k !== 'all' && k !== categoryKey)
        .slice(0, 8);

      return (
        <div className="bg-card/70 backdrop-blur-md rounded-xl shadow-xl p-6 sm:p-8 border border-white/10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {categoryName}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            इस श्रेणी में अभी कोई लेख उपलब्ध नहीं है। आप नीचे दी गई श्रेणियां देख सकते हैं — हम जल्द ही यहां भी लेख जोड़ेंगे।
          </p>

          {suggestedKeys.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-foreground mb-3">सुझाई गई श्रेणियां</p>
              <div className="flex flex-wrap gap-2">
                {suggestedKeys.map((key) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => handleCategorySelect(key)}
                    className="rounded-full"
                  >
                    {currentContent.categories[key]}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <Button variant="default" onClick={() => handleCategorySelect('all')}>
              होम पर जाएं
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-12">
        <ArticleGrid articles={visibleArticles} content={currentContent} onArticleClick={handleArticleSelect} />
      </div>
    );
  };

  const categoryName = currentContent.categories[categoryKey] || 'श्रेणी';
  const pageTitle = `${categoryName} | ${currentContent.siteName}`;
  const pageDescription = `${categoryName} की ताज़ा ख़बरें और अपडेट्स।`;
  const canonicalUrl = `${baseUrl}/category/${categoryKey}`;
  const canUpload = user?.email === 'pushkarraj207@gmail.com';

  return (
    <>
      <Helmet>
        <html lang={language} />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${baseUrl}/social-card.svg`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`${baseUrl}/social-card.svg`} />
      </Helmet>

      <Header currentContent={currentContent} language={language} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogoClick={handleBackToHome} onLoginClick={handleLoginClick} />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <main className="lg:col-span-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground border-b-4 border-primary pb-2">{categoryName}</h1>
            <AnimatePresence mode="wait">
              <motion.div key={categoryKey} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                {renderContent()}
              </motion.div>
            </AnimatePresence>

            {!isLoading && hasMore && (
              <div className="flex justify-center mt-6">
                <Button onClick={handleLoadMore} variant="outline" className="w-full sm:w-auto" disabled={isLoadingMore}>
                  और खबरें देखें
                </Button>
              </div>
            )}
          </main>
          <Sidebar currentContent={currentContent} language={language} selectedCategory={categoryKey} onSelectCategory={handleCategorySelect} trendingTopics={trendingDbTopics} email={email} setEmail={setEmail} handleSubscribe={handleSubscribe} />
        </div>
      </div>

      <Footer currentContent={currentContent} onNavigate={() => {}} onSelectCategory={handleCategorySelect} />

      <AuthModal isOpen={isAuthModalOpen} setIsOpen={setIsAuthModalOpen} />

      {canUpload && (
        <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 pb-[env(safe-area-inset-bottom)]">
          <motion.div
            initial={{ scale: 0, y: 50 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
            <Button onClick={handleUploadClick} size="lg" className="rounded-full shadow-2xl btn-gradient w-14 h-14 sm:w-16 sm:h-16 touch-manipulation" aria-label="Upload Content">
              <Plus className="h-6 w-6 sm:h-8 sm:w-8" />
            </Button>
          </motion.div>
        </div>
      )}

      {canUpload && (
        <ArticleUploader
          isOpen={isUploaderOpen}
          setIsOpen={setIsUploaderOpen}
          onUploadSuccess={handleUploadSuccess}
          currentContent={currentContent}
          categories={categories}
        />
      )}
    </>
  );
};

export default CategoryPage;
