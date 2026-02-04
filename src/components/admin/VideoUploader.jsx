import React, { useMemo, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UploadCloud, AlertCircle, CheckCircle2, Play, FileVideo } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';

// Enhanced video uploader with progress tracking and validation
const VideoUploader = ({ bucket = 'article-videos', onUploadSuccess }) => {
  const { toast } = useToast();
  const { token } = useAuth();

  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoDuration, setVideoDuration] = useState(null);
  const [uploadedVideos, setUploadedVideos] = useState([]);

  // Supported video formats
  const SUPPORTED_FORMATS = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

  const fileLabel = useMemo(() => {
    if (!file) return 'कोई फ़ाइल चयनित नहीं (No file selected)';
    const sizeMB = Math.round(file.size / 1024 / 1024);
    return `${file.name} (${sizeMB} MB)`;
  }, [file]);

  // Validate video file
  const validateVideoFile = (file) => {
    const errors = [];

    if (!file) {
      errors.push('फ़ाइल चयन करें (Select a file)');
      return errors;
    }

    if (!SUPPORTED_FORMATS.includes(file.type)) {
      errors.push(`असमर्थित प्रारूप (Unsupported format). समर्थित: MP4, WebM, OGG, MOV`);
    }

    if (file.size > MAX_FILE_SIZE) {
      errors.push(`फ़ाइल बहुत बड़ी है (File too large). अधिकतम: 500MB, आपकी: ${Math.round(file.size / 1024 / 1024)}MB`);
    }

    return errors;
  };

  // Handle file selection and preview
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const errors = validateVideoFile(selectedFile);
    if (errors.length > 0) {
      toast({
        variant: 'destructive',
        title: '❌ फ़ाइल सत्यापन विफल',
        description: errors[0]
      });
      return;
    }

    setFile(selectedFile);

    // Create preview
    const preview = URL.createObjectURL(selectedFile);
    setVideoPreview(preview);

    // Get video duration
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      setVideoDuration(Math.round(video.duration));
    };
    video.src = preview;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const errors = validateVideoFile(file);
    if (errors.length > 0) {
      toast({
        variant: 'destructive',
        title: '❌ सत्यापन विफल',
        description: errors[0]
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const reader = new FileReader();

      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      };

      reader.onload = async () => {
        try {
          setUploadProgress(95); // Simulate server processing

          const base64 = reader.result.split(',')[1];
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

          const response = await fetch('/api/upload-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              filename: `videos/${Date.now()}-${safeName}`,
              content_type: file.type || 'video/mp4',
              data: base64,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
          }

          const data = await response.json();
          setUploadProgress(100);

          // Add to uploaded videos list
          const newVideo = {
            id: Date.now(),
            name: file.name,
            url: data.publicUrl,
            size: file.size,
            duration: videoDuration,
            uploadedAt: new Date().toLocaleString('hi-IN'),
          };

          setUploadedVideos(prev => [newVideo, ...prev]);

          toast({
            title: '✅ अपलोड सफल',
            description: `${file.name} सफलतापूर्वक अपलोड किया गया।`
          });

          onUploadSuccess?.(data);

          // Reset form
          setTimeout(() => {
            setFile(null);
            setVideoPreview(null);
            setVideoDuration(null);
            setUploadProgress(0);
            setIsUploading(false);
          }, 1000);
        } catch (error) {
          toast({
            variant: 'destructive',
            title: '❌ अपलोड विफल',
            description: error?.message || 'वीडियो अपलोड करने में विफल।'
          });
          setIsUploading(false);
          setUploadProgress(0);
        }
      };

      reader.onerror = () => {
        toast({
          variant: 'destructive',
          title: '❌ फ़ाइल पढ़ने में विफल',
          description: 'फ़ाइल को पढ़ने में त्रुटि हुई।'
        });
        setIsUploading(false);
        setUploadProgress(0);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '❌ अपलोड विफल',
        description: error?.message || 'वीडियो अपलोड करने में विफल।'
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileVideo className="h-5 w-5" />
            वीडियो अपलोडर (Video Uploader)
          </CardTitle>
          <CardDescription>
            MP4, WebM, OGG, MOV प्रारूप समर्थित। अधिकतम आकार: 500MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            {/* File Input */}
            <div className="space-y-2">
              <Label htmlFor="video">वीडियो फ़ाइल चुनें (Select Video)</Label>
              <Input
                id="video"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                disabled={isUploading}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">{fileLabel}</p>
            </div>

            {/* Video Preview */}
            {videoPreview && (
              <div className="space-y-2">
                <Label>पूर्वावलोकन (Preview)</Label>
                <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                  <video
                    src={videoPreview}
                    className="w-full h-full object-cover"
                    controls
                  />
                  {videoDuration && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {formatDuration(videoDuration)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">अपलोड प्रगति (Upload Progress)</Label>
                  <span className="text-sm font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Upload Button */}
            <Button
              type="submit"
              disabled={!file || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  अपलोड हो रहा है... ({uploadProgress}%)
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  अपलोड करें (Upload)
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Uploaded Videos List */}
      {uploadedVideos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">अपलोड किए गए वीडियो ({uploadedVideos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedVideos.map((video) => (
                <div key={video.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Play className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{video.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(video.size / 1024 / 1024)}MB • {formatDuration(video.duration)} • {video.uploadedAt}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(video.url);
                      toast({
                        title: '✅ कॉपी किया गया',
                        description: 'वीडियो URL कॉपी किया गया।'
                      });
                    }}
                  >
                    कॉपी करें
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            सुझाव (Tips)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• वीडियो को लेख में एम्बेड करने के लिए अपलोड किए गए URL को कॉपी करें</p>
          <p>• सर्वोत्तम परिणामों के लिए MP4 प्रारूप का उपयोग करें</p>
          <p>• बड़ी फ़ाइलों के लिए अपलोड में कुछ समय लग सकता है</p>
          <p>• वीडियो को लेख के साथ प्रकाशित करने से पहले परीक्षण करें</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoUploader;
