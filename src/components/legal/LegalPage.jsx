import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { legalData } from '@/lib/legalData';

const LegalPage = ({ page, language, onBack }) => {
  const content = legalData[language][page];

  if (!content) {
    return (
      <div className="bg-card/70 backdrop-blur-md rounded-xl p-8 text-center">
        <h1 className="text-2xl font-bold">Content Not Found</h1>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="bg-card/70 backdrop-blur-md rounded-xl shadow-xl p-6 sm:p-8 border border-white/10"
    >
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={onBack} className="text-primary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === 'hi' ? 'वापस' : 'Back'}
        </Button>
      </div>

      <header className="mb-8 border-b border-white/10 pb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
          {content.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          {language === 'hi' ? 'अंतिम अपडेट: 11 जनवरी 2026' : 'Last Updated: January 11, 2026'}
        </p>
      </header>

      <div
        className="prose prose-lg dark:prose-invert max-w-none leading-relaxed text-foreground article-content"
        dangerouslySetInnerHTML={{ __html: content.content }}
      />
    </motion.div>
  );
};

export default LegalPage;
