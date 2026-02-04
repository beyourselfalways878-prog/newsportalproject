import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import ProtectedRoute from '@/components/admin/ProtectedRoute.jsx';
import { Loader2 } from 'lucide-react';

const HomePage = lazy(() => import('@/pages/HomePage.jsx'));
const CategoryPage = lazy(() => import('@/pages/CategoryPage.jsx'));
const ArticlePage = lazy(() => import('@/pages/ArticlePage.jsx'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage.jsx'));
const ArticleUploaderPage = lazy(() => import('@/pages/ArticleUploaderPage.jsx'));
const MatchDetailPage = lazy(() => import('@/pages/MatchDetailPage.jsx'));

const PageFallback = () => (
  <div className="flex justify-center items-center min-h-[60vh]">
    <Loader2 className="h-16 w-16 animate-spin text-primary" />
  </div>
);

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen transition-colors duration-500 font-hindi">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/category/:categoryKey" element={<CategoryPage />} />
              <Route path="/article/:id" element={<ArticlePage />} />
              <Route path="/match/:matchId" element={<MatchDetailPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'superuser']}>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/article-uploader"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'superuser']}>
                    <ArticleUploaderPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
