import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser, createApiClient } from '@/lib/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Autenticar usuário via cookies
    const auth = await authenticateUser(req, res);
    
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
    }

    const { userData } = auth;
    const supabase = createApiClient(req, res);

    let query = supabase
      .from('users')
      .select('*');

    // Filtrar por tenant se não for super_admin
    if (userData.role !== 'super_admin') {
      query = query.eq('tenant_id', userData.tenant_id);
    }

    const { data: users, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Internal server error: ' + error.message });
    }

    return res.status(200).json({ users });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 