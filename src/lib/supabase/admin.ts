import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required but not defined in environment variables');
  }

  if (!supabaseKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required but not defined in environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}

export function getServiceRoleClient() {
  // ... lógica existente ...
}

export function getAdminClient() {
  // ... lógica existente ...
} 