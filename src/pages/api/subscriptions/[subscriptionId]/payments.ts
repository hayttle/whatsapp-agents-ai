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

    const { subscriptionId } = req.query;
    if (!subscriptionId || typeof subscriptionId !== 'string') {
      return res.status(400).json({ error: 'ID da assinatura é obrigatório' });
    }

    // Buscar dados do usuário para verificar permissões
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Buscar a assinatura para verificar permissões
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('tenant_id, user_id')
      .eq('id', subscriptionId)
      .single();

    if (subscriptionError || !subscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    // Verificar permissões: usuário pode ver apenas suas próprias assinaturas, super_admin pode ver todas
    if (userData.role !== 'super_admin' && 
        subscription.user_id !== user.id && 
        subscription.tenant_id !== userData.tenant_id) {
      return res.status(403).json({ error: 'Sem permissão para acessar esta assinatura' });
    }

    // Buscar pagamentos da assinatura
    const { data: payments, error: paymentsError } = await supabase
      .from('subscription_payments')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.error('Erro ao buscar pagamentos:', paymentsError);
      return res.status(500).json({ error: 'Erro ao buscar histórico de pagamentos' });
    }

    return res.status(200).json({
      success: true,
      payments: payments || []
    });

  } catch (error: any) {
    console.error('Erro ao buscar pagamentos:', error);
    return res.status(500).json({ 
      error: error.message || 'Erro interno do servidor' 
    });
  }
} 