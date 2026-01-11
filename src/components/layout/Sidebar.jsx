import React from 'react';
import { motion } from 'framer-motion';
import CategoryMenu from '@/components/sidebar/CategoryMenu';
import TrendingTopics from '@/components/sidebar/TrendingTopics';
import NewsletterSubscription from '@/components/sidebar/NewsletterSubscription';
import AdPlaceholder from '@/components/ads/AdPlaceholder';

const Sidebar = ({
  currentContent,
  language,
  selectedCategory,
  onSelectCategory,
  trendingTopics,
  email,
  setEmail,
  handleSubscribe
}) => {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="hidden lg:block lg:col-span-4 space-y-8 sticky top-24 self-start"
    >
      <CategoryMenu
        categories={Object.entries(currentContent.categories)}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        title={currentContent.categories.all}
      />
      <AdPlaceholder type="sidebarLarge" />
      <TrendingTopics
        trendingTopics={trendingTopics}
        title={currentContent.trending}
        language={language}
      />
      <NewsletterSubscription
        title={currentContent.subscribe}
        description={currentContent.subscribeDesc}
        emailPlaceholder={currentContent.emailPlaceholder}
        buttonText={currentContent.subscribeBtn}
        email={email}
        setEmail={setEmail}
        handleSubscribe={handleSubscribe}
      />
      <AdPlaceholder type="sidebarSmall" />
    </motion.aside>
  );
};

export default Sidebar;
