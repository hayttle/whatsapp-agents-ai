import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validar token de acesso do Asaas
    const asaasAccessToken = req.headers['asaas-access-token'];
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
    
    if (!asaasAccessToken || asaasAccessToken !== expectedToken) {
      console.error('Token de webhook inválido:', asaasAccessToken);
      return res.status(401).json({ error: 'Token inválido' });
    }

    const webhookData = req.body;
    console.log('Webhook recebido:', JSON.stringify(webhookData, null, 2));

    // Responder rapidamente para evitar timeout
    res.status(200).json({ received: true });

    // Processar webhook em background
    processWebhook(webhookData);

  } catch (error: any) {
    console.error('Erro no webhook:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function processWebhook(webhookData: any) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore
            }
          },
        },
      }
    );

    const event = webhookData.event;
    const payment = webhookData.payment;
    const subscription = webhookData.subscription;

    switch (event) {
      case 'SUBSCRIPTION_CREATED':
        await handleSubscriptionCreated(subscription, supabase);
        break;

      case 'SUBSCRIPTION_UPDATED':
        await handleSubscriptionUpdated(subscription, supabase);
        break;

      case 'SUBSCRIPTION_INACTIVATED':
        await handleSubscriptionInactivated(subscription, supabase);
        break;

      case 'PAYMENT_CREATED':
        await handlePaymentCreated(payment, supabase);
        break;

      case 'PAYMENT_RECEIVED':
        await handlePaymentReceived(payment, supabase);
        break;

      case 'PAYMENT_OVERDUE':
        await handlePaymentOverdue(payment, supabase);
        break;

      case 'PAYMENT_DELETED':
        await handlePaymentDeleted(payment, supabase);
        break;

      default:
        console.log(`Evento não tratado: ${event}`);
    }

  } catch (error) {
    console.error('Erro ao processar webhook:', error);
  }
}

async function handleSubscriptionCreated(subscription: any, supabase: any) {
  console.log('Assinatura criada:', subscription.id);
  // A assinatura já foi criada no checkout, apenas log
}

async function handleSubscriptionUpdated(subscription: any, supabase: any) {
  console.log('Assinatura atualizada:', subscription.id);
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      value: subscription.value,
      cycle: subscription.cycle,
      next_due_date: subscription.nextDueDate,
      updated_at: new Date().toISOString(),
    })
    .eq('asaas_subscription_id', subscription.id);

  if (error) {
    console.error('Erro ao atualizar assinatura:', error);
  }
}

async function handleSubscriptionInactivated(subscription: any, supabase: any) {
  console.log('Assinatura inativada:', subscription.id);
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'CANCELLED',
      updated_at: new Date().toISOString(),
    })
    .eq('asaas_subscription_id', subscription.id);

  if (error) {
    console.error('Erro ao cancelar assinatura:', error);
  }
}

async function handlePaymentCreated(payment: any, supabase: any) {
  console.log('Pagamento criado:', payment.id);
  // Log apenas, aguardar confirmação
}

async function handlePaymentReceived(payment: any, supabase: any) {
  console.log('Pagamento recebido:', payment.id);
  
  // Primeiro, buscar o subscription_id pelo asaas_subscription_id
  const { data: subscription, error: subscriptionError } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('asaas_subscription_id', payment.subscription)
    .single();

  if (subscriptionError || !subscription) {
    console.error('Erro ao buscar assinatura:', subscriptionError);
    return;
  }

  // Registrar o pagamento na tabela subscription_payments
  const { error: paymentError } = await supabase
    .rpc('register_subscription_payment', {
      p_subscription_id: subscription.id,
      p_payment_id: payment.id,
      p_amount: payment.value,
      p_status: payment.status,
      p_payment_method: payment.billingType,
      p_invoice_url: payment.invoiceUrl
    });

  if (paymentError) {
    console.error('Erro ao registrar pagamento:', paymentError);
  }

  // Atualizar a assinatura
  const updateData: any = {
    status: 'ACTIVE',
    paid_at: payment.paymentDate ? new Date(payment.paymentDate).toISOString() : new Date().toISOString(),
    payment_method: payment.billingType,
    invoice_url: payment.invoiceUrl,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('subscriptions')
    .update(updateData)
    .eq('asaas_subscription_id', payment.subscription);

  if (error) {
    console.error('Erro ao atualizar pagamento:', error);
  }
}

async function handlePaymentOverdue(payment: any, supabase: any) {
  console.log('Pagamento vencido:', payment.id);
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'OVERDUE',
      updated_at: new Date().toISOString(),
    })
    .eq('asaas_subscription_id', payment.subscription);

  if (error) {
    console.error('Erro ao marcar pagamento vencido:', error);
  }
}

async function handlePaymentDeleted(payment: any, supabase: any) {
  console.log('Pagamento deletado:', payment.id);
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'SUSPENDED',
      updated_at: new Date().toISOString(),
    })
    .eq('asaas_subscription_id', payment.subscription);

  if (error) {
    console.error('Erro ao suspender assinatura:', error);
  }
} 