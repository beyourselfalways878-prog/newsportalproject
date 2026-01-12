import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Search, BellDot, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const Header = ({
  currentContent,
  language,
  darkMode,
  toggleDarkMode,
  onLogoClick,
  onLoginClick,
}) => {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { searchPlaceholder, toggleTheme: toggleThemeText, siteName } = currentContent;

  // Debug logging - commented out to prevent infinite recursion
  // console.log('Header Debug:', { user: !!user, profile, loading });

  return (
    <header className="sticky top-0 z-50 shadow-2xl bg-gradient-to-r from-rose-500 via-fuchsia-500 to-indigo-600 backdrop-blur-lg border-b border-white/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3 border-b border-white/20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center"
          >
            <span className="text-xs sm:text-sm text-white/90">
              {new Date().toLocaleDateString('hi-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-1 sm:space-x-2"
          >
             {user ? (
              <div className="flex items-center space-x-2">
                  <span className="text-sm text-white/90 hidden md:block">
                    स्वागत है, {profile?.full_name || user.email}
                  </span>
                  {user && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate('/dashboard')}
                      className="text-white/90 hover:text-white bg-white/10 hover:bg-white/20 transition-colors"
                      aria-label="Admin Dashboard"
                    >
                      <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      console.log('Logout button clicked');
                      try {
                        await signOut();
                      } catch (error) {
                        console.error('Logout error:', error);
                      }
                    }}
                    className="text-white/90 hover:text-white bg-white/10 hover:bg-white/20 transition-colors"
                    aria-label="Log Out"
                  >
                    <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
              </div>
            ) : (
               <Button
                variant="ghost"
                size="sm"
                onClick={onLoginClick}
                className="flex items-center space-x-1 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Login"
              >
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm">लॉगिन</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="text-white/90 hover:text-white bg-white/10 hover:bg-white/20 transition-colors"
              aria-label={toggleThemeText}
            >
              {darkMode ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>
          </motion.div>
        </div>

        <div className="flex items-center justify-between py-4 md:py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <button onClick={onLogoClick} className="block hover:opacity-90 transition-opacity" aria-label="Back to homepage">
              <span className="text-2xl md:text-4xl font-extrabold text-white tracking-wider" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                {siteName}
              </span>
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center space-x-2 sm:space-x-4"
          >
            <div className="hidden md:flex items-center space-x-2 bg-white/10 rounded-full px-3 py-1.5 border border-transparent focus-within:border-white/50 transition-colors">
              <Search className="h-4 w-4 text-white/70" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="bg-transparent border-none outline-none text-sm placeholder-white/70 w-40 lg:w-56 text-white"
                aria-label={searchPlaceholder}
              />
            </div>
            <Button variant="ghost" size="icon" className="relative text-white/90 hover:text-white" aria-label="सूचनाएं">
              <BellDot className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="absolute top-0 right-0 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            </Button>
          </motion.div>
        </div>
      </div>
    </header>
  );
};

export default Header;
