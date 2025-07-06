import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthResult } from '@/lib/auth/helpers';

async function handler(req: NextApiRequest, res: NextApiResponse, auth: AuthResult) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { user, supabase } = auth;
    // Apenas super_admin pode listar todos os tenants
    if (user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('*');

    if (error) {
      return res.status(500).json({ error: 'Error fetching tenants: ' + error.message });
    }

    return res.status(200).json({ tenants: tenants });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
}

export default withAuth(handler); 