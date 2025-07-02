import { NextApiRequest, NextApiResponse } from 'next';
import { withSuperAdmin, AuthResult } from '@/lib/auth/helpers';

async function handler(req: NextApiRequest, res: NextApiResponse, auth: AuthResult) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log de auditoria

    const { data: users, error } = await auth.supabase
      .from('users')
      .select('*');

    if (error) {
      console.error('[Users List] Erro ao buscar usuários:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    return res.status(200).json({ users });
  } catch (error) {
    console.error('[Users List] Erro inesperado:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withSuperAdmin(handler); 