import { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email e senha são obrigatórios',
        code: 'MISSING_CREDENTIALS'
      });
    }

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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Erro no login:', error);
      return res.status(401).json({ 
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    if (!data.user) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Buscar dados do usuário na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role, tenant_id, created_at, updated_at')
      .eq('email', data.user.email)
      .single();

    if (userError || !userData) {
      return res.status(500).json({ 
        error: 'Erro ao buscar dados do usuário',
        code: 'USER_DATA_ERROR'
      });
    }

    // Retornar dados do usuário (sem token, pois agora usamos cookies)
    return res.status(200).json({
      user: userData,
      message: 'Login realizado com sucesso'
    });

  } catch (error) {
    console.error('Erro interno no login:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
} 