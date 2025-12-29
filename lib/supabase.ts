import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Note: For full type safety, generate types with:
// npx supabase gen types typescript --project-id your-project-id > lib/database.types.ts
// Then use: createClient<Database>(...)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
