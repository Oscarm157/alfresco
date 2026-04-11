import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function createMissingEnvProxy() {
  return new Proxy(
    {},
    {
      get() {
        throw new Error('Supabase env vars are required.')
      },
    }
  )
}

export const supabase = (supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMissingEnvProxy()) as ReturnType<typeof createClient>
