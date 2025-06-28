/// <reference types="node" />
import { NextApiRequest, NextApiResponse } from 'next'
import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js';

export interface AuthenticatedUser {
  user: User;
  userData: {
    id: string;
    role: string;
    tenant_id: string;
  };
}

export async function authenticateUser(req: NextApiRequest, res: NextApiResponse): Promise<AuthenticatedUser | null> {
  try {
    // Criar client Supabase com cookies (mesmo padrão do middleware)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return Object.entries(req.cookies).map(([name, value]) => ({
              name,
              value: value || '',
            }));
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; SameSite=Lax`);
            });
          },
        },
      }
    );

    // Verificar autenticação do usuário via cookies
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return null;
    }

    // Buscar dados do usuário autenticado
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, tenant_id, email, id')
      .eq('email', (user as { email?: string }).email)
      .single();

    if (userError || !userData) {
      return null;
    }

    return { user, userData };
  } catch {
    return null;
  }
}

export function createApiClient(req: NextApiRequest, res: NextApiResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.entries(req.cookies).map(([name, value]) => ({
            name,
            value: value || '',
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; SameSite=Lax`);
          });
        },
      },
    }
  );
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
} 