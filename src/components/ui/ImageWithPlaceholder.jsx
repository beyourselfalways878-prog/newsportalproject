import React, { useState, useRef, useEffect } from 'react';

/**
 * ImageWithPlaceholder - Lazy loading image with blur-up effect
 * 
 * Features:
 * - Native lazy loading
 * - Blur placeholder during load
 * - Graceful error fallback
 * - Smooth fade-in transition
 */
const ImageWithPlaceholder = ({
    src,
    alt,
    className = '',
    wrapperClassName = '',
    aspectRatio = '16/9',
    fallbackSrc = null,
    ...props
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef(null);

    // Check if image is already cached
    useEffect(() => {
        if (imgRef.current?.complete && imgRef.current?.naturalHeight !== 0) {
            setIsLoaded(true);
        }
    }, [src]);

    const handleLoad = () => {
        setIsLoaded(true);
        setHasError(false);
    };

    const handleError = () => {
        setHasError(true);
        setIsLoaded(true);
    };

    // Reset states when src changes
    useEffect(() => {
        setIsLoaded(false);
        setHasError(false);
    }, [src]);

    if (hasError && !fallbackSrc) {
        return (
            <div
                className={`bg-muted flex items-center justify-center ${wrapperClassName}`}
                style={{ aspectRatio }}
            >
                <div className="text-muted-foreground text-sm flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>छवि उपलब्ध नहीं</span>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`relative overflow-hidden ${wrapperClassName}`}
            style={{ aspectRatio }}
        >
            {/* Blur placeholder */}
            <div
                className={`absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted shimmer transition-opacity duration-500 ${isLoaded ? 'opacity-0' : 'opacity-100'
                    }`}
            />

            {/* Actual image */}
            <img
                ref={imgRef}
                src={hasError && fallbackSrc ? fallbackSrc : src}
                alt={alt}
                loading="lazy"
                decoding="async"
                onLoad={handleLoad}
                onError={handleError}
                className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'
                    } ${className}`}
                {...props}
            />
        </div>
    );
};

export default ImageWithPlaceholder;
