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

    const { tenantId } = req.query;

    // Construir query base
    let query = supabase
      .from('agents')
      .select('*')
      .eq('agent_type', 'internal');

    // Filtrar por tenant se não for super_admin
    if (userData.role !== 'super_admin') {
      query = query.eq('tenant_id', userData.tenant_id);
    } else if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data: agents, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Error fetching internal agents: ' + error.message });
    }

    return res.status(200).json({ agents });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 