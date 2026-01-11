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
  const [articles, setArticles] = useState([]);
  const [trendingDbTopics, setTrendingDbTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [activeLegalPage, setActiveLegalPage] = useState(null);

  const baseUrl = window.location.origin;

  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching articles:', error);
      toast({
        title: 'Error Fetching News',
        description: 'Could not load articles from the database.',
        variant: 'destructive',
      });
      setArticles([]);
    } else {
      setArticles(data);
    }
    setIsLoading(false);
  }, []);

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
      content: article.content_hi || '',
      image_alt_text: article.image_alt_text_hi || article.title_hi || currentContent.notAvailable || 'उपलब्ध नहीं',
    };
  };

  const translatedArticles = useMemo(() => articles.map(getTranslatedArticle), [articles]);
  const breakingNews = useMemo(() => translatedArticles.filter(a => a.is_breaking).slice(0, 5), [translatedArticles]);
  const featuredArticle = useMemo(() => translatedArticles.find(a => a.is_featured) || translatedArticles[0], [translatedArticles]);
  const otherArticles = useMemo(() => translatedArticles.filter(a => a.id !== featuredArticle?.id), [translatedArticles, featuredArticle]);

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
        <FeaturedArticleHero article={featuredArticle} content={currentContent} onReadMore={() => handleArticleSelect(featuredArticle)} />
        <ArticleGrid articles={otherArticles} content={currentContent} onArticleClick={handleArticleSelect} />
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
