import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthResult } from '@/lib/auth/helpers';

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

    // Buscar todas as assinaturas do tenant
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('created_at', { ascending: false });

    if (subscriptionError) {
      return res.status(500).json({ error: 'Erro ao buscar histórico: ' + subscriptionError.message });
    }

    // Buscar cobranças para cada assinatura
    const subscriptionsWithPayments = await Promise.all(
      (subscriptions || []).map(async (subscription: any) => {
        let payments: Array<{
          id: string;
          asaasPaymentId: string;
          amount: number;
          status: string;
          paidAt: string | null;
          paymentMethod: string | null;
          invoiceUrl: string | null;
          createdAt: string;
          dueDate: string | null;
        }> = [];
        
        if (subscription.asaas_subscription_id) {
          const { data: subscriptionPayments, error: paymentsError } = await supabase
            .from('subscription_payments')
            .select('*')
            .eq('asaas_subscription_id', subscription.asaas_subscription_id)
            .order('created_at', { ascending: false });

          if (!paymentsError && subscriptionPayments) {
            payments = subscriptionPayments.map((payment: any) => ({
              id: payment.id,
              asaasPaymentId: payment.asaas_payment_id,
              amount: payment.amount,
              status: payment.status,
              paidAt: payment.paid_at,
              paymentMethod: payment.payment_method,
              invoiceUrl: payment.invoice_url,
              createdAt: payment.created_at,
              dueDate: payment.due_date,
            }));
          }
        }

        return {
      id: subscription.id,
          asaasSubscriptionId: subscription.asaas_subscription_id,
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
          isTrial: false, // Trial agora está na tabela separada
      isSuspended: subscription.status === 'SUSPENDED',
      createdAt: subscription.created_at,
      updatedAt: subscription.updated_at,
          payments: payments,
          paymentsCount: payments.length,
        };
      })
    );

    console.log('SubscriptionsWithPayments:', JSON.stringify(subscriptionsWithPayments, null, 2));
    return res.status(200).json({
      success: true,
      subscriptions: subscriptionsWithPayments,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Erro interno: ' + errorMessage });
  }
} 

export default withAuth(handler); 