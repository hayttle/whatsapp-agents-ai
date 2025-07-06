import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthResult } from '@/lib/auth/helpers';

async function handler(req: NextApiRequest, res: NextApiResponse, auth: AuthResult) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user, supabase } = auth;

    let query = supabase
      .from('whatsapp_instances')
      .select('*');

    // Filtrar por tenant se não for super_admin
    if (user.role !== 'super_admin') {
      query = query.eq('tenant_id', user.tenant_id);
    }

    const { data: instances, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Internal server error: ' + error.message });
    }

    return res.status(200).json({ instances });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
}

export default withAuth(handler); 