import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { createArticle, uploadImage } from '@/lib/db.js';
import { contentData } from '@/lib/data.js';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Loader2, FileText, Image as ImageIcon, Zap, Youtube, ArrowLeft, Save, X, Upload, CheckCircle2, Eye, Sparkles } from 'lucide-react';

let mammothPromise;
const getMammoth = () => {
  if (!mammothPromise) {
    mammothPromise = import('mammoth').then((m) => m.default ?? m);
  }
  return mammothPromise;
};

// Category detection keywords
const categoryKeywords = {
  politics: ['राजनीति', 'चुनाव', 'सरकार', 'मंत्री', 'प्रधानमंत्री', 'संसद', 'विधानसभा', 'नेता', 'पार्टी', 'भाजपा', 'कांग्रेस', 'election', 'government', 'minister', 'parliament'],
  sports: ['खेल', 'क्रिकेट', 'फुटबॉल', 'हॉकी', 'टेनिस', 'ओलंपिक', 'खिलाड़ी', 'मैच', 'टूर्नामेंट', 'विजेता', 'cricket', 'football', 'sports', 'match', 'player'],
  technology: ['तकनीक', 'प्रौद्योगिकी', 'स्मार्टफोन', 'इंटरनेट', 'एआई', 'कंप्यूटर', 'सॉफ्टवेयर', 'ऐप', 'गूगल', 'एप्पल', 'technology', 'AI', 'software', 'app', 'digital'],
  entertainment: ['मनोरंजन', 'बॉलीवुड', 'फिल्म', 'सिनेमा', 'अभिनेता', 'अभिनेत्री', 'गायक', 'संगीत', 'सीरीज', 'ओटीटी', 'bollywood', 'movie', 'actor', 'music', 'entertainment'],
  business: ['व्यापार', 'बाजार', 'शेयर', 'अर्थव्यवस्था', 'निवेश', 'कंपनी', 'स्टार्टअप', 'बैंक', 'रुपया', 'डॉलर', 'business', 'market', 'economy', 'investment', 'company'],
  health: ['स्वास्थ्य', 'चिकित्सा', 'डॉक्टर', 'अस्पताल', 'बीमारी', 'दवा', 'वैक्सीन', 'कोविड', 'उपचार', 'health', 'medical', 'doctor', 'hospital', 'medicine'],
  international: ['अंतरराष्ट्रीय', 'विदेश', 'अमेरिका', 'चीन', 'पाकिस्तान', 'रूस', 'यूरोप', 'संयुक्त राष्ट्र', 'international', 'USA', 'China', 'world', 'global'],
  indian: ['भारत', 'देश', 'राष्ट्रीय', 'केंद्र', 'राज्य', 'दिल्ली', 'मुंबई', 'india', 'national', 'delhi', 'mumbai'],
};

// Extract keywords from text
const extractKeywords = (text) => {
  if (!text) return '';
  const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = cleanText.split(' ').filter(w => w.length > 3);
  const wordFreq = {};
  words.forEach(word => {
    const clean = word.replace(/[^\u0900-\u097F\w]/g, '').toLowerCase();
    if (clean.length > 3) wordFreq[clean] = (wordFreq[clean] || 0) + 1;
  });
  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([w]) => w)
    .join(', ');
};

// Detect category from content
const detectCategory = (text) => {
  if (!text) return 'indian';
  const lowerText = text.toLowerCase();
  let maxScore = 0;
  let detectedCategory = 'indian';

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    const score = keywords.filter(kw => lowerText.includes(kw.toLowerCase())).length;
    if (score > maxScore) {
      maxScore = score;
      detectedCategory = category;
    }
  }
  return detectedCategory;
};

// Extract title from HTML (first h1, h2, or strong text)
const extractTitle = (html) => {
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match) return h1Match[1].replace(/<[^>]*>/g, '').trim();

  const h2Match = html.match(/<h2[^>]*>(.*?)<\/h2>/i);
  if (h2Match) return h2Match[1].replace(/<[^>]*>/g, '').trim();

  const strongMatch = html.match(/<strong[^>]*>(.*?)<\/strong>/i);
  if (strongMatch) return strongMatch[1].replace(/<[^>]*>/g, '').trim();

  const firstP = html.match(/<p[^>]*>(.*?)<\/p>/i);
  if (firstP) {
    const text = firstP[1].replace(/<[^>]*>/g, '').trim();
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  }
  return '';
};

// Extract excerpt from HTML (first meaningful paragraph)
const extractExcerpt = (html, title) => {
  const paragraphs = html.match(/<p[^>]*>(.*?)<\/p>/gi) || [];
  for (const p of paragraphs) {
    const text = p.replace(/<[^>]*>/g, '').trim();
    if (text.length > 50 && text !== title) {
      return text.length > 200 ? text.substring(0, 200) + '...' : text;
    }
  }
  return '';
};

const ArticleUploaderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const articleId = searchParams.get('id');
  const articleFromState = location.state?.article;
  const { user, profile, token } = useAuth();

  const [currentStep, setCurrentStep] = useState((articleId || articleFromState) ? 2 : 1); // 1: Upload, 2: Review, 3: Published
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(!!articleId);
  const [extractedImages, setExtractedImages] = useState([]);
  const [articleData, setArticleData] = useState({
    title_hi: '', excerpt_hi: '',
    category: 'indian', author: profile?.full_name || user?.email || '', location: '', is_breaking: false,
    image_alt_text_hi: '',
    seo_title_hi: '',
    seo_keywords_hi: '',
    video_url: '',
  });
  const [contentHtml, setContentHtml] = useState('');
  const [featuredImageFile, setFeaturedImageFile] = useState(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');

  const { toast } = useToast();
  const language = 'hi';
  const currentContent = contentData[language];

  const categories = Object.entries(currentContent.categories).filter(([key]) => key !== 'all');

  const formatError = (err) => {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    const parts = [err.message, err.details, err.hint, err.code].filter(Boolean);
    return parts.join(' — ');
  };

  // Auto-populate author field with user profile
  useEffect(() => {
    if (profile?.full_name || user?.email) {
      setArticleData(prev => ({
        ...prev,
        author: profile?.full_name || user?.email || prev.author
      }));
    }
  }, [profile?.full_name, user?.email]);

  // Load article for editing (from state or URL)
  useEffect(() => {
    const loadArticle = async () => {
      let articleToLoad = null;

      if (articleFromState) {
        // Article passed via navigation state
        articleToLoad = articleFromState;
      } else if (articleId) {
        // Article ID from URL parameters
        try {
          const response = await fetch(`/api/articles/${articleId}`);
          const json = await response.json();
          if (json.success) {
            articleToLoad = json.data;
          } else {
            throw new Error(json.error);
          }
        } catch (error) {
          console.error('Error loading article:', error);
          toast({
            title: 'Error',
            description: 'Failed to load article for editing',
            variant: 'destructive'
          });
          navigate('/dashboard');
          return;
        }
      }

      if (articleToLoad) {
        setArticleData({
          id: articleToLoad.id,
          title_hi: articleToLoad.title_hi || '',
          excerpt_hi: articleToLoad.excerpt_hi || '',
          category: articleToLoad.category || 'indian',
          author: articleToLoad.author || '',
          location: articleToLoad.location || '',
          is_breaking: articleToLoad.is_breaking || false,
          image_alt_text_hi: articleToLoad.image_alt_text_hi || '',
          seo_title_hi: articleToLoad.seo_title_hi || '',
          seo_keywords_hi: articleToLoad.seo_keywords_hi || '',
          video_url: articleToLoad.video_url || '',
        });
        setContentHtml(articleToLoad.content_hi || '');
        setFeaturedImageUrl(articleToLoad.image_url || '');
      }

      setIsLoading(false);
    };

    if (articleFromState || articleId) {
      loadArticle();
    } else {
      setIsLoading(false);
    }
  }, [articleFromState, articleId, navigate, toast]);

  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  // Ensure a minimal profile row exists in the DB so RLS/storage policies allow uploads/inserts.
  const ensureProfileExists = async () => {
    // Mock implementation or replace with API call if needed
    // With Firebase / API approach, profile creation is handled at registration.
    // We can just check local auth state.
    if (!user) {
      toast({ title: 'Login required', description: 'Please sign in to upload articles', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);

    const profileOk = await ensureProfileExists();
    if (!profileOk) {
      setIsProcessing(false);
      return;
    }

    toast({ title: 'स्मार्ट प्रोसेसिंग...', description: 'AI द्वारा .docx फ़ाइल विश्लेषण हो रहा है...' });

    try {
      const mammoth = await getMammoth();
      const uploadedImages = [];

      const options = {
        transformDocument: mammoth.transforms.paragraph((paragraph) => {
          let newChildren = [];
          paragraph.children.forEach(child => {
            if (child.type === 'run' && child.children) {
              child.children.forEach(runChild => {
                if (runChild.type === 'hyperlink') {
                  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
                  const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/;
                  const youtubeMatch = runChild.href.match(youtubeRegex);
                  const vimeoMatch = runChild.href.match(vimeoRegex);

                  if (youtubeMatch || vimeoMatch) {
                    let iframeHtml;
                    if (youtubeMatch) {
                      iframeHtml = `<iframe src="https://www.youtube.com/embed/${youtubeMatch[1]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                      // Auto-fill video URL
                      setArticleData(prev => ({ ...prev, video_url: iframeHtml }));
                    } else {
                      iframeHtml = `<iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
                    }
                    newChildren.push({ type: 'text', value: `<div>${iframeHtml}</div>` });
                  } else {
                    newChildren.push(child);
                  }
                } else {
                  newChildren.push(child);
                }
              });
            } else {
              newChildren.push(child);
            }
          });
          paragraph.children = newChildren;
          return paragraph;
        }),
        convertImage: mammoth.images.imgElement(async (image) => {
          const imageBuffer = await image.read("base64");
          const blob = dataURItoBlob(`data:${image.contentType};base64,${imageBuffer}`);
          // Mock file object for uploadImage function
          const file = new File([blob], `image-${Date.now()}.png`, { type: image.contentType });

          const response = await uploadImage(file, token); // Use API

          uploadedImages.push(response.url);
          return { src: response.url };
        })
      };

      const { value: html } = await mammoth.convert({ arrayBuffer: await file.arrayBuffer() }, options);

      // Extract all data from the document
      const extractedTitle = extractTitle(html);
      const extractedExcerpt = extractExcerpt(html, extractedTitle);
      const detectedCategory = detectCategory(html);
      const keywords = extractKeywords(html);
      const firstImageUrl = uploadedImages[0] || html.match(/<img src="(.*?)"/)?.[1] || '';

      // Store extracted images
      setExtractedImages(uploadedImages);

      // Auto-fill all fields
      setContentHtml(html);
      setFeaturedImageUrl(firstImageUrl);
      setArticleData(prev => ({
        ...prev,
        title_hi: extractedTitle || prev.title_hi,
        excerpt_hi: extractedExcerpt || prev.excerpt_hi,
        category: detectedCategory,
        seo_title_hi: extractedTitle || prev.seo_title_hi,
        seo_keywords_hi: keywords || prev.seo_keywords_hi,
        image_alt_text_hi: extractedTitle ? `${extractedTitle} की तस्वीर` : prev.image_alt_text_hi,
      }));

      // Move to review step
      setCurrentStep(2);

      toast({
        title: '✨ स्मार्ट एक्सट्रैक्शन पूर्ण!',
        description: `शीर्षक, अंश, ${uploadedImages.length} छवियां, और SEO कीवर्ड स्वचालित रूप से भरे गए।`
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({ variant: 'destructive', title: 'Conversion Failed', description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setArticleData(prev => ({ ...prev, [id]: value }));
  };

  const handleFeaturedImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFeaturedImageFile(file);
      setFeaturedImageUrl(URL.createObjectURL(file));
    }
  };

  const handleCategoryChange = (value) => {
    setArticleData(prev => ({ ...prev, category: value }));
  };

  const handleCheckboxChange = (checked) => {
    setArticleData(prev => ({ ...prev, is_breaking: checked }));
  };

  const handleSave = async () => {
    if (!articleData.title_hi) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    n    // Ensure profile exists so RLS and storage policies allow the uploads/inserts
    const profileOk = await ensureProfileExists();
    if (!profileOk) {
      setIsProcessing(false);
      return;
    }

    // Temporarily skip role check for testing
    // if (!token) {
    //   toast({ title: 'Login required', description: 'Your session has expired. Please log in again.', variant: 'destructive' });
    //   setIsProcessing(false);
    //   return;
    // }

    let finalImageUrl = articleData.id ? featuredImageUrl : featuredImageUrl;

    if (featuredImageFile) {
      try {
        const response = await uploadImage(featuredImageFile, token);
        finalImageUrl = response.url;
      } catch (uploadError) {
        toast({ title: "Image Upload Error", description: uploadError.message, variant: "destructive" });
        setIsProcessing(false);
        return;
      }
    }

    try {
      const finalData = {
        ...articleData,
        content_hi: contentHtml,
        image_url: finalImageUrl,
      };

      console.log('Final data to save:', finalData);

      const res = await createArticle(finalData, token);
      console.log(`Create result:`, res);

      toast({ title: articleData.id ? 'Article Updated!' : 'Article Published!' });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving article:', error);
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToHome = () => navigate('/');
  const handleCancel = () => navigate('/dashboard');
  const handleBackToUpload = () => setCurrentStep(1);

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
        <Upload className="h-4 w-4" />
        <span className="text-sm font-medium hidden sm:inline">अपलोड</span>
      </div>
      <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-primary' : 'bg-gray-300'}`} />
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
        <Eye className="h-4 w-4" />
        <span className="text-sm font-medium hidden sm:inline">समीक्षा</span>
      </div>
      <div className={`w-8 h-0.5 ${currentStep >= 3 ? 'bg-primary' : 'bg-gray-300'}`} />
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentStep >= 3 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm font-medium hidden sm:inline">प्रकाशित</span>
      </div>
    </div>
  );

  // Step 1: Upload DOCX
  const UploadStep = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="max-w-lg w-full text-center">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            स्मार्ट आर्टिकल अपलोडर
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            बस अपनी .docx फ़ाइल अपलोड करें - AI स्वचालित रूप से सभी फ़ील्ड भर देगा!
          </p>
        </div>

        <label
          htmlFor="docx-upload-main"
          className={`block w-full p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer
            ${isProcessing
              ? 'border-primary bg-primary/5 cursor-wait'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-primary/5'
            }`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-lg font-medium text-primary">AI विश्लेषण जारी है...</p>
              <p className="text-sm text-gray-500 mt-2">शीर्षक, छवियां, और कीवर्ड निकाले जा रहे हैं</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                .docx फ़ाइल यहाँ ड्रॉप करें
              </p>
              <p className="text-sm text-gray-500 mt-2">या क्लिक करके चुनें</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Auto Title
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Auto Images
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Auto SEO
                </span>
              </div>
            </div>
          )}
          <input
            id="docx-upload-main"
            type="file"
            className="sr-only"
            accept=".docx"
            onChange={handleFileChange}
            disabled={isProcessing}
          />
        </label>

        <div className="mt-6 text-sm text-gray-500">
          <p>समर्थित प्रारूप: Microsoft Word (.docx)</p>
        </div>

        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={() => setCurrentStep(2)}>
            मैन्युअल एंट्री करें →
          </Button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="admin-page flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="admin-page min-h-screen bg-white dark:bg-gray-900">
      <Helmet>
        <title>{articleId ? 'Edit Article' : 'New Article'} | 24x7 Indian News</title>
      </Helmet>

      <Header
        currentContent={currentContent}
        language={language}
        darkMode={false}
        toggleDarkMode={() => { }}
        onLogoClick={handleBackToHome}
      />

      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={currentStep === 1 ? handleCancel : handleBackToUpload}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {articleId ? 'लेख संपादित करें' : 'नया लेख अपलोड करें'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {articleId ? 'Edit Article' : 'Smart Article Uploader'}
              </p>
            </div>
          </div>

          {currentStep === 2 && (
            <div className="flex gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isProcessing}
                className="flex-1 sm:flex-none"
              >
                <X className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">रद्द करें</span>
                <span className="sm:hidden">Cancel</span>
              </Button>
              <Button
                onClick={handleSave}
                disabled={isProcessing || !articleData.title_hi}
                className="flex-1 sm:flex-none"
              >
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                <span className="hidden sm:inline">प्रकाशित करें</span>
                <span className="sm:hidden">Publish</span>
              </Button>
            </div>
          )}
        </div>

        {/* Step Indicator */}
        <StepIndicator />

        {/* Step Content */}
        {currentStep === 1 && <UploadStep />}

        {currentStep === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Auto-extracted info banner */}
            {extractedImages.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                      ✨ स्मार्ट एक्सट्रैक्शन पूर्ण!
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {extractedImages.length} छवियां निकाली गईं • श्रेणी: {currentContent.categories[articleData.category] || articleData.category} • SEO कीवर्ड जनरेट किए गए
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">

              {/* Basic Info Section */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  मूल जानकारी (Basic Info)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="md:col-span-2">
                    <Label htmlFor="title_hi" className="text-sm font-medium">शीर्षक (Title) *</Label>
                    <Input
                      id="title_hi"
                      value={articleData.title_hi || ''}
                      onChange={handleInputChange}
                      required
                      className="mt-1.5"
                      placeholder="लेख का शीर्षक दर्ज करें"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="excerpt_hi" className="text-sm font-medium">अंश (Excerpt)</Label>
                    <Textarea
                      id="excerpt_hi"
                      value={articleData.excerpt_hi || ''}
                      onChange={handleInputChange}
                      className="mt-1.5 min-h-[80px]"
                      placeholder="लेख का संक्षिप्त विवरण"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-sm font-medium">श्रेणी (Category)</Label>
                    <Select onValueChange={handleCategoryChange} value={articleData.category || 'indian'}>
                      <SelectTrigger id="category" className="mt-1.5 bg-white dark:bg-gray-800">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border shadow-lg max-h-60">
                        {categories.map(([key, value]) => (
                          <SelectItem key={key} value={key} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="author" className="text-sm font-medium">लेखक (Author)</Label>
                    <Input
                      id="author"
                      value={articleData.author || ''}
                      onChange={handleInputChange}
                      className="mt-1.5"
                      placeholder="लेखक का नाम"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location" className="text-sm font-medium">स्थान (Location)</Label>
                    <Input
                      id="location"
                      value={articleData.location || ''}
                      onChange={handleInputChange}
                      className="mt-1.5"
                      placeholder="समाचार का स्थान"
                    />
                  </div>
                  <div className="flex items-center h-full pt-6">
                    <div className="flex items-center space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <Checkbox
                        id="is_breaking"
                        checked={articleData.is_breaking}
                        onCheckedChange={handleCheckboxChange}
                      />
                      <Label htmlFor="is_breaking" className="flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400 cursor-pointer">
                        <Zap className="h-4 w-4" /> ब्रेकिंग न्यूज़
                      </Label>
                    </div>
                  </div>
                </div>
              </section>

              {/* Media Section */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  मीडिया (Media)
                </h2>

                {/* Extracted Images Gallery */}
                {extractedImages.length > 0 && (
                  <div className="mb-6">
                    <Label className="text-sm font-medium mb-3 block">डॉक्यूमेंट से निकाली गई छवियां (Extracted Images) - क्लिक करके फीचर्ड इमेज चुनें</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {extractedImages.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          onClick={() => setFeaturedImageUrl(imgUrl)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105
                          ${featuredImageUrl === imgUrl
                              ? 'border-primary ring-2 ring-primary ring-offset-2'
                              : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                            }`}
                        >
                          <img src={imgUrl} alt={`Extracted ${idx + 1}`} className="w-full h-full object-cover" />
                          {featuredImageUrl === imgUrl && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <CheckCircle2 className="h-6 w-6 text-white drop-shadow-lg" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Featured Image */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">फीचर्ड इमेज (Featured Image)</Label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="w-full sm:w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600">
                        {featuredImageUrl ? (
                          <img src={featuredImageUrl} alt="Featured preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="h-10 w-10 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 w-full sm:w-auto">
                        <label htmlFor="featured-image-upload" className="cursor-pointer inline-flex items-center justify-center w-full sm:w-auto rounded-lg bg-primary text-primary-foreground text-sm font-medium px-4 py-2.5 hover:bg-primary/90 transition-colors">
                          <ImageIcon className="h-4 w-4 mr-2" />
                          छवि चुनें
                          <input id="featured-image-upload" type="file" className="sr-only" accept="image/*" onChange={handleFeaturedImageChange} />
                        </label>
                        <p className="text-xs text-gray-500 mt-2">PNG, JPG, WebP (Max 5MB)</p>
                      </div>
                    </div>
                  </div>

                  {/* Re-import DOCX */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">नई .docx फ़ाइल अपलोड करें</Label>
                    <label htmlFor="docx-upload" className="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:border-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <FileText className="h-10 w-10 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">दूसरी फ़ाइल अपलोड करें</span>
                      <span className="text-xs text-gray-500 mt-1">DOCX (Max 10MB)</span>
                      <input id="docx-upload" type="file" className="sr-only" accept=".docx" onChange={handleFileChange} disabled={isProcessing} />
                    </label>
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="image_alt_text_hi" className="text-sm font-medium">छवि ऑल्ट टेक्स्ट (Image Alt Text)</Label>
                  <Input
                    id="image_alt_text_hi"
                    value={articleData.image_alt_text_hi || ''}
                    onChange={handleInputChange}
                    placeholder="उदा., प्रधानमंत्री भाषण देते हुए"
                    className="mt-1.5"
                  />
                </div>
              </section>

              {/* Video & SEO Section */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  वीडियो और एसईओ (Video & SEO)
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="video_url" className="flex items-center gap-2 text-sm font-medium">
                      <Youtube className="h-4 w-4 text-red-500" /> वीडियो एम्बेड कोड
                    </Label>
                    <Textarea
                      id="video_url"
                      value={articleData.video_url || ''}
                      onChange={handleInputChange}
                      placeholder="यहां वीडियो iframe एम्बेड कोड पेस्ट करें"
                      className="mt-1.5 font-mono text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="seo_title_hi" className="text-sm font-medium">एसईओ शीर्षक (SEO Title)</Label>
                      <Input
                        id="seo_title_hi"
                        value={articleData.seo_title_hi || ''}
                        onChange={handleInputChange}
                        placeholder="कीवर्ड-युक्त शीर्षक"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo_keywords_hi" className="text-sm font-medium">एसईओ कीवर्ड (SEO Keywords)</Label>
                      <Input
                        id="seo_keywords_hi"
                        value={articleData.seo_keywords_hi || ''}
                        onChange={handleInputChange}
                        placeholder="उदा., राजनीति, चुनाव, भारत"
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Content Preview Section */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  लेख सामग्री (Content Preview)
                </h2>
                <div
                  className="w-full min-h-[200px] md:min-h-[300px] rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6 bg-gray-50 dark:bg-gray-800 prose dark:prose-invert max-w-none overflow-auto"
                  dangerouslySetInnerHTML={{ __html: contentHtml || '<p class="text-gray-500 italic">.docx आयात के बाद सामग्री यहां दिखाई देगी।</p>' }}
                />
              </section>
            </div>

            {/* Sticky Footer Actions (Mobile) */}
            <div className="sticky bottom-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  रद्द करें
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isProcessing || !articleData.title_hi}
                  className="flex-1"
                >
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  प्रकाशित करें
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer currentContent={currentContent} onNavigate={() => { }} onSelectCategory={() => { }} />
    </div>
  );
};

export default ArticleUploaderPage;
