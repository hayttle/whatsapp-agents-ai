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

    const { subscriptionId, plan_name, value, cycle, billing_type, description, next_due_date } = req.body;

    // Validações
    if (!subscriptionId) {
      return res.status(400).json({ error: 'subscriptionId é obrigatório' });
    }

    // Buscar assinatura atual
    const { data: currentSubscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .single();

    if (subscriptionError || !currentSubscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    // Preparar dados para atualização
    const updateData: any = {};
    if (plan_name) updateData.plan_name = plan_name;
    if (value) updateData.value = value;
    if (cycle) updateData.cycle = cycle;
    if (next_due_date) updateData.next_due_date = next_due_date;
    if (description) updateData.description = description;

    // Atualizar no Asaas se houver mudanças
    if (Object.keys(updateData).length > 0) {
      try {
        const asaasUpdateData: any = {};
        if (value) asaasUpdateData.value = value;
        if (cycle) asaasUpdateData.cycle = cycle;
        if (next_due_date) asaasUpdateData.nextDueDate = next_due_date;
        if (description) asaasUpdateData.description = description;

        // Atualizar assinatura no Asaas
        await asaasRequest(`/subscriptions/${currentSubscription.asaas_subscription_id}`, {
          method: 'POST',
          body: JSON.stringify({
            ...asaasUpdateData,
            updatePendingPayments: true, // Atualizar pagamentos pendentes
          })
        });

        // Se a assinatura estava suspensa, reativar
        if (currentSubscription.status === 'SUSPENDED') {
          await asaasRequest(`/subscriptions/${currentSubscription.asaas_subscription_id}/activate`, {
            method: 'POST'
          });
          updateData.status = 'ACTIVE';
        }

      } catch (asaasError: any) {
        console.error('Erro ao atualizar no Asaas:', asaasError);
        return res.status(500).json({ 
          error: 'Erro ao atualizar assinatura no Asaas: ' + asaasError.message 
        });
      }
    }

    // Atualizar no banco local
    updateData.updated_at = new Date().toISOString();

    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionId)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: 'Erro ao atualizar assinatura: ' + updateError.message });
    }

    // Formatar resposta
    const formattedSubscription = {
      id: updatedSubscription.id,
      plan: updatedSubscription.plan_name,
      status: updatedSubscription.status,
      value: updatedSubscription.value,
      cycle: updatedSubscription.cycle,
      startedAt: updatedSubscription.started_at,
      nextDueDate: updatedSubscription.next_due_date,
      paidAt: updatedSubscription.paid_at,
      paymentMethod: updatedSubscription.payment_method,
      invoiceUrl: updatedSubscription.invoice_url,
      isActive: ['TRIAL', 'ACTIVE'].includes(updatedSubscription.status),
      isTrial: updatedSubscription.status === 'TRIAL',
      isSuspended: updatedSubscription.status === 'SUSPENDED',
    };

    return res.status(200).json({
      success: true,
      subscription: formattedSubscription,
      message: 'Assinatura renovada com sucesso',
    });

  } catch (error: any) {
    console.error('Erro ao renovar assinatura:', error);
    return res.status(500).json({ 
      error: error.message || 'Erro interno do servidor' 
    });
  }
} 