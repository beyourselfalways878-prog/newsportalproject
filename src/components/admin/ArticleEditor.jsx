import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
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
import { Loader2, FileText, Image as ImageIcon } from 'lucide-react';

let mammothPromise;
const getMammoth = () => {
  if (!mammothPromise) {
    mammothPromise = import('mammoth').then((m) => m.default ?? m);
  }
  return mammothPromise;
};

// Improved editor:
// - Lazy-loads mammoth (keeps bundle smaller)
// - Supports optional docx import
// - Uses consistent shadcn-style UI components
const ArticleEditor = ({ isOpen, onClose, article, onSave, currentContent, categories }) => {
  const { toast } = useToast();

  const formatSupabaseError = (err) => {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    const parts = [err.message, err.details, err.hint, err.code].filter(Boolean);
    return parts.join(' — ');
  };

  const defaultCategory = categories?.[0]?.[0] || 'indian';

  const [isBusy, setIsBusy] = useState(false);
  const [contentHtml, setContentHtml] = useState('');
  const [featuredImageFile, setFeaturedImageFile] = useState(null);
  const [featuredPreviewUrl, setFeaturedPreviewUrl] = useState('');
  const [formData, setFormData] = useState({
    id: undefined,
    title_hi: '',
    excerpt_hi: '',
    category: defaultCategory,
    author: '',
    location: '',
    image_alt_text_hi: '',
    seo_title_hi: '',
    seo_keywords_hi: '',
  });

  useEffect(() => {
    if (!isOpen) return;

    if (article) {
      setFormData({
        id: article.id,
        title_hi: article.title_hi || '',
        excerpt_hi: article.excerpt_hi || '',
        category: article.category || defaultCategory,
        author: article.author || '',
        location: article.location || '',
        image_alt_text_hi: article.image_alt_text_hi || '',
        seo_title_hi: article.seo_title_hi || '',
        seo_keywords_hi: article.seo_keywords_hi || '',
      });
      setContentHtml(article.content_hi || '');
      setFeaturedPreviewUrl(article.image_url || '');
    } else {
      setFormData((prev) => ({
        ...prev,
        id: undefined,
        title_hi: '',
        excerpt_hi: '',
        category: defaultCategory,
        author: '',
        location: '',
        image_alt_text_hi: '',
        seo_title_hi: '',
        seo_keywords_hi: '',
      }));
      setContentHtml('');
      setFeaturedPreviewUrl('');
    }

    setFeaturedImageFile(null);
    setIsBusy(false);
  }, [article, defaultCategory, isOpen]);

  const formTitle = useMemo(() => {
    if (article) return currentContent?.uploader?.editTitle || 'Edit Article';
    return currentContent?.uploader?.title || 'Article Editor';
  }, [article, currentContent]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleCategoryChange = (value) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleFeaturedImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFeaturedImageFile(file);
    setFeaturedPreviewUrl(URL.createObjectURL(file));
  };

  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return new Blob([ab], { type: mimeString });
  };

  const handleDocxUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsBusy(true);
    toast({ title: currentContent?.uploader?.processing || 'Processing...', description: 'Converting .docx file...' });

    try {
      const mammoth = await getMammoth();

      const options = {
        convertImage: mammoth.images.imgElement(async (image) => {
          const imageBuffer = await image.read('base64');
          const blob = dataURItoBlob(`data:${image.contentType};base64,${imageBuffer}`);
          const fileName = `articles/${Date.now()}-${Math.random().toString(36).slice(2)}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('article-images')
            .upload(fileName, blob, { contentType: image.contentType });

          if (uploadError) {
            throw uploadError;
          }

          const { data: urlData } = supabase.storage.from('article-images').getPublicUrl(uploadData.path);
          return { src: urlData.publicUrl };
        }),
      };

      const { value: html } = await mammoth.convert({ arrayBuffer: await file.arrayBuffer() }, options);
      setContentHtml(html);
      toast({ title: 'Imported', description: 'DOCX content loaded.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Import failed', description: error?.message || 'Could not convert DOCX.' });
    } finally {
      setIsBusy(false);
    }
  };

  const handleSave = async () => {
    setIsBusy(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        toast({ variant: 'destructive', title: 'Login required', description: 'Your session has expired. Please log in again.' });
        return;
      }

      let finalImageUrl = featuredPreviewUrl || article?.image_url || '';

      if (featuredImageFile) {
        const fileName = `featured/${Date.now()}-${featuredImageFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('article-images')
          .upload(fileName, featuredImageFile, { upsert: !!formData.id });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('article-images').getPublicUrl(uploadData.path);
        finalImageUrl = urlData.publicUrl;
      }

      const nowIso = new Date().toISOString();

      const payload = {
        ...formData,
        content_hi: contentHtml,
        image_url: finalImageUrl,
        updated_at: nowIso,
        published_at: formData.id ? article?.published_at : nowIso,
        user_id: sessionData.session.user.id, // Add user_id for RLS
      };

      const { error } = await supabase.from('articles').upsert(payload);
      if (error) throw error;

      toast({ title: formData.id ? 'Article Updated' : 'Article Saved' });
      onSave?.();
      onClose?.();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Save failed', description: formatSupabaseError(error) });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose?.() : null)}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{formTitle}</DialogTitle>
          <DialogDescription>{currentContent?.uploader?.description || 'Edit content and publish.'}</DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto p-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title_hi">शीर्षक (Title)</Label>
              <Input id="title_hi" value={formData.title_hi} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt_hi">अंश (Excerpt)</Label>
              <Textarea id="excerpt_hi" value={formData.excerpt_hi} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">श्रेणी (Category)</Label>
              <Select onValueChange={handleCategoryChange} value={formData.category}>
                <SelectTrigger id="category">
                  <SelectValue placeholder={currentContent?.uploader?.form?.selectCategory || 'Select a category'} />
                </SelectTrigger>
                <SelectContent>
                  {(categories || []).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">लेखक (Author)</Label>
              <Input id="author" value={formData.author} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">स्थान (Location)</Label>
              <Input id="location" value={formData.location} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_alt_text_hi">Image Alt Text</Label>
              <Input id="image_alt_text_hi" value={formData.image_alt_text_hi} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Featured Image</Label>
              <div className="mt-2 flex items-center gap-x-3">
                <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {featuredPreviewUrl ? (
                    <img src={featuredPreviewUrl} alt="Featured preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <label
                  htmlFor="featured-image-upload"
                  className="cursor-pointer rounded-md bg-primary text-primary-foreground text-sm font-semibold px-3 py-2 hover:bg-primary/90"
                >
                  <span>Upload</span>
                  <input id="featured-image-upload" type="file" className="sr-only" accept="image/*" onChange={handleFeaturedImageChange} />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Import from .docx</Label>
              <label
                htmlFor="docx-upload"
                className="mt-2 flex justify-center w-full rounded-lg border-2 border-dashed border-border px-6 py-10 cursor-pointer hover:border-primary transition-colors"
              >
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">Click to upload DOCX</p>
                  <p className="text-xs text-muted-foreground">10MB max</p>
                </div>
                <input id="docx-upload" type="file" className="sr-only" accept=".docx" onChange={handleDocxUpload} />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>SEO</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="seo_title_hi">SEO Title</Label>
                <Input id="seo_title_hi" value={formData.seo_title_hi} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo_keywords_hi">SEO Keywords</Label>
                <Input id="seo_keywords_hi" value={formData.seo_keywords_hi} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Content (HTML preview)</Label>
            <div
              className="w-full min-h-[200px] rounded-md border p-4 bg-muted/50 prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: contentHtml || '<p>DOCX import content will appear here.</p>' }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onClose?.()} disabled={isBusy}>
            {currentContent?.uploader?.form?.cancel || 'Cancel'}
          </Button>
          <Button onClick={handleSave} disabled={isBusy || !formData.title_hi}>
            {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isBusy ? (currentContent?.uploader?.form?.saving || 'Saving...') : (currentContent?.uploader?.form?.save || 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ArticleEditor;
