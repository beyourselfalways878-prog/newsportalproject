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
import { Loader2, FileText, Image as ImageIcon, Zap, Youtube } from 'lucide-react';

let mammothPromise;
const getMammoth = () => {
  if (!mammothPromise) {
    mammothPromise = import('mammoth').then((m) => m.default ?? m);
  }
  return mammothPromise;
};

const ArticleUploader = ({ isOpen, setIsOpen, onUploadSuccess, currentContent, categories, article }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [articleData, setArticleData] = useState({});
  const [contentHtml, setContentHtml] = useState('');
  const [featuredImageFile, setFeaturedImageFile] = useState(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');

  const { toast } = useToast();

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

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    toast({ title: currentContent.uploader.processing, description: 'Converting .docx file...' });

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
                                if(youtubeMatch) {
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
            console.error('Image upload error:', uploadError);
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
    setIsProcessing(true);

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
      toast({ variant: 'destructive', title: currentContent.uploader.uploadError, description: error.message });
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
          <DialogDescription className="hidden sm:block">{currentContent.uploader.description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-4 px-4 sm:-mx-6 sm:px-6 space-y-4 sm:space-y-6 overscroll-contain touch-pan-y">
           <div className="grid grid-cols-1 gap-4 sm:gap-5">
            <div>
              <Label htmlFor="title_hi" className="text-sm font-medium">शीर्षक (Title) *</Label>
              <Input id="title_hi" value={articleData.title_hi || ''} onChange={handleInputChange} required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="excerpt_hi" className="text-sm font-medium">अंश (Excerpt)</Label>
              <Textarea id="excerpt_hi" value={articleData.excerpt_hi || ''} onChange={handleInputChange} className="mt-1.5 min-h-[70px]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <Label htmlFor="category" className="text-sm font-medium">श्रेणी (Category)</Label>
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
                <Label htmlFor="author" className="text-sm font-medium">लेखक (Author)</Label>
                <Input id="author" value={articleData.author || ''} onChange={handleInputChange} className="mt-1.5" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <Label htmlFor="location" className="text-sm font-medium">स्थान (Location)</Label>
                <Input id="location" value={articleData.location || ''} onChange={handleInputChange} className="mt-1.5" />
              </div>
              <div className="flex items-center space-x-2 pt-2 sm:pt-6">
                <Checkbox id="is_breaking" checked={articleData.is_breaking} onCheckedChange={handleCheckboxChange} />
                <Label htmlFor="is_breaking" className="flex items-center gap-2 text-sm font-medium text-orange-500 cursor-pointer">
                  <Zap className="h-4 w-4" /> ब्रेकिंग न्यूज़
                </Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <Label className="text-sm font-medium">फीचर्ड इमेज (Featured Image)</Label>
              <div className="mt-2 flex items-center gap-3">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {featuredImageUrl ? <img src={featuredImageUrl} alt="Featured preview" className="w-full h-full object-cover" /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}
                </div>
                <label htmlFor="featured-image-upload" className="cursor-pointer rounded-md bg-primary text-primary-foreground text-xs sm:text-sm font-semibold px-3 py-2.5 hover:bg-primary/90 active:scale-95 transition-transform">
                  <span>छवि अपलोड</span>
                  <input id="featured-image-upload" type="file" className="sr-only" accept="image/*" onChange={handleFeaturedImageChange} />
                </label>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">.docx से आयात करें</Label>
              <label htmlFor="docx-upload" className="mt-2 flex justify-center w-full rounded-lg border-2 border-dashed border-border px-4 py-6 sm:px-6 sm:py-8 cursor-pointer hover:border-primary active:bg-primary/5 transition-colors">
                <div className="text-center">
                  <FileText className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground">अपलोड करने के लिए क्लिक करें</p>
                  <p className="text-xs text-muted-foreground">DOCX 10MB तक</p>
                </div>
                <input id="docx-upload" type="file" className="sr-only" accept=".docx" onChange={handleFileChange} />
              </label>
            </div>
          </div>

          <div>
            <Label htmlFor="image_alt_text_hi" className="text-sm font-medium">छवि ऑल्ट टेक्स्ट (Alt Text)</Label>
            <Input id="image_alt_text_hi" value={articleData.image_alt_text_hi || ''} onChange={handleInputChange} placeholder="उदा., प्रधानमंत्री भाषण देते हुए" className="mt-1.5" />
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-base sm:text-lg font-medium text-foreground">मीडिया और एसईओ (Media & SEO)</h3>
            <div>
              <Label htmlFor="video_url" className="flex items-center gap-2 text-sm font-medium"><Youtube className="h-4 w-4 text-red-500" /> वीडियो एम्बेड कोड</Label>
              <Textarea id="video_url" value={articleData.video_url || ''} onChange={handleInputChange} placeholder="YouTube/Vimeo iframe कोड पेस्ट करें" className="mt-1.5 min-h-[60px]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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

          <div>
            <Label className="text-sm font-medium">लेख सामग्री (HTML पूर्वावलोकन)</Label>
            <div
              className="mt-2 w-full min-h-[100px] sm:min-h-[150px] max-h-[200px] overflow-y-auto rounded-md border p-3 sm:p-4 bg-muted/50 prose prose-sm sm:prose dark:prose-invert max-w-none text-sm"
              dangerouslySetInnerHTML={{ __html: contentHtml || '<p class="text-muted-foreground">.docx आयात के बाद सामग्री यहां दिखाई देगी।</p>' }}
            />
          </div>
        </div>
        <DialogFooter className="flex-shrink-0 gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isProcessing} className="w-full sm:w-auto">
            {currentContent.uploader.form.cancel || 'Cancel'}
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
