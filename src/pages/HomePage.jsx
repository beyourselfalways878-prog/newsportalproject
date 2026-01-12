import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import LegalPage from '@/components/legal/LegalPage';
import AuthModal from '@/components/admin/AuthModal.jsx';
import ArticleUploader from '@/components/admin/ArticleUploader.jsx';
import BreakingNewsBar from '@/components/news/BreakingNewsBar';
import FeaturedArticleHero from '@/components/news/FeaturedArticleHero';
import ArticleGrid from '@/components/news/ArticleGrid';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { contentData } from '@/lib/data';
import { supabase } from '@/lib/customSupabaseClient.js';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const language = 'hi';
  const [darkMode, setDarkMode] = useState(false);
  const [email, setEmail] = useState('');
  const [featuredArticle, setFeaturedArticle] = useState(null);
  const [articles, setArticles] = useState([]);
  const [trendingDbTopics, setTrendingDbTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [activeLegalPage, setActiveLegalPage] = useState(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [nextFrom, setNextFrom] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const baseUrl = window.location.origin;

  const INITIAL_FETCH_SIZE = 11; // fetch a little extra so featured can be excluded while still showing 10
  const LOAD_MORE_SIZE = 10;

  const ARTICLES_CACHE_KEY = `home:${language}:articles:v1`;
  const TRENDING_CACHE_KEY = `home:${language}:trending:v1`;
  const CACHE_TTL_MS = 1000 * 60 * 3; // 3 minutes

  const listSelect =
    'id,title_hi,excerpt_hi,category,is_breaking,is_featured,image_url,image_alt_text_hi,author,location,published_at,updated_at,view_count,video_url';

  const fetchFeatured = useCallback(async () => {
    try {
      const queryPromise = supabase
        .from('articles')
        .select(listSelect)
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(1);

      const { data, error } = await queryPromise;

      if (error) {
        console.error('Error fetching featured article:', error);
        return null;
      }

      return data?.[0] ?? null;
    } catch (err) {
      console.error('Featured fetch error:', err);
      return null;
    }
  }, [listSelect]);

  const fetchNews = useCallback(async ({ showLoader = true } = {}) => {
    if (showLoader) setIsLoading(true);

    const from = 0;
    const to = INITIAL_FETCH_SIZE - 1;

    try {
      const [featured, latest] = await Promise.all([
        fetchFeatured(),
        supabase
          .from('articles')
          .select(listSelect)
          .order('published_at', { ascending: false })
          .range(from, to),
      ]);

      const { data, error } = latest;

      if (error) {
        console.error('Error fetching articles:', error);
        toast({
          title: 'Error Fetching News',
          description: 'Could not load articles from the database.',
          variant: 'destructive',
        });
        setFeaturedArticle(null);
        setArticles([]);
        setVisibleCount(10);
        setNextFrom(0);
        setHasMore(false);
        if (showLoader) setIsLoading(false);
        return;
      }

      console.log('Fetched articles data:', data); // Debug log

      const fallbackFeatured = data?.[0] ?? null;
      const finalFeatured = featured ?? fallbackFeatured;
      const filtered = (data || []).filter((a) => a?.id && a.id !== finalFeatured?.id);

      console.log('Featured article:', finalFeatured); // Debug log
      console.log('Filtered articles:', filtered); // Debug log

      setFeaturedArticle(finalFeatured);
      setArticles(filtered);
      setVisibleCount(10);
      setNextFrom(data?.length || 0);
      setHasMore((data?.length || 0) === INITIAL_FETCH_SIZE);

      try {
        sessionStorage.setItem(
          ARTICLES_CACHE_KEY,
          JSON.stringify({ ts: Date.now(), featured: finalFeatured, articles: filtered, nextFrom: data?.length || 0, hasMore: (data?.length || 0) === INITIAL_FETCH_SIZE })
        );
      } catch {
        // ignore cache write issues
      }

      if (showLoader) setIsLoading(false);
    } catch (err) {
      console.error('Unexpected error in fetchNews:', err);
      toast({
        title: 'Error Loading News',
        description: 'An unexpected error occurred while loading articles.',
        variant: 'destructive',
      });
      setFeaturedArticle(null);
      setArticles([]);
      setVisibleCount(10);
      setNextFrom(0);
      setHasMore(false);
      if (showLoader) setIsLoading(false);
    }
  }, [ARTICLES_CACHE_KEY, INITIAL_FETCH_SIZE, fetchFeatured, listSelect]);

  const fetchMoreNews = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const from = nextFrom;
    const to = from + LOAD_MORE_SIZE - 1;

    const { data, error } = await supabase
      .from('articles')
      .select(listSelect)
      .order('published_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching more articles:', error);
      setHasMore(false);
      setIsLoadingMore(false);
      return;
    }

    const filtered = (data || []).filter((a) => a?.id && a.id !== featuredArticle?.id);
    setArticles((prev) => [...prev, ...filtered]);
    setNextFrom(from + (data?.length || 0));
    setHasMore((data?.length || 0) === LOAD_MORE_SIZE);
    setIsLoadingMore(false);
  }, [LOAD_MORE_SIZE, featuredArticle?.id, hasMore, isLoadingMore, listSelect, nextFrom]);

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

    let isMounted = true;

    const loadData = async () => {
      // Fast path: render cached content immediately.
      try {
        const cached = JSON.parse(sessionStorage.getItem(ARTICLES_CACHE_KEY) || 'null');
        if (cached?.ts && Array.isArray(cached?.articles) && Date.now() - cached.ts < CACHE_TTL_MS) {
          if (isMounted) {
            setFeaturedArticle(cached.featured || null);
            setArticles(cached.articles);
            setVisibleCount(10);
            setNextFrom(typeof cached.nextFrom === 'number' ? cached.nextFrom : cached.articles.length);
            setHasMore(!!cached.hasMore);
            setIsLoading(false);
          }
          // Refresh in background
          fetchNews({ showLoader: false });
        } else {
          await fetchNews({ showLoader: true });
        }
      } catch {
        await fetchNews({ showLoader: true });
      }

      fetchTrendingTopics();
    };

    loadData();

    // Safety timeout - ensure loading is false after 10 seconds max
    const timeout = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 10000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, []);

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
      .select('name_hi,rank')
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

  const handleNavigate = (page) => {
    setActiveLegalPage(page);
    window.scrollTo(0, 0);
  };

  const handleCategorySelect = (categoryKey) => {
    if (categoryKey === 'all') {
      setActiveLegalPage(null);
      window.scrollTo(0, 0);
    } else {
      navigate(`/category/${categoryKey}`);
    }
  };

  const handleArticleSelect = (article) => {
    navigate(`/article/${article.id}`);
  };

  const handleBackToHome = () => {
    setActiveLegalPage(null);
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
      if (!user) {
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

  const translatedFeaturedArticle = useMemo(() => getTranslatedArticle(featuredArticle), [featuredArticle]);
  const translatedArticles = useMemo(() => articles.map(getTranslatedArticle), [articles]);
  const visibleArticles = useMemo(() => translatedArticles.slice(0, visibleCount), [translatedArticles, visibleCount]);
  const breakingNews = useMemo(() => {
    const all = [translatedFeaturedArticle, ...translatedArticles].filter(Boolean);
    return all.filter((a) => a.is_breaking).slice(0, 5);
  }, [translatedArticles, translatedFeaturedArticle]);

  const renderContent = () => {
    if (activeLegalPage) {
      return <LegalPage page={activeLegalPage} language={language} onBack={handleBackToHome} baseUrl={baseUrl} />;
    }
    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      );
    }
    return (
      <div className="space-y-12">
        <FeaturedArticleHero article={translatedFeaturedArticle} content={currentContent} onReadMore={() => handleArticleSelect(translatedFeaturedArticle)} />
        <div className="space-y-6">
          <ArticleGrid articles={visibleArticles} content={currentContent} onArticleClick={handleArticleSelect} />
          {!activeLegalPage && !isLoading && (hasMore || visibleCount < translatedArticles.length) && (
            <div className="flex justify-center">
              <Button onClick={handleLoadMore} variant="outline" className="w-full sm:w-auto" disabled={isLoadingMore}>
                और खबरें देखें
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const pageTitle = `${currentContent.siteName} | ${currentContent.tagline}`;
  const pageDescription = currentContent.siteDescription || 'भारत और दुनिया की 24x7 ख़बरों का आपका विश्वसनीय स्रोत';
  const generalKeywords = "भारत समाचार आज, आज की ताजा खबर, राष्ट्रीय समाचार, भाजपा, कांग्रेस, नवीनतम समाचार, ब्रेकिंग न्यूज";
  const canUpload = user?.email === 'pushkarraj207@gmail.com';

  return (
    <>
      <Helmet>
        <html lang={language} />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={generalKeywords} />
        <link rel="canonical" href={baseUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={baseUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${baseUrl}/social-card.svg`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`${baseUrl}/social-card.svg`} />
      </Helmet>

      <Header currentContent={currentContent} language={language} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogoClick={handleBackToHome} onLoginClick={handleLoginClick} />
      <BreakingNewsBar breakingNews={breakingNews} breakingText={currentContent.breaking} onArticleClick={handleArticleSelect} />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <main className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div key={activeLegalPage || 'list'} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </main>
          <Sidebar currentContent={currentContent} language={language} selectedCategory={'all'} onSelectCategory={handleCategorySelect} trendingTopics={trendingDbTopics} email={email} setEmail={setEmail} handleSubscribe={handleSubscribe} />
        </div>
      </div>

      <Footer currentContent={currentContent} onNavigate={handleNavigate} onSelectCategory={handleCategorySelect} />

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

export default HomePage;
