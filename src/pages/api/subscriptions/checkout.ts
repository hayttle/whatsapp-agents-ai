import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';
import { asaasRequest } from '@/services/asaasService';
import { cookies } from 'next/headers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Autenticação
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    // Buscar dados do usuário e tenant
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*, tenants(*)')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const { tenant_id, tenants } = userData;
    if (!tenant_id || !tenants) {
      return res.status(400).json({ error: 'Tenant não encontrado' });
    }

    const { plan_name, plan_type, quantity = 1, value, price, cycle, billing_type, description, next_due_date } = req.body;

    // Validações
    if (!plan_name || !plan_type || !value || !price || !cycle || !billing_type || !description || !next_due_date) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: plan_name, plan_type, value, price, cycle, billing_type, description, next_due_date' 
      });
    }

    // Validar plan_type
    if (!['starter', 'pro', 'custom'].includes(plan_type)) {
      return res.status(400).json({ 
        error: 'plan_type deve ser: starter, pro ou custom' 
      });
    }

    // Validar quantity
    if (quantity < 1 || !Number.isInteger(quantity)) {
      return res.status(400).json({ 
        error: 'Quantity deve ser um número inteiro maior que 0' 
      });
    }

    // 1. Usar customer existente do Asaas
    if (!tenants.asaas_customer_id) {
      return res.status(400).json({ 
        error: 'Customer do Asaas não encontrado. Entre em contato com o suporte.' 
      });
    }

    // Buscar dados do customer no Asaas para validação
    let customer: any;
    try {
      customer = await asaasRequest(`/customers/${tenants.asaas_customer_id}`);
    } catch (customerError: any) {
      return res.status(500).json({ error: 'Erro ao buscar customer no Asaas.' });
    }

    // 2. Criar assinatura no Asaas
    const asaasSubscription: any = await asaasRequest('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        customer: customer.id,
        billingType: billing_type,
        value: value,
        cycle: cycle,
        description: description,
        nextDueDate: next_due_date,
        remoteIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      })
    });

    // 3. Salvar assinatura no banco local
    const subscriptionData = {
      tenant_id,
      asaas_subscription_id: asaasSubscription.id,
      plan_name,
      plan_type,
      quantity,
      status: 'TRIAL' as const, // Começa como trial
      value,
      price,
      cycle,
      started_at: new Date().toISOString(),
      next_due_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: subscription, error: dbError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (dbError) {
      return res.status(500).json({ error: 'Erro ao salvar assinatura: ' + dbError.message });
    }

    // 4. Retornar link de checkout
    let checkoutUrl = '';
    if (asaasSubscription.invoiceUrl) {
      checkoutUrl = asaasSubscription.invoiceUrl;
    } else if (asaasSubscription.charge && asaasSubscription.charge.invoiceUrl) {
      checkoutUrl = asaasSubscription.charge.invoiceUrl;
    } else {
      // Se não houver link direto, criar um link de pagamento
      const payment: any = await asaasRequest('/payments', {
        method: 'POST',
        body: JSON.stringify({
          customer: customer.id,
          billingType: billing_type,
          value: value,
          dueDate: next_due_date,
          description: description,
          subscription: asaasSubscription.id,
        })
      });
      checkoutUrl = payment.invoiceUrl || payment.url;
    }

    return res.status(200).json({
      success: true,
      checkoutUrl,
      subscription,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Erro no checkout: ' + errorMessage });
  }
} 