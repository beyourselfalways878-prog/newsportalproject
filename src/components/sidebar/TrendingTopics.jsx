import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

const TrendingTopics = ({ trendingTopics, title }) => {
  if (!trendingTopics || trendingTopics.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-xl shadow-lg p-6 border border-border/50">
      <h3 className="text-xl font-bold mb-5 flex items-center text-foreground">
        <Flame className="h-6 w-6 mr-2 text-accent" />
        {title}
      </h3>
      <div className="space-y-3.5">
        {trendingTopics.map((topic, index) => {
          const topicName = topic.name_hi;
          if (!topicName) return null;

          return (
            <motion.a
              key={index}
              href="#"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
              className="group flex items-start space-x-3 p-2.5 rounded-lg hover:bg-muted/50 transition-all duration-200"
            >
              <span className="mt-0.5 bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md group-hover:scale-110 transition-transform">
                {index + 1}
              </span>
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors flex-1">
                {topicName}
              </span>
            </motion.a>
          );
        })}
      </div>
    </div>
  );
};

export default TrendingTopics;

