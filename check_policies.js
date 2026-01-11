import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dwndkhllkhqihtedyaac.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Need service key for admin queries

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function checkPolicies() {
  // Check articles table policies
  const { data: articlePolicies, error: articleError } = await supabase.rpc('get_policies', { table_name: 'articles' })
  if (articleError) {
    console.error('Error fetching article policies:', articleError)
  } else {
    console.log('Articles table policies:', articlePolicies)
  }

  // Check storage policies for article-images bucket
  const { data: storagePolicies, error: storageError } = await supabase.storage.from('article-images').list('', { limit: 1 }) // Just to check access
  if (storageError) {
    console.error('Error accessing storage:', storageError)
  } else {
    console.log('Storage access OK')
  }

  // To get actual policies, need to query pg_policies
  const { data: policies, error } = await supabase.rpc('exec_sql', { sql: "SELECT * FROM pg_policies WHERE schemaname = 'public'" })
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('All policies:', policies)
  }
}

checkPolicies()