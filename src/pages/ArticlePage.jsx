import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { supabase } from '@/lib/customSupabaseClient.js';
import { toast } from '@/components/ui/use-toast';
import { contentData } from '@/lib/data';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ArticleDetail from '@/components/news/ArticleDetail';
import ArticleUploader from '@/components/admin/ArticleUploader.jsx';
import { Loader2 } from 'lucide-react';

const ArticlePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);

  const language = 'hi';
  const currentContent = contentData[language];
  const baseUrl = window.location.origin;

  const fetchArticle = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('articles')
      .select('id,title_hi,excerpt_hi,content_hi,category,author,location,published_at,updated_at,image_url,image_alt_text_hi,seo_title_hi,seo_keywords_hi,video_url')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching article:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Could not load the article.',
        variant: 'destructive',
      });
      navigate('/');
    } else {
      setArticle(data);
    }
    setIsLoading(false);
  }, [id, navigate]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setDarkMode(savedTheme === 'dark');
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    fetchArticle();
  }, [fetchArticle]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newMode);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleArticleSelect = (selectedArticle) => {
    navigate(`/article/${selectedArticle.id}`);
  };

  const handleEditArticle = (articleToEdit) => {
    if (canEdit) {
      setEditingArticle(articleToEdit);
      setIsUploaderOpen(true);
    } else {
      toast({
        title: 'Admin Access Required',
        description: 'Please log in as an admin to edit articles.',
      });
    }
  };

  const handleUploadSuccess = () => {
    setIsUploaderOpen(false);
    setEditingArticle(null);
    fetchArticle();
  };

  const categories = Object.entries(currentContent.categories);

  const getTranslatedArticle = (articleToTranslate) => {
    if (!articleToTranslate) return null;
    return {
      ...articleToTranslate,
      title: articleToTranslate.title_hi || currentContent.notAvailable || 'उपलब्ध नहीं',
      excerpt: articleToTranslate.excerpt_hi || '',
      content: articleToTranslate.content_hi || '',
      image_alt_text: articleToTranslate.image_alt_text_hi || articleToTranslate.title_hi || currentContent.notAvailable || 'उपलब्ध नहीं',
      seo_title: articleToTranslate.seo_title_hi || articleToTranslate.title_hi,
      seo_keywords: articleToTranslate.seo_keywords_hi || '',
    };
  };

  const canEdit =
    user?.email === 'pushkarraj207@gmail.com' ||
    ['admin', 'superuser'].includes(profile?.role);

  return (
    <>
      <Header currentContent={currentContent} language={language} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogoClick={handleBackToHome} />
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[60vh]">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
        ) : article ? (
          <ArticleDetail
            article={getTranslatedArticle(article)}
            onBack={handleBackToHome}
            currentContent={currentContent}
            onEdit={canEdit ? () => handleEditArticle(article) : undefined}
            baseUrl={baseUrl}
            language={language}
            onArticleSelect={handleArticleSelect}
          />
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-2">Article not found</h2>
            <p>The article you are looking for does not exist.</p>
          </div>
        )}
      </div>
      <Footer currentContent={currentContent} onNavigate={() => {}} onSelectCategory={() => {}} />

      {canEdit && (
        <ArticleUploader
          isOpen={isUploaderOpen}
          setIsOpen={setIsUploaderOpen}
          onUploadSuccess={handleUploadSuccess}
          currentContent={currentContent}
          categories={categories}
          article={editingArticle}
        />
      )}
    </>
  );
};

export default ArticlePage;
