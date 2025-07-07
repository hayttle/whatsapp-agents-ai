import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthResult } from '@/lib/auth/helpers';
import { PLANS } from '@/lib/plans';
import { createAsaasSubscription, AsaasSubscriptionRequest } from '@/services/asaasService';
import { formatDateToISO } from '@/lib/utils';

async function handler(req: NextApiRequest, res: NextApiResponse, auth: AuthResult) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user, supabase } = auth;

    // Verificar permissões
    if (!user.role || !['user', 'super_admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }

    const { plan_type, quantity = 1 } = req.body;

    // Validações
    if (!plan_type) {
      return res.status(400).json({ error: 'plan_type é obrigatório' });
    }

    if (!PLANS[plan_type]) {
      return res.status(400).json({ error: 'Plano não encontrado' });
    }

    if (quantity < 1 || !Number.isInteger(quantity)) {
      return res.status(400).json({ error: 'Quantity deve ser um número inteiro maior que 0' });
    }

    // Buscar dados do usuário e tenant
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const { tenant_id } = userData;
    if (!tenant_id) {
      return res.status(400).json({ error: 'Tenant não encontrado' });
    }

    // Buscar dados do tenant
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('asaas_customer_id')
      .eq('id', tenant_id)
      .single();

    if (tenantError || !tenantData) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Verificar se o tenant tem customer_id do Asaas
    if (!tenantData.asaas_customer_id) {
      return res.status(400).json({ 
        error: 'Customer do Asaas não encontrado. Entre em contato com o suporte.' 
      });
    }

    const plan = PLANS[plan_type];
    const totalValue = plan.price * quantity;

    // Data de vencimento para hoje no timezone America/Sao_Paulo
    const now = new Date();
    const nextDueDateStr = formatDateToISO(now, 'America/Sao_Paulo'); // YYYY-MM-DD

    // Criar assinatura no Asaas
    const asaasSubscriptionData: AsaasSubscriptionRequest = {
      billingType: 'UNDEFINED',
      cycle: plan.cycle,
      customer: tenantData.asaas_customer_id,
      value: totalValue,
      nextDueDate: nextDueDateStr,
      description: `Assinatura plano ${plan.name} - Wapp Agents AI`,
    };

    console.log('[Create Pending] Payload enviado ao Asaas:', JSON.stringify(asaasSubscriptionData, null, 2));

    let asaasSubscription;
    try {
      asaasSubscription = await createAsaasSubscription(asaasSubscriptionData);
      console.log('[Create Pending] Resposta do Asaas:', JSON.stringify(asaasSubscription, null, 2));
    } catch (error) {
      console.error('[Create Pending] Erro ao criar assinatura no Asaas:', error);
      console.error('[Create Pending] Detalhes do erro:', {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined,
      });
      return res.status(500).json({ 
        error: 'Erro ao criar assinatura no gateway de pagamento: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      });
    }

    // Criar registro local com status ACTIVE (alinhado com Asaas)
    const subscriptionData = {
      tenant_id,
      plan_name: plan.name,
      plan_type,
      quantity,
      status: 'ACTIVE',
      value: totalValue,
      price: plan.price,
      cycle: plan.cycle,
      asaas_subscription_id: asaasSubscription.id, // ID da assinatura no Asaas
      next_due_date: nextDueDateStr,
    };

    const { data: subscription, error: dbError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (dbError) {
      console.error('[Create Pending] Erro ao criar assinatura local:', dbError);
      
      // Se falhar ao criar localmente, cancelar a assinatura no Asaas
      try {
        await import('@/services/asaasService').then(({ cancelAsaasSubscription }) => 
          cancelAsaasSubscription(asaasSubscription.id)
        );
      } catch (cancelError) {
        console.error('[Create Pending] Erro ao cancelar assinatura no Asaas após falha local:', cancelError);
      }
      
      return res.status(500).json({ error: 'Erro ao criar assinatura: ' + dbError.message });
    }

    return res.status(201).json({
      success: true,
      subscription,
      asaas_payment_url: asaasSubscription.invoiceUrl, // Link de pagamento exclusivo do cliente
      asaas_subscription_id: asaasSubscription.id,
    });

  } catch (error) {
    console.error('[Create Pending] Erro inesperado:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Erro interno: ' + errorMessage });
  }
}

export default withAuth(handler); 