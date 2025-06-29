import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser, createApiClient } from '@/lib/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
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

    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }

    // Verificar se o agente externo existe e se o usuário tem permissão
    const { data: existingAgent } = await supabase
      .from('agents')
      .select('tenant_id, agent_type')
      .eq('id', id)
      .single();

    if (!existingAgent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Verificar se é realmente um agente externo
    if (existingAgent.agent_type !== 'external') {
      return res.status(400).json({ error: 'This endpoint is only for external agents' });
    }

    if (userData.role !== 'super_admin' && existingAgent.tenant_id !== userData.tenant_id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Error deleting external agent: ' + error.message });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 