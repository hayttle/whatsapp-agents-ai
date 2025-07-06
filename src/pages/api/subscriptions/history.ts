import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    // Formatar resposta
    const formattedSubscriptions = subscriptions?.map(subscription => ({
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
      paidAt: subscription.paid_at,
      paymentMethod: subscription.payment_method,
      invoiceUrl: subscription.invoice_url,
      isActive: ['TRIAL', 'ACTIVE'].includes(subscription.status),
      isTrial: subscription.status === 'TRIAL',
      isSuspended: subscription.status === 'SUSPENDED',
      createdAt: subscription.created_at,
      updatedAt: subscription.updated_at,
    })) || [];

    return res.status(200).json({
      success: true,
      subscriptions: formattedSubscriptions,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Erro interno: ' + errorMessage });
  }
} 