import React, { useState, useEffect } from 'react';
import { fetchArticles, deleteArticle, toggleFeatured } from '@/lib/db.js';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Edit, Trash2, Search, Eye, Calendar, User, MapPin, RefreshCw, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const ArticleManager = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, article: null });
  const [actionLoading, setActionLoading] = useState(null); // Track which article action is loading
  const { toast } = useToast();
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchArticlesList();
  }, []);

  const fetchArticlesList = async () => {
    try {
      const data = await fetchArticles();
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load articles - please refresh the page',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (article) => {
    if (!token) {
      toast({ title: "Authentication Required", description: "Please log in to delete articles.", variant: "destructive" });
      return;
    }

    setActionLoading(article.id);
    try {
      await deleteArticle(article.id, token);
      setArticles(prev => prev.filter(a => a.id !== article.id));
      toast({ title: "✅ Deleted", description: `"${article.title_hi}" has been deleted.` });
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
      setDeleteDialog({ open: false, article: null });
    }
  };

  const handleEdit = (article) => {
    navigate('/article-uploader', { state: { article } });
  };

  const handleView = (article) => {
    navigate(`/article/${article.id}`);
  };

  const handleToggleFeatured = async (article) => {
    if (!token) {
      toast({ title: "Authentication Required", description: "Please log in to update articles.", variant: "destructive" });
      return;
    }

    setActionLoading(article.id);
    try {
      const updated = await toggleFeatured(article.id, token);
      setArticles(prev => prev.map(a => a.id === article.id ? { ...a, is_featured: updated.is_featured } : a));
      toast({
        title: updated.is_featured ? "⭐ Featured" : "Unfeatured",
        description: `"${article.title_hi}" ${updated.is_featured ? 'is now featured' : 'removed from featured'}.`
      });
    } catch (error) {
      console.error('Toggle featured error:', error);
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredArticles = articles.filter(article =>
    article.title_hi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('hi-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading articles...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              fetchArticlesList();
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="text-sm text-muted-foreground">
            Total: {articles.length} articles
          </div>
        </div>
      </div>

      {/* Articles List */}
      <div className="space-y-4">
        {filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm ? 'No articles found matching your search.' : 'No articles found.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredArticles.map((article) => (
            <Card key={article.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Article Image */}
                  <div className="flex-shrink-0">
                    {article.image_url ? (
                      <img
                        src={article.image_url}
                        alt={article.image_alt_text_hi || article.title_hi}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Article Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-lg line-clamp-2">
                        {article.title_hi}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">                        {article.is_featured && (
                        <Badge variant="default" className="text-xs bg-yellow-500 text-black">
                          ⭐ Featured
                        </Badge>
                      )}                        {article.is_breaking && (
                        <Badge variant="destructive" className="text-xs">
                          ब्रेकिंग
                        </Badge>
                      )}
                        <Badge variant="secondary" className="text-xs">
                          {article.category}
                        </Badge>
                      </div>
                    </div>

                    {article.excerpt_hi && (
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                        {article.excerpt_hi}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(article.published_at)}
                      </div>
                      {article.author && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {article.author}
                        </div>
                      )}
                      {article.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {article.location}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(article)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant={article.is_featured ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleToggleFeatured(article)}
                      className="flex items-center gap-1"
                    >
                      <Zap className="h-4 w-4" />
                      {article.is_featured ? 'Featured' : 'Feature'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(article)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteDialog({ open: true, article })}
                      className="flex items-center gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, article: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.article?.title_hi}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(deleteDialog.article)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ArticleManager;