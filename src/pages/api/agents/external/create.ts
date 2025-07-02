import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthResult } from '@/lib/auth/helpers';

async function handler(req: NextApiRequest, res: NextApiResponse, auth: AuthResult) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar permissões - usuários comuns podem criar agentes para seu próprio tenant
    if (!auth.user.role || !['user', 'super_admin'].includes(auth.user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }

    const { tenant_id, title, webhookUrl, description, active, instance_id } = req.body;

    // Validação para agentes externos
    if (!tenant_id || !title || !webhookUrl) {
      return res.status(400).json({ error: 'Missing required fields for external agent' });
    }

    // Verificar permissões de tenant
    if (auth.user.role !== 'super_admin' && tenant_id !== auth.user.tenant_id) {
      return res.status(403).json({ error: 'Forbidden - Cannot create agent for different tenant' });
    }

    const { data: agent, error } = await auth.supabase
      .from('agents')
      .insert({
        tenant_id,
        title,
        webhookUrl,
        description: description || null,
        agent_type: 'external',
        active: active ?? true,
        instance_id: instance_id || null,
        prompt: ''
      })
      .select()
      .single();

    if (error) {
      console.error('[Agents External Create] Erro ao criar agente externo:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Log de auditoria
    // logAuditAction(
    //   'CREATE_EXTERNAL_AGENT',
    //   'agents',
    //   agent.id,
    //   auth.user.id,
    //   auth.user.email,
    //   { 
    //     agent_title: agent.title,
    //     tenant_id: agent.tenant_id,
    //     webhook_url: agent.webhookUrl,
    //     method: req.method 
    //   }
    // );

    return res.status(201).json({ success: true, agent });
  } catch (error) {
    console.error('[Agents External Create] Erro inesperado:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler); 