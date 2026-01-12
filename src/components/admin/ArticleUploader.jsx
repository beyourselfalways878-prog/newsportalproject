import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2, FileText, Image as ImageIcon, Zap, Youtube, CheckCircle2, Upload } from 'lucide-react';

let mammothPromise;
const getMammoth = () => {
  if (!mammothPromise) {
    mammothPromise = import('mammoth').then((m) => m.default ?? m);
  }
  return mammothPromise;
};

// Category mapping for flexible matching
const CATEGORY_MAP = {
  'indian': 'indian', 'india': 'indian', 'भारत': 'indian', 'देश': 'indian', 'national': 'indian',
  'world': 'world', 'international': 'world', 'विश्व': 'world', 'अंतरराष्ट्रीय': 'world',
  'politics': 'politics', 'राजनीति': 'politics', 'political': 'politics',
  'business': 'business', 'व्यापार': 'business', 'economy': 'business', 'अर्थव्यवस्था': 'business',
  'sports': 'sports', 'खेल': 'sports', 'sport': 'sports',
  'entertainment': 'entertainment', 'मनोरंजन': 'entertainment', 'bollywood': 'entertainment',
  'technology': 'technology', 'tech': 'technology', 'तकनीक': 'technology', 'टेक्नोलॉजी': 'technology',
  'health': 'health', 'स्वास्थ्य': 'health', 'medical': 'health',
  'education': 'education', 'शिक्षा': 'education',
  'auto': 'auto', 'automobile': 'auto', 'ऑटो': 'auto', 'गाड़ी': 'auto',
  'lifestyle': 'lifestyle', 'जीवनशैली': 'lifestyle',
  'crime': 'crime', 'अपराध': 'crime',
  'regional': 'regional', 'क्षेत्रीय': 'regional', 'state': 'regional',
};

const ArticleUploader = ({ isOpen, setIsOpen, onUploadSuccess, currentContent, categories, article }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [articleData, setArticleData] = useState({});
  const [contentHtml, setContentHtml] = useState('');
  const [featuredImageFile, setFeaturedImageFile] = useState(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [extractionStatus, setExtractionStatus] = useState(null); // null, 'success', 'partial'
  const [uploadedImagesCount, setUploadedImagesCount] = useState(0);

  const { toast } = useToast();
  const { profile } = useAuth();

  const formatSupabaseError = (err) => {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    const parts = [err.message, err.details, err.hint, err.code].filter(Boolean);
    return parts.join(' — ');
  };

  const resetForm = useCallback(() => {
    setArticleData({
      title_hi: '', excerpt_hi: '',
      category: 'indian', author: '', location: '', is_breaking: false,
      image_alt_text_hi: '',
      seo_title_hi: '',
      seo_keywords_hi: '',
      video_url: '',
    });
    setContentHtml('');
    setFeaturedImageUrl('');
    setFeaturedImageFile(null);
    setIsProcessing(false);
    setExtractionStatus(null);
    setUploadedImagesCount(0);
  }, []);

  useEffect(() => {
    if (article) {
      setArticleData({
        id: article.id,
        title_hi: article.title_hi || '',
        excerpt_hi: article.excerpt_hi || '',
        category: article.category || 'indian',
        author: article.author || '',
        location: article.location || '',
        is_breaking: article.is_breaking || false,
        published_at: article.published_at,
        image_alt_text_hi: article.image_alt_text_hi || '',
        seo_title_hi: article.seo_title_hi || '',
        seo_keywords_hi: article.seo_keywords_hi || '',
        video_url: article.video_url || '',
      });
      setContentHtml(article.content_hi || '');
      setFeaturedImageUrl(article.image_url || '');
    } else {
      resetForm();
    }
  }, [article, isOpen, resetForm]);

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

  // Parse metadata from DOCX content - supports flexible format
  const parseMetadataFromHtml = (html) => {
    const metadata = {
      title_hi: '',
      excerpt_hi: '',
      category: 'indian',
      author: '',
      location: '',
      is_breaking: false,
      image_alt_text_hi: '',
      seo_title_hi: '',
      seo_keywords_hi: '',
      video_url: '',
    };

    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const paragraphs = tempDiv.querySelectorAll('p');
    let metadataEndIndex = 0;
    let foundContentSeparator = false;

    // Field patterns to detect metadata lines
    const fieldPatterns = [
      { keys: ['title', 'शीर्षक', 'title_hi'], field: 'title_hi' },
      { keys: ['excerpt', 'अंश', 'सारांश', 'excerpt_hi'], field: 'excerpt_hi' },
      { keys: ['category', 'श्रेणी', 'कैटेगरी'], field: 'category', transform: (v) => CATEGORY_MAP[v.toLowerCase().trim()] || v },
      { keys: ['author', 'लेखक', 'writer'], field: 'author' },
      { keys: ['location', 'स्थान', 'place', 'city'], field: 'location' },
      { keys: ['breaking', 'ब्रेकिंग'], field: 'is_breaking', transform: (v) => ['yes', 'true', 'हाँ', '1', 'हां'].includes(v.toLowerCase().trim()) },
      { keys: ['alt', 'alt_text', 'image_alt', 'ऑल्ट'], field: 'image_alt_text_hi' },
      { keys: ['seo_title', 'seo शीर्षक', 'एसईओ शीर्षक'], field: 'seo_title_hi' },
      { keys: ['keywords', 'seo_keywords', 'कीवर्ड', 'एसईओ कीवर्ड'], field: 'seo_keywords_hi' },
      { keys: ['video', 'video_url', 'वीडियो', 'youtube'], field: 'video_url' },
    ];

    // Process paragraphs to extract metadata
    paragraphs.forEach((p, index) => {
      const text = p.textContent.trim();
      
      // Check for content separator (---, ===, or empty line after metadata)
      if (text === '---' || text === '===' || text === '***' || text.toLowerCase() === 'content:' || text === 'सामग्री:') {
        foundContentSeparator = true;
        metadataEndIndex = index + 1;
        return;
      }

      // Skip if we've found the separator
      if (foundContentSeparator) return;

      // Try to match field patterns
      for (const pattern of fieldPatterns) {
        for (const key of pattern.keys) {
          // Match "Key: Value" or "Key - Value" or "Key = Value" format
          const regex = new RegExp(`^${key}\\s*[:=-]\\s*(.+)$`, 'i');
          const match = text.match(regex);
          
          if (match) {
            let value = match[1].trim();
            if (pattern.transform) {
              value = pattern.transform(value);
            }
            metadata[pattern.field] = value;
            metadataEndIndex = index + 1;
            break;
          }
        }
      }
    });

    // If no explicit separator found, try to detect where content starts
    // Content usually starts after all metadata or with a longer paragraph
    if (!foundContentSeparator && metadataEndIndex > 0) {
      // Look for first paragraph that doesn't match metadata pattern
      for (let i = metadataEndIndex; i < paragraphs.length; i++) {
        const text = paragraphs[i].textContent.trim();
        let isMetadata = false;
        
        for (const pattern of fieldPatterns) {
          for (const key of pattern.keys) {
            const regex = new RegExp(`^${key}\\s*[:=-]\\s*`, 'i');
            if (regex.test(text)) {
              isMetadata = true;
              metadataEndIndex = i + 1;
              break;
            }
          }
          if (isMetadata) break;
        }
        
        if (!isMetadata && text.length > 0) {
          break;
        }
      }
    }

    // Extract content HTML (everything after metadata)
    let contentHtml = '';
    const allElements = Array.from(tempDiv.children);
    
    // Count paragraphs we've processed
    let pCount = 0;
    let contentStarted = false;
    
    allElements.forEach((el) => {
      if (el.tagName === 'P') {
        pCount++;
        if (pCount > metadataEndIndex) {
          contentStarted = true;
        }
      } else if (pCount >= metadataEndIndex) {
        contentStarted = true;
      }
      
      if (contentStarted) {
        contentHtml += el.outerHTML;
      }
    });

    // If title not found in metadata, use first heading or first paragraph
    if (!metadata.title_hi) {
      const firstHeading = tempDiv.querySelector('h1, h2, h3');
      if (firstHeading) {
        metadata.title_hi = firstHeading.textContent.trim();
        // Remove heading from content
        contentHtml = contentHtml.replace(firstHeading.outerHTML, '');
      } else if (paragraphs[0]) {
        metadata.title_hi = paragraphs[0].textContent.trim();
      }
    }

    // Auto-generate excerpt if not provided (first 150 chars of content)
    if (!metadata.excerpt_hi && contentHtml) {
      const excerptDiv = document.createElement('div');
      excerptDiv.innerHTML = contentHtml;
      const textContent = excerptDiv.textContent.trim();
      metadata.excerpt_hi = textContent.substring(0, 150) + (textContent.length > 150 ? '...' : '');
    }

    // Auto-generate SEO title if not provided
    if (!metadata.seo_title_hi && metadata.title_hi) {
      metadata.seo_title_hi = metadata.title_hi;
    }

    return { metadata, contentHtml: contentHtml.trim() };
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check authentication
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      toast({ title: 'Login required', description: 'Your session has expired. Please log in again.', variant: 'destructive' });
      return;
    }

    console.log('Starting file processing for:', file.name);
    setIsProcessing(true);
    setExtractionStatus(null);
    setUploadedImagesCount(0);
    toast({ title: 'प्रोसेसिंग...', description: 'DOCX फ़ाइल से डेटा निकाला जा रहा है...' });

    try {
      console.log('Loading mammoth library');
      const mammoth = await getMammoth();
      console.log('Mammoth loaded');
      let imageCount = 0;
      let firstImageUrl = '';

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
                                if(youtubeMatch) {
                                    iframeHtml = `<iframe src="https://www.youtube.com/embed/${youtubeMatch[1]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                                } else {
                                    iframeHtml = `<iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
                                }
                                newChildren.push({ type: 'text', value: `<div class="video-embed">${iframeHtml}</div>` });
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
          console.log('Processing image');
          const imageBuffer = await image.read("base64");
          const blob = dataURItoBlob(`data:${image.contentType};base64,${imageBuffer}`);
          const fileName = `articles/${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

          console.log('Uploading image to Supabase');
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('article-images')
            .upload(fileName, blob, { contentType: image.contentType });

          if (uploadError) {
            console.error('Image upload error:', uploadError);
            throw new Error(`Image upload failed: ${uploadError.message}`);
          }

          const { data: urlData } = supabase.storage
            .from('article-images')
            .getPublicUrl(uploadData.path);

          imageCount++;
          if (!firstImageUrl) {
            firstImageUrl = urlData.publicUrl;
          }
          setUploadedImagesCount(imageCount);
          console.log('Image uploaded:', imageCount);

          return { src: urlData.publicUrl };
        })
      };

      console.log('Starting mammoth convert');
      const convertPromise = mammoth.convert({ arrayBuffer: await file.arrayBuffer() }, options);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('DOCX processing timeout after 60 seconds')), 60000));
      const { value: html } = await Promise.race([convertPromise, timeoutPromise]);
      console.log('Mammoth convert completed');

      // Parse metadata and content from the HTML
      const { metadata, contentHtml: extractedContent } = parseMetadataFromHtml(html);

      // Set featured image from first image in document
      const featuredImg = firstImageUrl || html.match(/<img src="(.*?)"/)?.[1] || '';

      // Update state with extracted data
      setArticleData(prev => ({
        ...prev,
        ...metadata,
      }));
      setContentHtml(extractedContent || html);
      setFeaturedImageUrl(featuredImg);

      // Determine extraction status
      const hasAllRequired = metadata.title_hi && extractedContent;
      setExtractionStatus(hasAllRequired ? 'success' : 'partial');

      toast({ 
        title: '✅ सफलतापूर्वक निकाला गया!', 
        description: `${imageCount} छवियाँ अपलोड की गईं। कृपया डेटा की समीक्षा करें।`
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({ variant: 'destructive', title: 'प्रोसेसिंग विफल', description: error.message });
      setExtractionStatus(null);
    } finally {
      console.log('Processing finished');
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
    setIsProcessing(true);

    // Check authentication
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      toast({ title: 'Login required', description: 'Your session has expired. Please log in again.', variant: 'destructive' });
      setIsProcessing(false);
      return;
    }

    // Temporarily skip role check for testing
    // Check user role permissions
    // if (!profile || !['admin', 'superuser'].includes(profile.role)) {
    //   toast({ 
    //     title: 'Permission Denied', 
    //     description: 'You need admin or superuser privileges to publish articles.', 
    //     variant: 'destructive' 
    //   });
    //   setIsProcessing(false);
    //   return;
    // }

    let finalImageUrl = articleData.id ? featuredImageUrl : (featuredImageUrl || article?.image_url);

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

      toast({ title: articleData.id ? 'Article Updated!' : currentContent.uploader.uploadSuccess });
      onUploadSuccess();
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving article:', error);
      toast({ variant: 'destructive', title: currentContent.uploader.uploadError, description: formatSupabaseError(error) });
    } finally {
      setIsProcessing(false);
    }
  };

  const formTitle = article ? (currentContent.uploader.editTitle || 'Edit Article') : currentContent.uploader.title;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="w-full sm:max-w-2xl md:max-w-4xl max-h-[85dvh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{formTitle}</DialogTitle>
          <DialogDescription className="hidden sm:block">
            DOCX फ़ाइल अपलोड करें - सभी फ़ील्ड और इमेज स्वचालित रूप से निकाले जाएंगे
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-4 px-4 sm:-mx-6 sm:px-6 space-y-4 sm:space-y-6 overscroll-contain touch-pan-y">
          
          {/* Primary DOCX Upload Zone */}
          <div className={`relative rounded-xl border-2 border-dashed transition-all ${
            extractionStatus === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 
            extractionStatus === 'partial' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' :
            isProcessing ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
          }`}>
            <label htmlFor="docx-upload-main" className="block cursor-pointer p-6 sm:p-8">
              <div className="text-center">
                {isProcessing ? (
                  <>
                    <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
                    <p className="mt-3 text-lg font-medium">प्रोसेसिंग...</p>
                    <p className="text-sm text-muted-foreground">
                      {uploadedImagesCount > 0 ? `${uploadedImagesCount} छवियाँ अपलोड हुईं` : 'DOCX से डेटा निकाला जा रहा है...'}
                    </p>
                  </>
                ) : extractionStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                    <p className="mt-3 text-lg font-medium text-green-700 dark:text-green-400">सफलतापूर्वक निकाला गया!</p>
                    <p className="text-sm text-muted-foreground">
                      {uploadedImagesCount} छवियाँ अपलोड • नीचे समीक्षा करें या नई फ़ाइल अपलोड करें
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-3 text-lg font-medium">DOCX फ़ाइल यहाँ अपलोड करें</p>
                    <p className="text-sm text-muted-foreground">सभी फ़ील्ड और इमेज स्वचालित रूप से निकाले जाएंगे</p>
                    <p className="mt-2 text-xs text-muted-foreground bg-muted rounded-md px-3 py-1.5 inline-block">
                      फ़ॉर्मेट: Title: शीर्षक | Category: श्रेणी | Author: लेखक | --- | सामग्री
                    </p>
                  </>
                )}
              </div>
              <input id="docx-upload-main" type="file" className="sr-only" accept=".docx" onChange={handleFileChange} disabled={isProcessing} />
            </label>
          </div>

          {/* Extracted Data Review Section - Show after extraction */}
          {(extractionStatus || articleData.title_hi) && (
            <>
              {/* Title and Excerpt */}
              <div className="grid grid-cols-1 gap-4 sm:gap-5">
                <div>
                  <Label htmlFor="title_hi" className="text-sm font-medium flex items-center gap-2">
                    शीर्षक (Title) *
                    {articleData.title_hi && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </Label>
                  <Input id="title_hi" value={articleData.title_hi || ''} onChange={handleInputChange} required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="excerpt_hi" className="text-sm font-medium flex items-center gap-2">
                    अंश (Excerpt)
                    {articleData.excerpt_hi && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </Label>
                  <Textarea id="excerpt_hi" value={articleData.excerpt_hi || ''} onChange={handleInputChange} className="mt-1.5 min-h-[70px]" />
                </div>
              </div>

              {/* Category, Author, Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                <div>
                  <Label htmlFor="category" className="text-sm font-medium flex items-center gap-2">
                    श्रेणी (Category)
                    {articleData.category && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </Label>
                  <Select onValueChange={handleCategoryChange} value={articleData.category || 'indian'}>
                    <SelectTrigger id="category" className="mt-1.5">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="author" className="text-sm font-medium flex items-center gap-2">
                    लेखक (Author)
                    {articleData.author && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </Label>
                  <Input id="author" value={articleData.author || ''} onChange={handleInputChange} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                    स्थान (Location)
                    {articleData.location && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </Label>
                  <Input id="location" value={articleData.location || ''} onChange={handleInputChange} className="mt-1.5" />
                </div>
              </div>

              {/* Featured Image and Breaking News */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    फीचर्ड इमेज (Featured Image)
                    {featuredImageUrl && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </Label>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border">
                      {featuredImageUrl ? (
                        <img src={featuredImageUrl} alt="Featured preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="featured-image-upload" className="cursor-pointer rounded-md bg-secondary text-secondary-foreground text-xs font-medium px-3 py-2 hover:bg-secondary/80 transition-colors text-center">
                        <span>बदलें</span>
                        <input id="featured-image-upload" type="file" className="sr-only" accept="image/*" onChange={handleFeaturedImageChange} />
                      </label>
                      {featuredImageUrl && (
                        <span className="text-xs text-green-600 dark:text-green-400">✓ स्वचालित</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="is_breaking" checked={articleData.is_breaking} onCheckedChange={handleCheckboxChange} />
                    <Label htmlFor="is_breaking" className="flex items-center gap-2 text-sm font-medium text-orange-500 cursor-pointer">
                      <Zap className="h-4 w-4" /> ब्रेकिंग न्यूज़
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">DOCX में "Breaking: हाँ" लिखें</p>
                </div>
              </div>

              {/* SEO Section - Collapsible */}
              <details className="border rounded-lg">
                <summary className="px-4 py-3 cursor-pointer font-medium text-sm hover:bg-muted/50 flex items-center gap-2">
                  <span>एसईओ और मीडिया (SEO & Media)</span>
                  {(articleData.seo_title_hi || articleData.seo_keywords_hi) && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                </summary>
                <div className="px-4 pb-4 space-y-4">
                  <div>
                    <Label htmlFor="image_alt_text_hi" className="text-sm font-medium">छवि ऑल्ट टेक्स्ट (Alt Text)</Label>
                    <Input id="image_alt_text_hi" value={articleData.image_alt_text_hi || ''} onChange={handleInputChange} placeholder="उदा., प्रधानमंत्री भाषण देते हुए" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="video_url" className="flex items-center gap-2 text-sm font-medium">
                      <Youtube className="h-4 w-4 text-red-500" /> वीडियो एम्बेड कोड
                    </Label>
                    <Textarea id="video_url" value={articleData.video_url || ''} onChange={handleInputChange} placeholder="YouTube/Vimeo iframe कोड पेस्ट करें" className="mt-1.5 min-h-[60px]" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="seo_title_hi" className="text-sm font-medium">एसईओ शीर्षक</Label>
                      <Input id="seo_title_hi" value={articleData.seo_title_hi || ''} onChange={handleInputChange} placeholder="कीवर्ड-युक्त शीर्षक" className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="seo_keywords_hi" className="text-sm font-medium">एसईओ कीवर्ड</Label>
                      <Input id="seo_keywords_hi" value={articleData.seo_keywords_hi || ''} onChange={handleInputChange} placeholder="राजनीति, चुनाव, भारत" className="mt-1.5" />
                    </div>
                  </div>
                </div>
              </details>

              {/* Content Preview */}
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  लेख सामग्री (Content Preview)
                  {contentHtml && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </Label>
                <div
                  className="mt-2 w-full min-h-[120px] max-h-[250px] overflow-y-auto rounded-md border p-4 bg-muted/50 prose prose-sm dark:prose-invert max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: contentHtml || '<p class="text-muted-foreground">DOCX अपलोड के बाद सामग्री यहां दिखाई देगी।</p>' }}
                />
              </div>
            </>
          )}

          {/* Help Section - Show before extraction */}
          {!extractionStatus && !article && (
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <h4 className="font-medium mb-2">📝 DOCX फ़ॉर्मेट गाइड</h4>
              <div className="text-muted-foreground space-y-1 text-xs">
                <p><strong>Title:</strong> आपका शीर्षक यहाँ</p>
                <p><strong>Excerpt:</strong> लेख का संक्षिप्त विवरण</p>
                <p><strong>Category:</strong> politics / sports / entertainment / business / technology</p>
                <p><strong>Author:</strong> लेखक का नाम</p>
                <p><strong>Location:</strong> नई दिल्ली</p>
                <p><strong>Breaking:</strong> हाँ (वैकल्पिक)</p>
                <p><strong>Keywords:</strong> राजनीति, चुनाव, भारत</p>
                <p className="text-primary font-medium pt-1">---</p>
                <p>यहाँ से आपकी लेख सामग्री शुरू होगी। इमेज सीधे DOCX में डालें।</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 gap-2 sm:gap-0 border-t pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isProcessing} className="w-full sm:w-auto">
            {currentContent.uploader.form?.cancel || 'Cancel'}
          </Button>
          <Button onClick={handleSave} disabled={isProcessing || !articleData.title_hi} className="w-full sm:w-auto">
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isProcessing ? 'सहेज रहा है...' : 'प्रकाशित करें'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ArticleUploader;
