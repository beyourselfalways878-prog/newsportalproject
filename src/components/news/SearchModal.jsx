import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const SearchModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);

    // Load recent searches from localStorage
    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem('recentSearches') || '[]');
            setRecentSearches(stored.slice(0, 5));
        } catch {
            setRecentSearches([]);
        }
    }, [isOpen]);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Debounced search
    const performSearch = useCallback(async (searchQuery) => {
        if (!searchQuery.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
            if (!response.ok) throw new Error('Search failed');
            const data = await response.json();
            setResults(data.data || []);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);

        // Debounce search
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            performSearch(value);
        }, 300);
    };

    const handleResultClick = (article) => {
        // Save to recent searches
        const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
        localStorage.setItem('recentSearches', JSON.stringify(updated));

        navigate(`/article/${article.id}`);
        onClose();
        setQuery('');
        setResults([]);
    };

    const handleRecentClick = (search) => {
        setQuery(search);
        performSearch(search);
    };

    const clearRecentSearches = () => {
        localStorage.removeItem('recentSearches');
        setRecentSearches([]);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="container mx-auto px-4 pt-20"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="max-w-2xl mx-auto bg-card rounded-xl shadow-2xl border border-border overflow-hidden">
                        {/* Search Input */}
                        <div className="flex items-center p-4 border-b border-border">
                            <Search className="h-5 w-5 text-muted-foreground mr-3" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={handleInputChange}
                                placeholder="खोजें... (Search articles)"
                                className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-muted-foreground"
                            />
                            {loading && <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />}
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Results / Recent Searches */}
                        <div className="max-h-[60vh] overflow-y-auto">
                            {results.length > 0 ? (
                                <div className="p-2">
                                    {results.map((article) => (
                                        <button
                                            key={article.id}
                                            onClick={() => handleResultClick(article)}
                                            className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex items-start gap-3"
                                        >
                                            {article.image_url && (
                                                <img
                                                    src={article.image_url}
                                                    alt=""
                                                    className="w-16 h-12 object-cover rounded"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-foreground line-clamp-1">
                                                    {article.title_hi || article.title}
                                                </h4>
                                                <p className="text-sm text-muted-foreground line-clamp-1">
                                                    {article.excerpt_hi || article.excerpt}
                                                </p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                                        </button>
                                    ))}
                                </div>
                            ) : query ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    {loading ? 'खोज रहे हैं...' : 'कोई परिणाम नहीं मिला'}
                                </div>
                            ) : recentSearches.length > 0 ? (
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-muted-foreground">हाल की खोज</span>
                                        <Button variant="ghost" size="sm" onClick={clearRecentSearches} className="text-xs">
                                            साफ़ करें
                                        </Button>
                                    </div>
                                    {recentSearches.map((search, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleRecentClick(search)}
                                            className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
                                        >
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span>{search}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    खोजने के लिए टाइप करें
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-border bg-muted/30 text-xs text-muted-foreground flex justify-between">
                            <span>↵ चयन करें</span>
                            <span>ESC बंद करें</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SearchModal;
