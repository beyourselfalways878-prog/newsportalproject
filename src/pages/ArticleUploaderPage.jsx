import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { contentData } from '@/lib/data';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Loader2, FileText, Image as ImageIcon, Zap, Youtube, ArrowLeft, Save, X } from 'lucide-react';

let mammothPromise;
const getMammoth = () => {
  if (!mammothPromise) {
    mammothPromise = import('mammoth').then((m) => m.default ?? m);
  }
  return mammothPromise;
};

const ArticleUploaderPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const articleId = searchParams.get('id');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(!!articleId);
  const [articleData, setArticleData] = useState({
    title_hi: '', excerpt_hi: '',
    category: 'indian', author: '', location: '', is_breaking: false,
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

  // Load article for editing
  useEffect(() => {
    if (articleId) {
      const fetchArticle = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('articles')
          .select('id,title_hi,excerpt_hi,content_hi,category,author,location,is_breaking,published_at,image_alt_text_hi,seo_title_hi,seo_keywords_hi,video_url,image_url')
          .eq('id', articleId)
          .single();
        
        if (error) {
          toast({ title: 'Error', description: 'Failed to load article', variant: 'destructive' });
          navigate('/dashboard');
        } else if (data) {
          setArticleData({
            id: data.id,
            title_hi: data.title_hi || '',
            excerpt_hi: data.excerpt_hi || '',
            category: data.category || 'indian',
            author: data.author || '',
            location: data.location || '',
            is_breaking: data.is_breaking || false,
            published_at: data.published_at,
            image_alt_text_hi: data.image_alt_text_hi || '',
            seo_title_hi: data.seo_title_hi || '',
            seo_keywords_hi: data.seo_keywords_hi || '',
            video_url: data.video_url || '',
          });
          setContentHtml(data.content_hi || '');
          setFeaturedImageUrl(data.image_url || '');
        }
        setIsLoading(false);
      };
      fetchArticle();
    }
  }, [articleId, navigate, toast]);

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

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    toast({ title: 'Processing...', description: 'Converting .docx file...' });

    try {
      const mammoth = await getMammoth();
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
          const fileName = `articles/${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('article-images')
            .upload(fileName, blob, { contentType: image.contentType });

          if (uploadError) {
            throw new Error(`Image upload failed: ${uploadError.message}`);
          }

          const { data: urlData } = supabase.storage
            .from('article-images')
            .getPublicUrl(uploadData.path);

          return { src: urlData.publicUrl };
        })
      };

      const { value: html } = await mammoth.convert({ arrayBuffer: await file.arrayBuffer() }, options);
      const firstImageUrl = html.match(/<img src="(.*?)"/)?.[1] || '';

      setContentHtml(html);
      setFeaturedImageUrl(prev => prev || firstImageUrl);

      toast({ title: 'Conversion Successful', description: 'Please fill in the remaining details.' });
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

    let finalImageUrl = articleData.id ? featuredImageUrl : featuredImageUrl;

    if (featuredImageFile) {
      const fileName = `featured/${Date.now()}-${featuredImageFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(fileName, featuredImageFile, { upsert: !!articleData.id });

      if (uploadError) {
        toast({ title: "Image Upload Error", description: uploadError.message, variant: "destructive" });
        setIsProcessing(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('article-images').getPublicUrl(uploadData.path);
      finalImageUrl = urlData.publicUrl;
    }

    try {
      const finalData = {
        ...articleData,
        content_hi: contentHtml,
        image_url: finalImageUrl,
        published_at: articleData.id ? articleData.published_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      delete finalData.created_at;

      const { error } = await supabase.from('articles').upsert(finalData);
      if (error) throw error;

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
        toggleDarkMode={() => {}} 
        onLogoClick={handleBackToHome} 
      />
      
      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleCancel}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {articleId ? 'लेख संपादित करें' : 'नया लेख अपलोड करें'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {articleId ? 'Edit Article' : 'Upload New Article'}
              </p>
            </div>
          </div>
          
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
              <span className="hidden sm:inline">सहेजें और प्रकाशित करें</span>
              <span className="sm:hidden">Save</span>
            </Button>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
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

                {/* DOCX Import */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">.docx से आयात करें (Import from .docx)</Label>
                  <label htmlFor="docx-upload" className="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:border-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <FileText className="h-10 w-10 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">क्लिक करें या फ़ाइल खींचें</span>
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
                सहेजें
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer currentContent={currentContent} onNavigate={() => {}} onSelectCategory={() => {}} />
    </div>
  );
};

export default ArticleUploaderPage;
