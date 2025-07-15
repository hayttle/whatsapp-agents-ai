import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthResult } from '@/lib/auth/helpers';
import { TrialService } from '@/services/trialService';

async function handler(req: NextApiRequest, res: NextApiResponse, auth: AuthResult) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user, supabase } = auth;

    // Verificar permissões
    if (!user.role || !['user', 'super_admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }

    // Se for super_admin, retorna imediatamente
    if (user.role === 'super_admin') {
      return res.status(200).json({
        success: true,
        subscription: null,
        trialStatus: null,
        hasAccess: true,
      });
    }

    // Buscar tenant_id do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const trialService = new TrialService(supabase);
    const accessInfo = await trialService.getAccessInfo(userData.tenant_id);

    // Se tem assinatura paga ativa, retorna ela
    if (accessInfo.hasActiveSubscription && accessInfo.subscription) {
      const subscription = accessInfo.subscription;
      
    const formattedSubscription = {
      id: subscription.id,
      plan: subscription.plan_name,
      planType: subscription.plan_type,
      quantity: subscription.quantity,
      allowedInstances: subscription.allowed_instances,
      status: subscription.status,
      value: subscription.value,
      price: subscription.price,
      cycle: subscription.cycle,
      startedAt: subscription.started_at,
      nextDueDate: subscription.next_due_date,
      expiresAt: subscription.expires_at,
      paidAt: subscription.paid_at,
      paymentMethod: subscription.payment_method,
      invoiceUrl: subscription.invoice_url,
        isActive: ['ACTIVE', 'PENDING'].includes(subscription.status),
        isTrial: false, // Agora sempre false, pois trial está separado
      isExpired: subscription.status === 'EXPIRED',
        createdAt: subscription.created_at,
        updatedAt: subscription.updated_at,
    };

    return res.status(200).json({
      success: true,
      subscription: formattedSubscription,
        trialStatus: accessInfo.trialStatus,
        hasAccess: accessInfo.hasAccess,
      });
    }

    // Se não tem assinatura paga, retorna apenas informações do trial
    return res.status(200).json({
      success: true,
      subscription: null,
      trialStatus: accessInfo.trialStatus,
      hasAccess: accessInfo.hasAccess,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Erro interno: ' + errorMessage });
  }
} 

export default withAuth(handler); 