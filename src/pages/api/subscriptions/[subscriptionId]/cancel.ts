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

    const { subscriptionId } = req.query;
    if (!subscriptionId || typeof subscriptionId !== 'string') {
      return res.status(400).json({ error: 'subscriptionId é obrigatório' });
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

    // Buscar assinatura
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (subscriptionError || !subscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    // Verificar se a assinatura pode ser cancelada
    if (subscription.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Assinatura já está cancelada' });
    }

    // Cancelar no Asaas se houver asaas_subscription_id
    if (subscription.asaas_subscription_id) {
      try {
        await asaasRequest(`/subscriptions/${subscription.asaas_subscription_id}/cancel`, {
          method: 'POST'
        });
      } catch (asaasError: any) {
        // Se o erro for que a assinatura já está cancelada no Asaas, continuar
        if (asaasError.message?.includes('already cancelled') || asaasError.message?.includes('not found')) {
          console.log('Assinatura já cancelada no Asaas ou não encontrada');
        } else {
          return res.status(500).json({ error: 'Erro ao cancelar no Asaas: ' + asaasError.message });
        }
      }
    }

    // Atualizar status no banco local
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'CANCELLED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (updateError) {
      return res.status(500).json({ error: 'Erro ao cancelar assinatura: ' + updateError.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Assinatura cancelada com sucesso',
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Erro interno: ' + errorMessage });
  }
} 