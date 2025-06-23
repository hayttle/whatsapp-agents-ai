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

    let query = supabase
      .from('agents')
      .select(`
        *,
        whatsapp_instances(instanceName),
        tenants(name)
      `);

    // Filtrar por tenant se não for super_admin
    if (userData.role !== 'super_admin') {
      query = query.eq('tenant_id', userData.tenant_id);
    } else if (tenantId && typeof tenantId === 'string') {
      query = query.eq('tenant_id', tenantId);
    }

    const { data: agents, error } = await query;

    if (error) {
      console.error('Error fetching agents:', error);
      return res.status(500).json({ error: 'Error fetching agents: ' + error.message });
    }

    return res.status(200).json({ agents: agents || [] });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Error in agents list API:', error);
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 