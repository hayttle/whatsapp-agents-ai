import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthResult } from '@/lib/auth/helpers';

async function handler(req: NextApiRequest, res: NextApiResponse, auth: AuthResult) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar permissões - usuários comuns podem alterar status de agentes do seu próprio tenant
    if (!auth.user.role || !['user', 'super_admin'].includes(auth.user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }

    const { id, status } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }

    if (typeof status !== 'string' || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status is required and must be "active" or "inactive"' });
    }

    // Verificar se o agente existe e se o usuário tem permissão
    const { data: existingAgent } = await auth.supabase
      .from('agents')
      .select('tenant_id, title, agent_type, status')
      .eq('id', id)
      .single();

    if (!existingAgent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Verificar permissões de tenant
    if (auth.user.role !== 'super_admin' && existingAgent.tenant_id !== auth.user.tenant_id) {
      return res.status(403).json({ error: 'Forbidden - Cannot toggle agent from different tenant' });
    }

    const { data: agent, error } = await auth.supabase
      .from('agents')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Agents Toggle Status] Erro ao alterar status do agente:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Log de auditoria

    return res.status(200).json({ success: true, agent });
  } catch (error) {
    console.error('[Agents Toggle Status] Erro inesperado:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler); 