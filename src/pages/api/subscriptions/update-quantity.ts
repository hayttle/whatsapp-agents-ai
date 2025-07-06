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

    const { subscriptionId, quantity } = req.body;

    // Validações
    if (!subscriptionId) {
      return res.status(400).json({ error: 'subscriptionId é obrigatório' });
    }

    if (!quantity || quantity < 1 || !Number.isInteger(quantity)) {
      return res.status(400).json({ 
        error: 'Quantity deve ser um número inteiro maior que 0' 
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

    // Buscar assinatura atual
    const { data: currentSubscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*, tenants(asaas_customer_id)')
      .eq('id', subscriptionId)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (subscriptionError || !currentSubscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    // Verificar se a assinatura tem asaas_subscription_id (não é trial)
    if (!currentSubscription.asaas_subscription_id) {
      return res.status(400).json({ 
        error: 'Não é possível atualizar quantidade de assinaturas trial' 
      });
    }

    // Calcular novo allowed_instances
    const calculateAllowedInstances = (planType: string, quantity: number) => {
      switch (planType) {
        case 'starter':
          return 2 * quantity;
        case 'pro':
          return 5 * quantity;
        default:
          return 0;
      }
    };

    const newAllowedInstances = calculateAllowedInstances(currentSubscription.plan_type, quantity);

    try {
      // Atualizar assinatura no Asaas
      await asaasRequest(`/subscriptions/${currentSubscription.asaas_subscription_id}`, {
        method: 'POST',
        body: JSON.stringify({
          quantity: quantity,
          updatePendingPayments: true, // Atualizar pagamentos pendentes
        })
      });

      // Atualizar no banco local
      const { data: updatedSubscription, error: updateError } = await supabase
        .from('subscriptions')
        .update({
          quantity: quantity,
          allowed_instances: newAllowedInstances,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({ error: 'Erro ao atualizar assinatura: ' + updateError.message });
      }

      return res.status(200).json({
        success: true,
        subscription: updatedSubscription,
      });

    } catch (asaasError: any) {
      if (asaasError) {
        return res.status(500).json({ error: 'Erro ao atualizar no Asaas.' });
      }
    }

  } catch (error: any) {
    return res.status(500).json({ error: 'Erro ao atualizar quantidade.' });
  }
} 