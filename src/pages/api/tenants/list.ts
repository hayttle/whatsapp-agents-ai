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

    // Apenas super_admin pode listar todos os tenants
    if (userData.role !== 'super_admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('*');

    if (error) {
      console.error('Error fetching tenants:', error);
      return res.status(500).json({ error: 'Internal server error: ' + error.message });
    }

    return res.status(200).json({ tenants });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Error in tenant list API:', error);
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 