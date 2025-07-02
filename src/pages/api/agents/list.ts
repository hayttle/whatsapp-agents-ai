import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthResult } from '@/lib/auth/helpers';

async function handler(req: NextApiRequest, res: NextApiResponse, auth: AuthResult) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tenantId, agent_type } = req.query;

    // Construir query base
    let query = auth.supabase
      .from('agents')
      .select('*');

    // Filtrar por tipo de agente se especificado
    if (agent_type && typeof agent_type === 'string') {
      query = query.eq('agent_type', agent_type);
    }

    // Filtrar por tenant se não for super_admin
    if (auth.user.role !== 'super_admin') {
      query = query.eq('tenant_id', auth.user.tenant_id);
    } else if (tenantId && typeof tenantId === 'string') {
      query = query.eq('tenant_id', tenantId);
    }

    const { data: agents, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[Agents List] Erro ao buscar agentes:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Log de auditoria para super_admin
    if (auth.user.role === 'super_admin') {
      // logAuditAction(
      //   'LIST_AGENTS',
      //   'agents',
      //   'all',
      //   auth.user.id,
      //   auth.user.email,
      //   { 
      //     filters: { tenantId, agent_type },
      //     count: agents?.length || 0,
      //     method: req.method 
      //   }
      // );
    }

    return res.status(200).json({ agents: agents || [] });
  } catch (error) {
    console.error('[Agents List] Erro inesperado:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler); 