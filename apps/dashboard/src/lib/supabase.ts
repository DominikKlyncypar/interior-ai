import { createClient } from '@supabase/supabase-js'

export const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY

  if (!url || !key) {
    throw new Error(`Missing Supabase config: url=${!!url} key=${!!key}`)
  }

  return createClient(url, key)
}