import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Autenticação
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return Object.entries(req.cookies).map(([name, value]) => ({ name, value: value || '' }));
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieOptions = {
                Path: '/',
                HttpOnly: true,
                SameSite: 'Lax' as const,
                Secure: process.env.NODE_ENV === 'production',
                ...options
              };
              
              const cookieString = Object.entries(cookieOptions)
                .map(([key, val]) => `${key}=${val}`)
                .join('; ');
              
              res.setHeader('Set-Cookie', `${name}=${value}; ${cookieString}`);
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    // Buscar tenant_id e role do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Se for super_admin, retorna imediatamente
    if (userData.role === 'super_admin') {
      return res.status(200).json({
        success: true,
        subscription: null,
      });
    }

    // Buscar assinatura mais recente do tenant
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subscriptionError) {
      // Se não encontrar assinatura, retornar null (usuário sem assinatura)
      if (subscriptionError.code === 'PGRST116') {
        return res.status(200).json({
          success: true,
          subscription: null,
        });
      }
      return res.status(500).json({ error: 'Erro ao buscar assinatura: ' + subscriptionError.message });
    }

    // Atualizar status para SUSPENDED se trial expirou
    const now = new Date();
    if (
      subscription.status === 'TRIAL' &&
      subscription.expires_at &&
      new Date(subscription.expires_at) < now
    ) {
      await supabase
        .from('subscriptions')
        .update({ status: 'SUSPENDED' })
        .eq('id', subscription.id);
      subscription.status = 'SUSPENDED';
    }

    // Formatar resposta
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
      isActive: ['TRIAL', 'ACTIVE'].includes(subscription.status),
      isTrial: (subscription.plan_name && subscription.plan_name.toLowerCase() === 'trial'),
      isSuspended: subscription.status === 'SUSPENDED',
    };

    return res.status(200).json({
      success: true,
      subscription: formattedSubscription,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Erro interno: ' + errorMessage });
  }
} 