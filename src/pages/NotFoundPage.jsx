import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFoundPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/30 to-background">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-md"
            >
                {/* 404 Number */}
                <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="relative mb-8"
                >
                    <span className="text-[150px] font-extrabold leading-none bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                        404
                    </span>
                    <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-primary via-accent to-primary" />
                </motion.div>

                {/* Hindi Message */}
                <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl md:text-4xl font-bold mb-4 text-foreground"
                >
                    पेज नहीं मिला
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-muted-foreground text-lg mb-8"
                >
                    क्षमा करें, जो पेज आप ढूंढ रहे हैं वह मौजूद नहीं है या हटा दिया गया है।
                </motion.p>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <Button asChild size="lg" className="btn-gradient">
                        <Link to="/">
                            <Home className="mr-2 h-5 w-5" />
                            होम पेज पर जाएं
                        </Link>
                    </Button>

                    <Button asChild variant="outline" size="lg">
                        <Link to="/" onClick={() => window.history.back()}>
                            <ArrowLeft className="mr-2 h-5 w-5" />
                            वापस जाएं
                        </Link>
                    </Button>
                </motion.div>

                {/* Decorative Elements */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-12 text-sm text-muted-foreground"
                >
                    <p>अगर आपको लगता है कि यह एक गलती है, तो कृपया हमसे संपर्क करें।</p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default NotFoundPage;
