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

    const { id, title, description, webhookUrl, tenant_id, active, instance_id } = req.body;

    if (!id || !title || !webhookUrl || !tenant_id) {
      return res.status(400).json({ error: 'Missing required fields for external agent update' });
    }

    // Verificar permissões de tenant
    if (auth.user.role !== 'super_admin' && tenant_id !== auth.user.tenant_id) {
      return res.status(403).json({ error: 'Forbidden - Cannot update agent for different tenant' });
    }

    const { data: agent, error } = await auth.supabase
      .from('agents')
      .update({
        title,
        description: description || null,
        webhookUrl,
        tenant_id,
        active: active ?? true,
        agent_type: 'external',
        instance_id: instance_id || null,
        prompt: ''
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Agents External Update] Erro ao atualizar agente externo:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Log de auditoria
    // logAuditAction(
    //   'UPDATE_EXTERNAL_AGENT',
    //   'agents',
    //   id,
    //   auth.user.id,
    //   auth.user.email,
    //   { 
    //     agent_title: title,
    //     tenant_id: tenant_id,
    //     agent_type: 'external',
    //     updated_fields: ['title', 'description', 'webhookUrl', 'tenant_id', 'active', 'instance_id'],
    //     method: req.method 
    //   }
    // );

    return res.status(200).json({ success: true, agent });
  } catch (error) {
    console.error('[Agents External Update] Erro inesperado:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler); 