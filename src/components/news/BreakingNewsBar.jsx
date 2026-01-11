import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

const BreakingNewsBar = ({ breakingNews, breakingText, onArticleClick }) => {
  if (!breakingNews || breakingNews.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#0B1D4D] text-white py-2.5 shadow-md overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center">
          <motion.span
            initial={{ scale:0, opacity:0 }}
            animate={{ scale:1, opacity:1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
            className="bg-white/15 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-bold mr-3 sm:mr-4 flex items-center notranslate ring-1 ring-white/25"
          >
            <Zap size={14} className="mr-1.5" />
            {breakingText}
          </motion.span>
          <div className="breaking-news-scroll whitespace-nowrap flex-grow">
            {breakingNews.map((item, index) => (
              <span
                key={item.id || index}
                className="mr-10 text-sm sm:text-base hover:underline cursor-pointer"
                onClick={() => onArticleClick(item)}
              >
                {item.title}
              </span>
            ))}
             {breakingNews.map((item, index) => (
              <span
                key={`dup-${item.id || index}`}
                className="mr-10 text-sm sm:text-base hover:underline cursor-pointer"
                aria-hidden="true"
                onClick={() => onArticleClick(item)}
              >
                {item.title}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakingNewsBar;
