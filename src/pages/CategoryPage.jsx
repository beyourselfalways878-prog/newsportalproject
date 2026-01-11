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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const baseUrl = window.location.origin;

  const PAGE_SIZE = 24;

  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    const from = 0;
    const to = PAGE_SIZE - 1;

    let query = supabase
      .from('articles')
      .select('id,title_hi,excerpt_hi,content_hi,category,is_breaking,is_featured,image_url,image_alt_text_hi,author,location,published_at,updated_at,views,time_ago,seo_title_hi,seo_keywords_hi,video_url')
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
      setPage(1);
      setHasMore((data?.length || 0) === PAGE_SIZE);
    }
    setIsLoading(false);
  }, [categoryKey]);

  const fetchMoreNews = useCallback(async () => {
    if (isLoading || !hasMore) return;
    const nextPage = page + 1;
    const from = (nextPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('articles')
      .select('id,title_hi,excerpt_hi,content_hi,category,is_breaking,is_featured,image_url,image_alt_text_hi,author,location,published_at,updated_at,views,time_ago,seo_title_hi,seo_keywords_hi,video_url')
      .order('published_at', { ascending: false })
      .range(from, to);
    if (categoryKey) {
      query = query.eq('category', categoryKey);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching more articles:', error);
      setHasMore(false);
      return;
    }

    setArticles((prev) => [...prev, ...(data || [])]);
    setPage(nextPage);
    setHasMore((data?.length || 0) === PAGE_SIZE);
  }, [categoryKey, hasMore, isLoading, page]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setDarkMode(savedTheme === 'dark');
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    document.documentElement.lang = 'hi';
    fetchNews();
    fetchTrendingTopics();
  }, [fetchNews]);

  const fetchTrendingTopics = async () => {
    const { data, error } = await supabase
      .from('trending_topics')
      .select('*')
      .order('rank', { ascending: true });

    if (error) {
      console.error('Error fetching trending topics:', error);
    } else {
      setTrendingDbTopics(data);
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
      content: article.content_hi || '',
      image_alt_text: article.image_alt_text_hi || article.title_hi || currentContent.notAvailable || 'उपलब्ध नहीं',
    };
  };

  const translatedArticles = useMemo(() => articles.map(getTranslatedArticle), [articles]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      );
    }
    return (
      <div className="space-y-12">
        <ArticleGrid articles={translatedArticles} content={currentContent} onArticleClick={handleArticleSelect} />
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
        <meta property="og:image" content={`${baseUrl}/logo-social.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`${baseUrl}/logo-social.png`} />
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
                <Button onClick={fetchMoreNews} variant="outline" className="w-full sm:w-auto">
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
