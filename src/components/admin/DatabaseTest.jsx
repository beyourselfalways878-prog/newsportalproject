import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const DatabaseTest = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const { profile, token } = useAuth();
  const { toast } = useToast();

  const testDatabaseConnection = async () => {
    setIsTesting(true);
    setTestResults(null);

    const results = {
      auth: false,
      role: false,
      insert: false,
      error: null
    };

    try {
      // Test 1: Authentication
      results.auth = !!token;
      console.log('Auth test:', results.auth);

      // Test 2: Role check
      results.role = profile && ['admin', 'superuser'].includes(profile.role);
      console.log('Role test:', results.role, 'Role:', profile?.role);

      // Test 3: Database insert
      if (results.auth && results.role) {
        const mockArticle = {
          title_hi: 'Test Article - Database Connection Test',
          excerpt_hi: 'This is a test article to verify database connectivity',
          content_hi: '<p>This is test content for database verification.</p>',
          category: 'indian',
          author: 'Test Author',
          location: 'Test Location',
          is_breaking: false,
          image_alt_text_hi: 'Test image alt text',
          seo_title_hi: 'Test SEO Title',
          seo_keywords_hi: 'test, database, connection',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const response = await fetch('/api/create-article', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(mockArticle),
        });

        if (!response.ok) {
          const error = await response.json();
          results.error = error;
          console.error('Insert error:', error);
        } else {
          const data = await response.json();
          results.insert = true;
          results.articleId = data.data.id;
          console.log('Insert success:', data);
        }
      }

    } catch (error) {
      results.error = error;
      console.error('Test error:', error);
    }

    setTestResults(results);
    setIsTesting(false);

    if (results.insert) {
      toast({
        title: '✅ Database Test Passed',
        description: 'Article inserted successfully!'
      });
    } else {
      toast({
        title: '❌ Database Test Failed',
        description: results.error?.error || 'Check console for details',
        variant: 'destructive'
      });
    }
  };

  const cleanupTestArticle = async () => {
    if (testResults?.articleId) {
      try {
        const response = await fetch(`/api/articles/${testResults.articleId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          toast({
            title: '🧹 Test article cleaned up',
            description: 'Removed test article from database'
          });
        }
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Database Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button
            onClick={testDatabaseConnection}
            disabled={isTesting}
            className="w-full"
          >
            {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Test Database Connection
          </Button>

          {testResults?.articleId && (
            <Button
              onClick={cleanupTestArticle}
              variant="outline"
              className="w-full"
            >
              Clean Up Test Article
            </Button>
          )}
        </div>

        {testResults && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-2">
                {testResults.auth ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span>Authentication: {testResults.auth ? '✅ Passed' : '❌ Failed'}</span>
              </div>

              <div className="flex items-center gap-2">
                {testResults.role ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span>Role Check: {testResults.role ? `✅ Passed (${profile?.role})` : `❌ Failed (${profile?.role || 'no role'})`}</span>
              </div>

              <div className="flex items-center gap-2">
                {testResults.insert ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span>Database Insert: {testResults.insert ? '✅ Passed' : '❌ Failed'}</span>
              </div>
            </div>

            {testResults.error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Error Details:</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {testResults.error.error || JSON.stringify(testResults.error)}
                </p>
              </div>
            )}

            {testResults.insert && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Success!</p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Test article inserted with ID: {testResults.articleId}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p><strong>What this test does:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Checks if you're authenticated</li>
            <li>Verifies you have admin/superuser role</li>
            <li>Attempts to insert a test article</li>
            <li>Shows detailed error information if it fails</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseTest;