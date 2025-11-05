/**
 * Environment variable validation utility
 * Ensures all required environment variables are present and valid
 */

interface EnvVariables {
  GOOGLE_GENERATIVE_AI_API_KEY: string
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  NEON_DATABASE_URL: string
  NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL?: string
  NEXT_PUBLIC_PROD_SUPABASE_REDIRECT_URL?: string
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function validateEnv(): EnvVariables {
  const errors: string[] = []

  // Required variables
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const databaseUrl = process.env.NEON_DATABASE_URL

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    errors.push('GOOGLE_GENERATIVE_AI_API_KEY is required')
  }

  if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url') {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  } else if (!isValidUrl(supabaseUrl)) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL must be a valid URL')
  }

  if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key') {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }

  if (!databaseUrl || databaseUrl === 'your_neon_database_url') {
    errors.push('NEON_DATABASE_URL is required')
  } else if (!isValidUrl(databaseUrl)) {
    errors.push('NEON_DATABASE_URL must be a valid URL')
  }

  if (errors.length > 0) {
    console.error('❌ Environment variable validation failed:')
    errors.forEach(error => console.error(`  - ${error}`))
    throw new Error('Invalid environment variables. Please check your .env file.')
  }

  return {
    GOOGLE_GENERATIVE_AI_API_KEY: apiKey!,
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey!,
    NEON_DATABASE_URL: databaseUrl!,
    NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL,
    NEXT_PUBLIC_PROD_SUPABASE_REDIRECT_URL: process.env.NEXT_PUBLIC_PROD_SUPABASE_REDIRECT_URL,
  }
}

// Validate on module load (only in Node.js environment)
if (typeof window === 'undefined') {
  try {
    validateEnv()
    console.log('✅ Environment variables validated successfully')
  } catch (error) {
    // Don't throw during build time, just warn
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️  Environment validation warning:', error)
    }
  }
}
