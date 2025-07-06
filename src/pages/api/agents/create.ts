import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthResult } from '@/lib/auth/helpers';
import { checkPlanLimits } from '@/lib/plans';
import { usageService } from '@/services/usageService';

async function handler(req: NextApiRequest, res: NextApiResponse, auth: AuthResult) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar permissões - usuários comuns podem criar agentes para seu próprio tenant
    if (!auth.user.role || !['user', 'super_admin'].includes(auth.user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }

    const { tenant_id, title, description, agent_type, webhookUrl } = req.body;

    if (!tenant_id || !title || !agent_type) {
      return res.status(400).json({ error: 'Missing required fields for agent' });
    }
    if (agent_type === 'external' && !webhookUrl) {
      return res.status(400).json({ error: 'Missing webhookUrl for external agent' });
    }
    if (auth.user.role !== 'super_admin' && tenant_id !== auth.user.tenant_id) {
      return res.status(403).json({ error: 'Forbidden - Cannot create agent for different tenant' });
    }

    // Verificar limites do plano
    const { data: subscription } = await auth.supabase
      .from('subscriptions')
      .select('plan_name, quantity')
      .eq('tenant_id', tenant_id)
      .in('status', ['TRIAL', 'ACTIVE'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subscription?.plan_name) {
      const usageResponse = await usageService.getUsageStats(tenant_id);
      if (usageResponse.success) {
        const limitCheck = checkPlanLimits(
          subscription.plan_name,
          usageResponse.usage,
          'create_agent',
          agent_type,
          subscription.quantity || 1
        );

        if (!limitCheck.allowed) {
          return res.status(403).json({ 
            error: limitCheck.reason || 'Limite do plano atingido',
            limitReached: true
          });
        }
      }
    }

    const insertData: Record<string, unknown> = {
      tenant_id,
      title,
      description: description || null,
      agent_type,
    };
    if (agent_type === 'external') {
      insertData.webhookUrl = webhookUrl;
    }

    const { data: agent, error } = await auth.supabase
      .from('agents')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[Agents Create] Erro ao criar agente:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    return res.status(201).json({ success: true, agent });
  } catch (error) {
    console.error('[Agents Create] Erro inesperado:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler); 