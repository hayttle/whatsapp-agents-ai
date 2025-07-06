import { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'super_admin';
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResult {
  user: AuthenticatedUser;
  supabase: ReturnType<typeof createServerClient>;
}

/**
 * Helper para autenticar usuário via cookies (SSR)
 * Retorna os dados do usuário autenticado ou null se não autenticado
 */
export async function authenticateUser(
  req: NextApiRequest, 
  res: NextApiResponse
): Promise<AuthResult | null> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return Object.entries(req.cookies).map(([name, value]) => ({ name, value: value || '' }));
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieOptions = {
                Path: '/',
                HttpOnly: true,
                SameSite: 'Lax' as const,
                Secure: process.env.NODE_ENV === 'production',
                ...options
              };
              
              const cookieString = Object.entries(cookieOptions)
                .map(([key, val]) => `${key}=${val}`)
                .join('; ');
              
              res.setHeader('Set-Cookie', `${name}=${value}; ${cookieString}`);
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('Erro na autenticação Supabase:', authError);
      return null;
    }

    // Buscar dados do usuário na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role, tenant_id, created_at, updated_at')
      .eq('email', user.email)
      .single();

    if (userError || !userData) {
      console.log('Erro ao buscar dados do usuário:', userError);
      return null;
    }

    return {
      user: userData as AuthenticatedUser,
      supabase
    };
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return null;
  }
}

/**
 * Helper para verificar se o usuário tem um role específico
 */
export function requireRole(
  requiredRole: 'user' | 'super_admin',
  userRole?: string
): boolean {
  if (!userRole) return false;
  
  const roleHierarchy = {
    'user': 1,
    'super_admin': 2
  };

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole];

  return userLevel >= requiredLevel;
}

/**
 * Helper para verificar se o usuário é super_admin
 */
export function isSuperAdmin(userRole?: string): boolean {
  return requireRole('super_admin', userRole);
}

/**
 * Middleware para endpoints que requerem autenticação
 */
export function withAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, auth: AuthResult) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const auth = await authenticateUser(req, res);
    
    if (!auth) {
      return res.status(401).json({ 
        error: 'Unauthorized - Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    return handler(req, res, auth);
  };
}

/**
 * Middleware para endpoints que requerem role específico
 */
export function withRole(
  requiredRole: 'user' | 'super_admin',
  handler: (req: NextApiRequest, res: NextApiResponse, auth: AuthResult) => Promise<void>
) {
  return withAuth(async (req: NextApiRequest, res: NextApiResponse, auth: AuthResult) => {
    if (!requireRole(requiredRole, auth.user.role)) {
      return res.status(403).json({ 
        error: `Insufficient permissions - Required role: ${requiredRole}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    return handler(req, res, auth);
  });
}

/**
 * Middleware para endpoints que requerem super_admin
 */
export function withSuperAdmin(
  handler: (req: NextApiRequest, res: NextApiResponse, auth: AuthResult) => Promise<void>
) {
  return withRole('super_admin', handler);
}

 