import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing service role key or URL in environment');
  process.exit(2);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

(async () => {
  try {
    console.log('Uploading tiny test PNG to article-images...');
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(base64, 'base64');
    const fileName = `tests/test-image-${Date.now()}.png`;

    const { data: uploadData, error: uploadError } = await admin.storage.from('article-images').upload(fileName, buffer, { contentType: 'image/png' });
    if (uploadError) {
      console.error('Upload error:', uploadError);
      process.exit(3);
    }
    console.log('Upload succeeded:', uploadData.path);

    const { data: urlData } = admin.storage.from('article-images').getPublicUrl(uploadData.path);
    const publicUrl = urlData.publicUrl;
    console.log('Public URL:', publicUrl);

    console.log('Inserting test article referencing uploaded image...');
    const now = new Date().toISOString();
    const { data: insertData, error: insertError } = await admin.from('articles').insert([{ 
      title_hi: `Roundtrip Test ${Date.now()}`,
      excerpt_hi: 'Test insert to verify upload flow',
      content_hi: `<p>Test article with image: <img src="${publicUrl}" /></p>`,
      category: 'indian',
      author: 'Automated Test',
      location: 'Test',
      image_url: publicUrl,
      image_alt_text_hi: 'Test image',
      seo_title_hi: 'Test',
      seo_keywords_hi: 'test,upload',
      published_at: now,
      updated_at: now
    }]).select().single();

    if (insertError) {
      console.error('Insert error:', insertError);
      // attempt cleanup of file
      try { await admin.storage.from('article-images').remove([uploadData.path]); } catch (e) {}
      process.exit(4);
    }

    console.log('Insert succeeded. Article id:', insertData.id);

    // Verify article exists via select
    const { data: found, error: findErr } = await admin.from('articles').select('*').eq('id', insertData.id).single();
    if (findErr) {
      console.error('Error fetching inserted article:', findErr);
      process.exit(5);
    }
    console.log('Fetched article:', { id: found.id, title: found.title_hi, image_url: found.image_url });

    // Cleanup: delete inserted article and uploaded image
    console.log('Cleaning up test article and image...');
    await admin.from('articles').delete().eq('id', insertData.id);
    await admin.storage.from('article-images').remove([uploadData.path]);

    console.log('Roundtrip upload test completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(99);
  }
})();