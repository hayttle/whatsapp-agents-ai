import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthResult } from '@/lib/auth/helpers';

async function handler(req: NextApiRequest, res: NextApiResponse, auth: AuthResult) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar permissões - usuários comuns podem atualizar agentes do seu próprio tenant
    if (!auth.user.role || !['user', 'super_admin'].includes(auth.user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }

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
    const { data: existingAgent } = await auth.supabase
      .from('agents')
      .select('tenant_id, agent_type, title')
      .eq('id', id)
      .single();

    if (!existingAgent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Verificar se é realmente um agente interno
    if (existingAgent.agent_type !== 'internal') {
      return res.status(400).json({ error: 'This endpoint is only for internal agents' });
    }

    // Verificar permissões de tenant
    if (auth.user.role !== 'super_admin' && existingAgent.tenant_id !== auth.user.tenant_id) {
      return res.status(403).json({ error: 'Forbidden - Cannot update agent from different tenant' });
    }

    // Adicionar agent_model_id ao payload e atualizar no banco
    // agent_model_id pode ser opcional
    if (updateData.agent_model_id === '') {
      updateData.agent_model_id = null;
    }

    const { data: agent, error } = await auth.supabase
      .from('agents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Agents Internal Update] Erro ao atualizar agente interno:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Log de auditoria

    return res.status(200).json(agent);
  } catch (error) {
    console.error('[Agents Internal Update] Erro inesperado:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler); 