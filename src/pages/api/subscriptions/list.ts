import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthResult } from '@/lib/auth/helpers';

async function handler(req: NextApiRequest, res: NextApiResponse, auth: AuthResult) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user, supabase } = auth;
    const { status } = req.query;

    // Verificar permissões
    if (!user.role || !['user', 'super_admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }

    // Se for super_admin, retorna lista vazia
    if (user.role === 'super_admin') {
      return res.status(200).json({
        success: true,
        subscriptions: [],
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

    // Construir query base
    let query = supabase
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', userData.tenant_id);

    // Aplicar filtro de status se fornecido
    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    // Executar query
    const { data: subscriptions, error: subscriptionError } = await query
      .order('created_at', { ascending: false });

    if (subscriptionError) {
      return res.status(500).json({ error: 'Erro ao buscar assinaturas: ' + subscriptionError.message });
    }

    // Formatar dados das assinaturas
    const formattedSubscriptions = (subscriptions || []).map((subscription: any) => ({
      id: subscription.id,
      asaasSubscriptionId: subscription.asaas_subscription_id,
      plan: subscription.plan_name,
      planType: subscription.plan_type,
      quantity: subscription.quantity,
      status: subscription.status,
      value: subscription.value,
      price: subscription.price,
      cycle: subscription.cycle,
      startedAt: subscription.started_at,
      nextDueDate: subscription.next_due_date,
      expiresAt: subscription.expires_at,
      createdAt: subscription.created_at,
      updatedAt: subscription.updated_at,
      isActive: ['ACTIVE', 'PENDING'].includes(subscription.status),
    }));

    return res.status(200).json({
      success: true,
      subscriptions: formattedSubscriptions,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Erro interno: ' + errorMessage });
  }
}

export default withAuth(handler); 