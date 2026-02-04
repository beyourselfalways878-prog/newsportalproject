/**
 * Article Utilities - Smart field extraction and generation
 * Handles DOCX parsing, SEO optimization, and auto-generation of missing fields
 */

// Extract keywords from text using frequency analysis
export function extractKeywords(text, limit = 5) {
    if (!text) return '';

    // Common stop words to exclude
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
        'है', 'हैं', 'का', 'की', 'को', 'में', 'पर', 'से', 'और', 'या', 'लेकिन', 'यह', 'वह',
        'जो', 'कि', 'तक', 'तो', 'भी', 'ही', 'न', 'नहीं', 'अगर', 'तब', 'जब', 'तक', 'तो'
    ]);

    // Extract words and count frequency
    const words = text
        .toLowerCase()
        .match(/\b[\w\u0900-\u097F]+\b/g) || [];

    const frequency = {};
    words.forEach(word => {
        if (word.length > 3 && !stopWords.has(word)) {
            frequency[word] = (frequency[word] || 0) + 1;
        }
    });

    // Sort by frequency and return top keywords
    return Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([word]) => word)
        .join(', ');
}

// Generate SEO title from article title
export function generateSeoTitle(title, category = '') {
    if (!title) return '';

    // Ensure title is under 60 characters for SEO
    let seoTitle = title;
    if (seoTitle.length > 60) {
        seoTitle = seoTitle.substring(0, 57) + '...';
    }

    // Add category if it fits
    if (category && seoTitle.length < 50) {
        seoTitle = `${seoTitle} | ${category}`;
    }

    return seoTitle;
}

// Generate excerpt from content
export function generateExcerpt(contentHtml, maxLength = 150) {
    if (!contentHtml) return '';

    // Remove HTML tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contentHtml;
    let text = tempDiv.textContent || tempDiv.innerText || '';

    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();

    // Truncate to maxLength
    if (text.length > maxLength) {
        text = text.substring(0, maxLength).trim() + '...';
    }

    return text;
}

// Generate alt text for images based on article content
export function generateImageAltText(title, category) {
    if (!title) return 'Article image';

    // Create descriptive alt text
    const categoryText = category ? ` - ${category}` : '';
    const altText = `${title}${categoryText}`;

    // Ensure it's not too long (max 125 characters for accessibility)
    if (altText.length > 125) {
        return altText.substring(0, 122) + '...';
    }

    return altText;
}

// Detect article category from content
export function detectCategory(text, title = '') {
    const categoryKeywords = {
        politics: ['चुनाव', 'राजनीति', 'सरकार', 'मंत्री', 'प्रधानमंत्री', 'संसद', 'विधानसभा', 'नेता', 'पार्टी', 'भाजपा', 'कांग्रेस', 'election', 'government', 'minister', 'parliament', 'political'],
        sports: ['खेल', 'क्रिकेट', 'फुटबॉल', 'हॉकी', 'टेनिस', 'ओलंपिक', 'खिलाड़ी', 'मैच', 'टूर्नामेंट', 'विजेता', 'cricket', 'football', 'sports', 'match', 'player', 'team'],
        technology: ['तकनीक', 'प्रौद्योगिकी', 'स्मार्टफोन', 'इंटरनेट', 'एआई', 'कंप्यूटर', 'सॉफ्टवेयर', 'ऐप', 'गूगल', 'एप्पल', 'technology', 'AI', 'software', 'app', 'digital', 'tech'],
        business: ['व्यापार', 'अर्थव्यवस्था', 'बाजार', 'शेयर', 'निवेश', 'कंपनी', 'बिजनेस', 'economy', 'business', 'market', 'stock', 'investment', 'company'],
        entertainment: ['मनोरंजन', 'बॉलीवुड', 'फिल्म', 'अभिनेता', 'संगीत', 'गीत', 'सिनेमा', 'entertainment', 'bollywood', 'movie', 'actor', 'music', 'film'],
        health: ['स्वास्थ्य', 'चिकित्सा', 'बीमारी', 'डॉक्टर', 'दवा', 'अस्पताल', 'health', 'medical', 'disease', 'doctor', 'medicine', 'hospital'],
        education: ['शिक्षा', 'स्कूल', 'कॉलेज', 'विश्वविद्यालय', 'परीक्षा', 'छात्र', 'education', 'school', 'college', 'university', 'exam', 'student'],
    };

    const combinedText = `${text} ${title}`.toLowerCase();
    const scores = {};

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        scores[category] = keywords.filter(keyword => combinedText.includes(keyword.toLowerCase())).length;
    }

    // Return category with highest score
    const topCategory = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    return topCategory && topCategory[1] > 0 ? topCategory[0] : 'indian';
}

// Check if text is breaking news
export function detectBreakingNews(text, title = '') {
    const breakingKeywords = ['तुरंत', 'अभी', 'लाइव', 'ब्रेकिंग', 'आपातकाल', 'घटना', 'immediately', 'breaking', 'live', 'urgent', 'emergency', 'incident'];
    const combinedText = `${text} ${title}`.toLowerCase();
    return breakingKeywords.some(keyword => combinedText.includes(keyword.toLowerCase()));
}

// Validate article data
export function validateArticleData(data) {
    const errors = [];

    if (!data.title_hi || data.title_hi.trim().length === 0) {
        errors.push('शीर्षक आवश्यक है (Title is required)');
    }

    if (!data.content_hi || data.content_hi.trim().length === 0) {
        errors.push('सामग्री आवश्यक है (Content is required)');
    }

    if (data.title_hi && data.title_hi.length < 5) {
        errors.push('शीर्षक कम से कम 5 वर्ण होना चाहिए (Title must be at least 5 characters)');
    }

    if (data.seo_keywords_hi && data.seo_keywords_hi.length > 160) {
        errors.push('कीवर्ड 160 वर्ण से कम होने चाहिए (Keywords must be less than 160 characters)');
    }

    return errors;
}

// Calculate SEO score
export function calculateSeoScore(data) {
    let score = 0;
    const maxScore = 100;

    // Title (20 points)
    if (data.title_hi && data.title_hi.length >= 10 && data.title_hi.length <= 60) {
        score += 20;
    } else if (data.title_hi) {
        score += 10;
    }

    // Excerpt (15 points)
    if (data.excerpt_hi && data.excerpt_hi.length >= 50 && data.excerpt_hi.length <= 160) {
        score += 15;
    } else if (data.excerpt_hi) {
        score += 7;
    }

    // Content (25 points)
    if (data.content_hi) {
        const contentLength = data.content_hi.replace(/<[^>]*>/g, '').length;
        if (contentLength >= 300) {
            score += 25;
        } else if (contentLength >= 150) {
            score += 15;
        } else {
            score += 5;
        }
    }

    // SEO Title (15 points)
    if (data.seo_title_hi && data.seo_title_hi.length >= 10 && data.seo_title_hi.length <= 60) {
        score += 15;
    } else if (data.seo_title_hi) {
        score += 7;
    }

    // Keywords (15 points)
    if (data.seo_keywords_hi && data.seo_keywords_hi.split(',').length >= 3) {
        score += 15;
    } else if (data.seo_keywords_hi) {
        score += 7;
    }

    // Image Alt Text (10 points)
    if (data.image_alt_text_hi && data.image_alt_text_hi.length >= 10) {
        score += 10;
    }

    return Math.min(score, maxScore);
}

// Get SEO score color
export function getSeoScoreColor(score) {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
}

// Get SEO score label
export function getSeoScoreLabel(score) {
    if (score >= 80) return 'उत्कृष्ट (Excellent)';
    if (score >= 60) return 'अच्छा (Good)';
    if (score >= 40) return 'औसत (Fair)';
    return 'कमजोर (Poor)';
}

// Auto-fill missing fields based on available data
export function autoFillMissingFields(data, contentHtml) {
    const filled = { ...data };

    // Generate excerpt if missing
    if (!filled.excerpt_hi && contentHtml) {
        filled.excerpt_hi = generateExcerpt(contentHtml);
    }

    // Generate SEO title if missing
    if (!filled.seo_title_hi && filled.title_hi) {
        filled.seo_title_hi = generateSeoTitle(filled.title_hi, filled.category);
    }

    // Generate keywords if missing
    if (!filled.seo_keywords_hi && contentHtml) {
        const keywords = extractKeywords(contentHtml + ' ' + filled.title_hi);
        if (keywords) {
            filled.seo_keywords_hi = keywords;
        }
    }

    // Generate image alt text if missing
    if (!filled.image_alt_text_hi && filled.title_hi) {
        filled.image_alt_text_hi = generateImageAltText(filled.title_hi, filled.category);
    }

    // Detect category if not set
    if (!filled.category || filled.category === 'indian') {
        const detectedCategory = detectCategory(contentHtml, filled.title_hi);
        if (detectedCategory !== 'indian') {
            filled.category = detectedCategory;
        }
    }

    // Detect breaking news
    if (!filled.is_breaking && contentHtml) {
        filled.is_breaking = detectBreakingNews(contentHtml, filled.title_hi);
    }

    return filled;
}
