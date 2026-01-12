import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const DatabaseTest = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const { profile } = useAuth();
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
      const { data: sessionData } = await supabase.auth.getSession();
      results.auth = !!sessionData?.session;
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

        const { data, error } = await supabase
          .from('articles')
          .insert(mockArticle)
          .select()
          .single();

        if (error) {
          results.error = error;
          console.error('Insert error:', error);
        } else {
          results.insert = true;
          results.articleId = data.id;
          console.log('Insert success:', data);
        }
      }

    } catch (error) {
      results.error = error;
      console.error('Test error:', error);
    }

    setTestResults(results);
    setIsTesting(false);

    // Show toast based on results
    if (results.insert) {
      toast({
        title: '✅ Database Test Passed',
        description: 'Article inserted successfully!'
      });
    } else {
      toast({
        title: '❌ Database Test Failed',
        description: results.error?.message || 'Check console for details',
        variant: 'destructive'
      });
    }
  };

  const cleanupTestArticle = async () => {
    if (testResults?.articleId) {
      try {
        await supabase
          .from('articles')
          .delete()
          .eq('title_hi', 'Test Article - Database Connection Test');

        toast({
          title: '🧹 Test article cleaned up',
          description: 'Removed test article from database'
        });
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

              {!testResults.role && (
                <div className="mt-2 p-2 rounded-md bg-yellow-50 border border-yellow-100">
                  <p className="text-sm">It looks like your user does not have an `admin` or `superuser` role in the database, or your profile row is missing.</p>
                  <p className="text-sm mt-1">You can create a profile locally with the helper script or ask an existing superuser to run the admin endpoint.</p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const userId = profile?.id || 'YOUR_USER_ID';
                        const cmd = `node scripts/create_profile.mjs --id=${userId} --role=admin --name="${profile?.full_name || 'Admin User'}"`;
                        navigator.clipboard?.writeText(cmd);
                        toast({ title: 'Command copied', description: cmd });
                      }}
                    >
                      Copy create-profile command
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        toast({ title: 'Tip', description: 'If deployed, call POST /api/create-profile with x-create-profile-secret header (server secret must be set).' });
                      }}
                    >
                      How to create server-side
                    </Button>
                  </div>
                </div>
              )}

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
                  {testResults.error.message || JSON.stringify(testResults.error)}
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