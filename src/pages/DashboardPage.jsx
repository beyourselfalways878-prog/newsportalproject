import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import UserManagement from '@/components/admin/UserManagement';
import { Button } from '@/components/ui/button';
import { contentData } from '@/lib/data';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, FileText, Users } from 'lucide-react';

const DashboardPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const language = 'hi';
  const currentContent = contentData[language];

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleNewArticle = () => {
    navigate('/article-uploader');
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | 24x7 Indian News</title>
        <meta name="description" content="Admin dashboard for managing users and content." />
      </Helmet>
      <Header currentContent={currentContent} language={language} darkMode={false} toggleDarkMode={() => {}} onLogoClick={handleBackToHome} />
      <main className="container mx-auto px-4 py-6 md:py-8 min-h-[calc(100vh-280px)]">
        <div className="space-y-6 md:space-y-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage articles and users</p>
            </div>
            <Button 
              onClick={handleNewArticle}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
              size="lg"
            >
              <PlusCircle className="h-5 w-5" />
              <span>नया लेख अपलोड करें</span>
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button 
              onClick={handleNewArticle}
              className="p-4 md:p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 hover:border-primary/40 transition-colors text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">नया लेख</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Upload New Article</p>
            </button>
            
            <div className="p-4 md:p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20 text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">उपयोगकर्ता</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">User Management</p>
            </div>
          </div>

          {/* User Management Section */}
          {profile && <UserManagement currentUserProfile={profile} />}
        </div>
      </main>
      <Footer currentContent={currentContent} onNavigate={() => {}} onSelectCategory={() => {}} />
    </>
  );
};

export default DashboardPage;
