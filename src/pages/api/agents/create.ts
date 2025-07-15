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

    if (auth.user.role === 'super_admin') {
      // Superadmin pode criar agente sem restrição de tenant, assinatura ou trial
      const insertData: Record<string, unknown> = {
        tenant_id,
        title,
        description: description || null,
        agent_type,
        status: 'active',
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
    }

    // Verificar se o tenant tem acesso (trial ativo ou assinatura paga)
    const { data: activeSubscription } = await auth.supabase
      .from('subscriptions')
      .select('status')
      .eq('tenant_id', auth.user.tenant_id)
      .in('status', ['ACTIVE', 'PENDING'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (activeSubscription) {
      // Tem assinatura paga ativa
    } else {
      // Verificar trial
      const { data: trial } = await auth.supabase
        .from('trials')
        .select('status, expires_at')
        .eq('tenant_id', auth.user.tenant_id)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!trial) {
        return res.status(403).json({ error: 'Acesso negado. Trial expirado ou sem assinatura ativa.' });
      }

      const now = new Date();
      const expiresAt = new Date(trial.expires_at);
      
      if (expiresAt <= now) {
        // Trial expirado, atualizar status
        await auth.supabase
          .from('trials')
          .update({ status: 'EXPIRED' })
          .eq('tenant_id', auth.user.tenant_id)
          .eq('status', 'ACTIVE');
        
        return res.status(403).json({ error: 'Trial expirado. Renove sua assinatura para continuar.' });
      }
    }

    // Verificar limites do plano considerando todas as assinaturas ativas
    const limitCheck = await usageService.checkPlanLimits(tenant_id, 'create_agent', agent_type);
    
    if (!limitCheck.success) {
      return res.status(500).json({ 
        error: limitCheck.error || 'Erro ao verificar limites do plano',
        limitReached: false
      });
    }

    if (!limitCheck.allowed) {
      return res.status(403).json({ 
        error: limitCheck.reason || 'Limite do plano atingido',
        limitReached: true,
        totalLimits: limitCheck.totalLimits
      });
    }

    const insertData: Record<string, unknown> = {
      tenant_id,
      title,
      description: description || null,
      agent_type,
      status: 'active',
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