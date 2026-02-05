import React from 'react';

const ArticleCardSkeleton = () => {
    return (
        <article className="bg-card/70 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10 flex flex-col md:flex-row animate-pulse">
            {/* Image Skeleton */}
            <div className="md:w-2/5 aspect-video md:aspect-auto bg-muted shimmer" />

            {/* Content Skeleton */}
            <div className="p-5 md:p-6 flex flex-col flex-grow md:w-3/5 space-y-4">
                {/* Category */}
                <div className="h-4 w-20 bg-muted rounded shimmer" />

                {/* Title */}
                <div className="space-y-2">
                    <div className="h-6 bg-muted rounded w-full shimmer" />
                    <div className="h-6 bg-muted rounded w-3/4 shimmer" />
                </div>

                {/* Excerpt */}
                <div className="space-y-2 flex-grow">
                    <div className="h-4 bg-muted rounded w-full shimmer" />
                    <div className="h-4 bg-muted rounded w-full shimmer" />
                    <div className="h-4 bg-muted rounded w-2/3 shimmer" />
                </div>

                {/* Meta */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="h-4 w-24 bg-muted rounded shimmer" />
                        <div className="h-4 w-16 bg-muted rounded shimmer" />
                    </div>
                    <div className="h-4 w-20 bg-muted rounded shimmer" />
                </div>
            </div>
        </article>
    );
};

export const ArticleGridSkeleton = ({ count = 3 }) => {
    return (
        <div className="space-y-6">
            {Array.from({ length: count }).map((_, i) => (
                <ArticleCardSkeleton key={i} />
            ))}
        </div>
    );
};

export default ArticleCardSkeleton;
