import { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Erro no logout:', error);
      return res.status(500).json({ 
        error: 'Erro ao fazer logout',
        code: 'LOGOUT_ERROR'
      });
    }

    return res.status(200).json({ 
      message: 'Logout realizado com sucesso' 
    });

  } catch (error) {
    console.error('Erro interno no logout:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
} 