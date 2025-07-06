import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Autenticação - usar token do header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autorização não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    
    // Criar cliente Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verificar usuário pelo token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    // Buscar assinatura ativa do usuário
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['TRIAL', 'ACTIVE'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subscriptionError) {
      if (subscriptionError.code === 'PGRST116') {
        // Nenhuma assinatura encontrada
        return res.status(404).json({ 
          error: 'Nenhuma assinatura ativa encontrada',
          subscription: null 
        });
      }
      return res.status(500).json({ error: 'Erro ao buscar assinatura: ' + subscriptionError.message });
    }

    // Verificar se a assinatura está vencida (TRIAL expirado)
    if (subscription.status === 'TRIAL') {
      const trialEndDate = new Date(subscription.next_due_date);
      const now = new Date();
      
      if (now > trialEndDate) {
        // Atualizar status para SUSPENDED
        await supabase
          .from('subscriptions')
          .update({ 
            status: 'SUSPENDED',
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);
        
        subscription.status = 'SUSPENDED';
      }
    }

    // Formatar resposta
    const formattedSubscription = {
      id: subscription.id,
      plan_name: subscription.plan_name,
      plan_type: subscription.plan_type,
      quantity: subscription.quantity || 1,
      allowed_instances: subscription.allowed_instances || 0,
      status: subscription.status,
      value: subscription.value,
      price: subscription.price || subscription.value,
      cycle: subscription.cycle,
      started_at: subscription.started_at,
      next_due_date: subscription.next_due_date,
      paid_at: subscription.paid_at,
      payment_method: subscription.payment_method,
      invoice_url: subscription.invoice_url,
      created_at: subscription.created_at,
      updated_at: subscription.updated_at,
    };

    return res.status(200).json({
      success: true,
      subscription: formattedSubscription,
    });

  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar assinatura.' });
  }
} 