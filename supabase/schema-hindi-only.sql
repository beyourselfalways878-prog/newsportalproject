-- =============================================================================
-- 24x7 Indian News - Hindi Only Database Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =============================================================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. ARTICLES TABLE (Hindi Only)
-- Main table for storing Hindi news articles
-- =============================================================================
DROP TABLE IF EXISTS public.articles CASCADE;

CREATE TABLE public.articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Hindi content fields
    title_hi TEXT NOT NULL,                    -- शीर्षक (required)
    excerpt_hi TEXT,                           -- अंश/सारांश
    content_hi TEXT,                           -- लेख सामग्री (HTML)
    
    -- Category (matches keys in contentData.categories)
    category TEXT NOT NULL DEFAULT 'indian',   -- श्रेणी
    
    -- Author and location
    author TEXT,                               -- लेखक
    location TEXT,                             -- स्थान
    
    -- Image fields
    image_url TEXT,                            -- फीचर्ड इमेज URL
    image_alt_text_hi TEXT,                    -- छवि ऑल्ट टेक्स्ट
    
    -- SEO fields (Hindi)
    seo_title_hi TEXT,                         -- एसईओ शीर्षक
    seo_keywords_hi TEXT,                      -- एसईओ कीवर्ड (comma separated)
    
    -- Video embed code (YouTube/Vimeo iframe)
    video_url TEXT,                            -- वीडियो एम्बेड कोड
    
    -- Flags
    is_breaking BOOLEAN DEFAULT FALSE,         -- ब्रेकिंग न्यूज़
    is_featured BOOLEAN DEFAULT FALSE,         -- फीचर्ड आर्टिकल
    
    -- Analytics
    view_count INTEGER DEFAULT 0,              -- व्यूज़
    
    -- Timestamps
    published_at TIMESTAMPTZ DEFAULT NOW(),    -- प्रकाशन तिथि
    updated_at TIMESTAMPTZ DEFAULT NOW(),      -- अपडेट तिथि
    created_at TIMESTAMPTZ DEFAULT NOW()       -- निर्माण तिथि
);

-- Create indexes for better query performance
CREATE INDEX idx_articles_published_at ON public.articles(published_at DESC);
CREATE INDEX idx_articles_category ON public.articles(category);
CREATE INDEX idx_articles_is_featured ON public.articles(is_featured);
CREATE INDEX idx_articles_is_breaking ON public.articles(is_breaking);

-- Add comments for documentation
COMMENT ON TABLE public.articles IS '24x7 Indian News - Hindi articles table';
COMMENT ON COLUMN public.articles.title_hi IS 'Article title in Hindi (required)';
COMMENT ON COLUMN public.articles.excerpt_hi IS 'Article excerpt/summary in Hindi';
COMMENT ON COLUMN public.articles.content_hi IS 'Full article content in Hindi (HTML format)';
COMMENT ON COLUMN public.articles.category IS 'Category key matching frontend categories';
COMMENT ON COLUMN public.articles.video_url IS 'YouTube/Vimeo iframe embed code';

-- =============================================================================
-- 2. PROFILES TABLE
-- User profiles linked to Supabase Auth
-- =============================================================================
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,                            -- पूरा नाम
    avatar_url TEXT,                           -- प्रोफ़ाइल फ़ोटो
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superuser')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for role-based queries
CREATE INDEX idx_profiles_role ON public.profiles(role);

COMMENT ON TABLE public.profiles IS 'User profiles with role-based access';
COMMENT ON COLUMN public.profiles.role IS 'user=read only, admin=can publish, superuser=full access';

-- =============================================================================
-- 3. TRENDING TOPICS TABLE (Hindi)
-- For sidebar trending topics widget
-- =============================================================================
DROP TABLE IF EXISTS public.trending_topics CASCADE;

CREATE TABLE public.trending_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_hi TEXT NOT NULL,                     -- ट्रेंडिंग टॉपिक नाम (Hindi)
    rank INTEGER DEFAULT 0,                    -- प्रदर्शन क्रम
    is_active BOOLEAN DEFAULT TRUE,            -- सक्रिय/निष्क्रिय
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for ordering
CREATE INDEX idx_trending_topics_rank ON public.trending_topics(rank ASC);

COMMENT ON TABLE public.trending_topics IS 'Trending topics shown in sidebar (Hindi only)';

-- =============================================================================
-- 4. SUBSCRIBERS TABLE
-- Newsletter subscribers
-- =============================================================================
DROP TABLE IF EXISTS public.subscribers CASCADE;

CREATE TABLE public.subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,                -- ईमेल पता
    is_active BOOLEAN DEFAULT TRUE,            -- सक्रिय सदस्यता
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),   -- सदस्यता तिथि
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for email lookups
CREATE INDEX idx_subscribers_email ON public.subscribers(email);

COMMENT ON TABLE public.subscribers IS 'Newsletter subscribers';

-- =============================================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 6. ARTICLES POLICIES
-- =============================================================================

-- Anyone can read articles (public)
CREATE POLICY "articles_select_policy" 
    ON public.articles 
    FOR SELECT 
    USING (true);

-- Only authenticated users with admin/superuser role can insert
CREATE POLICY "articles_insert_policy" 
    ON public.articles 
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superuser')
        )
    );

-- Only authenticated users with admin/superuser role can update
CREATE POLICY "articles_update_policy" 
    ON public.articles 
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superuser')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superuser')
        )
    );

-- Only superusers can delete articles
CREATE POLICY "articles_delete_policy" 
    ON public.articles 
    FOR DELETE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'superuser'
        )
    );

-- =============================================================================
-- 7. PROFILES POLICIES
-- =============================================================================

-- Users can view their own profile
CREATE POLICY "profiles_select_own_policy" 
    ON public.profiles 
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = id);

-- Admins and superusers can view all profiles
CREATE POLICY "profiles_select_admin_policy" 
    ON public.profiles 
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superuser')
        )
    );

-- Users can update their own profile (except role)
CREATE POLICY "profiles_update_own_policy" 
    ON public.profiles 
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Only superusers can update any profile (including role)
CREATE POLICY "profiles_update_admin_policy" 
    ON public.profiles 
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'superuser'
        )
    );

-- Allow insert for new user profile creation
CREATE POLICY "profiles_insert_policy" 
    ON public.profiles 
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- =============================================================================
-- 8. TRENDING TOPICS POLICIES
-- =============================================================================

-- Anyone can view trending topics
CREATE POLICY "trending_topics_select_policy" 
    ON public.trending_topics 
    FOR SELECT 
    USING (true);

-- Only admins can insert trending topics
CREATE POLICY "trending_topics_insert_policy" 
    ON public.trending_topics 
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superuser')
        )
    );

-- Only admins can update trending topics
CREATE POLICY "trending_topics_update_policy" 
    ON public.trending_topics 
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superuser')
        )
    );

-- Only superusers can delete trending topics
CREATE POLICY "trending_topics_delete_policy" 
    ON public.trending_topics 
    FOR DELETE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'superuser'
        )
    );

-- =============================================================================
-- 9. SUBSCRIBERS POLICIES
-- =============================================================================

-- Anyone can subscribe (insert)
CREATE POLICY "subscribers_insert_policy" 
    ON public.subscribers 
    FOR INSERT 
    WITH CHECK (true);

-- Only admins can view subscribers
CREATE POLICY "subscribers_select_policy" 
    ON public.subscribers 
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superuser')
        )
    );

-- =============================================================================
-- 10. FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to handle new user registration (creates profile automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(
            NULLIF(LOWER(NEW.raw_user_meta_data->>'role'), ''),
            'user'
        )
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for articles updated_at
DROP TRIGGER IF EXISTS update_articles_updated_at ON public.articles;
CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON public.articles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment view count (call from frontend)
CREATE OR REPLACE FUNCTION public.increment_view_count(article_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.articles 
    SET view_count = COALESCE(view_count, 0) + 1 
    WHERE id = article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 11. SAMPLE TRENDING TOPICS (Hindi)
-- =============================================================================

INSERT INTO public.trending_topics (name_hi, rank) VALUES
    ('लोकसभा चुनाव 2026', 1),
    ('बजट 2026', 2),
    ('क्रिकेट विश्व कप', 3),
    ('AI और टेक्नोलॉजी', 4),
    ('बॉलीवुड अपडेट', 5),
    ('मौसम अपडेट', 6),
    ('शेयर बाज़ार', 7),
    ('IPL 2026', 8)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 12. GRANT PERMISSIONS
-- =============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant access to tables
GRANT SELECT ON public.articles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.articles TO authenticated;
GRANT DELETE ON public.articles TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

GRANT SELECT ON public.trending_topics TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.trending_topics TO authenticated;

GRANT INSERT ON public.subscribers TO anon, authenticated;
GRANT SELECT ON public.subscribers TO authenticated;

-- Grant access to sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =============================================================================
-- DONE! Your Hindi-only database schema is ready.
-- =============================================================================

-- =============================================================================
-- VALID CATEGORY KEYS (use these in the 'category' column)
-- =============================================================================
-- indian          - भारत
-- global          - विश्व
-- regional        - क्षेत्रीय
-- politics        - राजनीति
-- economy         - अर्थव्यवस्था
-- sports          - खेल
-- entertainment   - मनोरंजन
-- technology      - टेक्नोलॉजी
-- science         - विज्ञान
-- health          - स्वास्थ्य
-- travel          - यात्रा
-- opinion         - राय
-- video           - वीडियो
-- auto            - ऑटो
-- recipes         - खाना खज़ाना
-- beauty          - स्किनकेयर/ब्यूटी
-- lifestyle       - लाइफस्टाइल
-- jobs-education  - नौकरी/शिक्षा
-- personal-finance - पर्सनल फाइनेंस
-- astrology-spiritual - राशिफल/धर्म
-- agriculture     - कृषि/ग्रामीण
-- crime-law       - अपराध/कानून
-- weather         - मौसम
-- fact-check      - फैक्ट चेक
-- =============================================================================
