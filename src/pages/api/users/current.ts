import { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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
            cookiesToSet.forEach(({ name, value }) => {
              res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`);
            });
          },
        },
      }
    );

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Buscar dados do usuário na tabela users
    const { error, data } = await supabase
      .from('users')
      .select('id, email, name, role, tenant_id, created_at, updated_at')
      .eq('email', user.email)
      .single();

    if (error && error.code === 'PGRST116') {
      // Usuário não existe, criar
      const insertData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert(insertData)
        .select()
        .single();
      if (insertError) {
        return res.status(500).json({ error: 'Failed to create user', details: insertError });
      }
      return res.status(200).json({ user: newUser, role: newUser.role });
    } else if (error) {
      return res.status(404).json({ error: 'User not found', details: error });
    }

    if (!data) {
      return res.status(404).json({ error: 'User data not found' });
    }

    return res.status(200).json({ user: data, role: data.role });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 