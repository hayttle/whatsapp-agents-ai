import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthResult } from '@/lib/auth/helpers';

async function handler(req: NextApiRequest, res: NextApiResponse, auth: AuthResult) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user, supabase } = auth;
    const { subscriptionId } = req.query;

    if (!subscriptionId || typeof subscriptionId !== 'string') {
      return res.status(400).json({ error: 'subscriptionId é obrigatório' });
    }

    // Verificar permissões
    if (!user.role || !['user', 'super_admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }

    // Buscar a assinatura para verificar se pertence ao usuário
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('tenant_id, asaas_subscription_id')
      .eq('id', subscriptionId)
      .single();

    if (subscriptionError || !subscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    // Verificar se o usuário tem acesso a esta assinatura
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.tenant_id !== subscription.tenant_id) {
      return res.status(403).json({ error: 'Acesso negado a esta assinatura' });
    }

    // Buscar cobranças da assinatura usando asaas_subscription_id
    const { data: payments, error: paymentsError } = await supabase
      .from('subscription_payments')
      .select('*')
      .eq('asaas_subscription_id', subscription.asaas_subscription_id)
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.error('[Payments] Erro ao buscar cobranças:', paymentsError);
      return res.status(500).json({ error: 'Erro ao buscar cobranças' });
    }

    // Formatar resposta
    const formattedPayments = (payments || []).map((payment: any) => ({
      id: payment.id,
      asaasPaymentId: payment.asaas_payment_id,
      amount: payment.amount,
      status: payment.status,
      paidAt: payment.paid_at,
      paymentMethod: payment.payment_method,
      invoiceUrl: payment.invoice_url,
      createdAt: payment.created_at,
    }));

    return res.status(200).json({
      success: true,
      payments: formattedPayments,
      total_count: formattedPayments.length,
    });

  } catch (error) {
    console.error('[Payments] Erro inesperado:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Erro interno: ' + errorMessage });
  }
} 

export default withAuth(handler); 