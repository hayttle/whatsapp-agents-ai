import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthResult } from '@/lib/auth/helpers';

async function handler(req: NextApiRequest, res: NextApiResponse, auth: AuthResult) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid agent ID' });
    }

    // Buscar o agente
    const { data: agent, error } = await auth.supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[Agents Get] Erro ao buscar agente:', error);
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Verificar permissões de tenant
    if (auth.user.role !== 'super_admin' && agent.tenant_id !== auth.user.tenant_id) {
      return res.status(403).json({ error: 'Forbidden - Cannot access agent from different tenant' });
    }

    // Log de auditoria para super_admin
    if (auth.user.role === 'super_admin') {
      // Remover: logAuditAction(...);
    }

    return res.status(200).json(agent);
  } catch (error) {
    console.error('[Agents Get] Erro inesperado:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler); 