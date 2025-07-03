import { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
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
          cookiesToSet.forEach(({ name, value }) => {
            res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return res.status(401).json({ error: error.message });
  }

  // Buscar o usuário na tabela users e checar status
  const { data: userDb, error: userDbError } = await supabase
    .from('users')
    .select('id, email, name, role, tenant_id, status')
    .eq('email', email)
    .single();

  if (userDbError || !userDb) {
    return res.status(404).json({ error: 'Usuário não encontrado no banco de dados.' });
  }

  if (userDb.status !== 'active') {
    return res.status(403).json({ error: 'Seu usuário está inativo. Entre em contato com o administrador.' });
  }

  // Força o set de cookies de sessão
  await supabase.auth.getUser();

  return res.status(200).json({ user: data.user });
} 