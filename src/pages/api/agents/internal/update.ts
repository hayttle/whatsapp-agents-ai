import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser, createApiClient } from '@/lib/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
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

    const { id, ...updateData } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }

    // Se instance_id vier como string vazia, transformar em null
    if ('instance_id' in updateData && updateData.instance_id === '') {
      updateData.instance_id = null;
    }

    // Para agentes internos, sempre sobrescrever webhookUrl com a variável de ambiente
    const webhookUrl = process.env.WEBHOOK_AGENT_URL;
    if (!webhookUrl) {
      return res.status(500).json({ error: 'Internal webhook URL not configured' });
    }
    updateData.webhookUrl = webhookUrl;
    updateData.agent_type = 'internal';

    // Verificar se o agente existe e se o usuário tem permissão
    const { data: existingAgent } = await supabase
      .from('agents')
      .select('tenant_id, agent_type')
      .eq('id', id)
      .single();

    if (!existingAgent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Verificar se é realmente um agente interno
    if (existingAgent.agent_type !== 'internal') {
      return res.status(400).json({ error: 'This endpoint is only for internal agents' });
    }

    if (userData.role !== 'super_admin' && existingAgent.tenant_id !== userData.tenant_id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { data: agent, error } = await supabase
      .from('agents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Error updating internal agent: ' + error.message });
    }

    return res.status(200).json({ success: true, agent });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 