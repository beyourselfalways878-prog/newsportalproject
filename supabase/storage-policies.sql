-- =============================================================================
-- 24x7 Indian News - Storage Buckets Setup
-- Run this in your Supabase SQL Editor AFTER creating the buckets in the UI
-- OR use the Supabase Dashboard > Storage > Create Bucket
-- =============================================================================

-- =============================================================================
-- OPTION 1: Create buckets via SQL (if storage schema is accessible)
-- =============================================================================

-- Note: In Supabase, bucket creation is typically done via Dashboard or API
-- The SQL below shows the structure for reference

-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES 
--     ('article-images', 'article-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
--     ('article-videos', 'article-videos', true, 104857600, ARRAY['video/mp4', 'video/webm', 'video/ogg'])
-- ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- OPTION 2: Use Supabase Dashboard (RECOMMENDED)
-- =============================================================================

-- Go to: Supabase Dashboard > Storage > New Bucket
-- 
-- Bucket 1: article-images
--   - Name: article-images
--   - Public bucket: YES (checked)
--   - File size limit: 10 MB (10485760 bytes)
--   - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
--
-- Bucket 2: article-videos
--   - Name: article-videos
--   - Public bucket: YES (checked)
--   - File size limit: 100 MB (104857600 bytes)
--   - Allowed MIME types: video/mp4, video/webm, video/ogg

-- =============================================================================
-- STORAGE POLICIES (Run this after creating buckets)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ARTICLE-IMAGES BUCKET POLICIES
-- -----------------------------------------------------------------------------

-- Allow public read access to all images
CREATE POLICY "Public Access to article-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload article-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'article-images'
    AND (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superuser')
        )
    )
);

-- Allow authenticated admins to update images
CREATE POLICY "Admins can update article-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'article-images'
    AND (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superuser')
        )
    )
);

-- Allow superusers to delete images
CREATE POLICY "Superusers can delete article-images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'article-images'
    AND (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'superuser'
        )
    )
);

-- -----------------------------------------------------------------------------
-- ARTICLE-VIDEOS BUCKET POLICIES
-- -----------------------------------------------------------------------------

-- Allow public read access to all videos
CREATE POLICY "Public Access to article-videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-videos');

-- Allow authenticated admins to upload videos
CREATE POLICY "Authenticated users can upload article-videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'article-videos'
    AND (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superuser')
        )
    )
);

-- Allow authenticated admins to update videos
CREATE POLICY "Admins can update article-videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'article-videos'
    AND (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superuser')
        )
    )
);

-- Allow superusers to delete videos
CREATE POLICY "Superusers can delete article-videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'article-videos'
    AND (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'superuser'
        )
    )
);

-- =============================================================================
-- DONE! Your storage buckets are now configured.
-- =============================================================================
