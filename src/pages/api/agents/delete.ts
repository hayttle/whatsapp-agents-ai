import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthResult } from '@/lib/auth/helpers';

async function handler(req: NextApiRequest, res: NextApiResponse, auth: AuthResult) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar permissões - usuários comuns podem deletar agentes do seu próprio tenant
    if (!auth.user.role || !['user', 'super_admin'].includes(auth.user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }

    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }

    // Verificar se o agente existe e se o usuário tem permissão
    const { data: existingAgent } = await auth.supabase
      .from('agents')
      .select('tenant_id, title, agent_type')
      .eq('id', id)
      .single();

    if (!existingAgent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Verificar permissões de tenant
    if (auth.user.role !== 'super_admin' && existingAgent.tenant_id !== auth.user.tenant_id) {
      return res.status(403).json({ error: 'Forbidden - Cannot delete agent from different tenant' });
    }

    const { error } = await auth.supabase
      .from('agents')
      .delete()
      .eq('id', id);

    if (error) {
      // Verificar se é um erro de foreign key constraint (mensagens vinculadas)
      if (error.code === '23503' || 
          error.message?.includes('violates foreign key constraint') ||
          error.message?.includes('is still referenced from table')) {
        return res.status(409).json({ 
          error: 'Cannot delete agent - there are messages linked to this agent. Please delete the messages first.',
          code: 'FOREIGN_KEY_CONSTRAINT'
        });
      }
      
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Log de auditoria
    // logAuditAction(
    //   'DELETE_AGENT',
    //   'agents',
    //   id,
    //   auth.user.id,
    //   auth.user.email,
    //   { 
    //     agent_title: existingAgent.title,
    //     tenant_id: existingAgent.tenant_id,
    //     agent_type: existingAgent.agent_type,
    //     method: req.method 
    //   }
    // );

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler); 