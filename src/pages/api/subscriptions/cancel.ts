import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthResult } from '@/lib/auth/helpers';

async function handler(req: NextApiRequest, res: NextApiResponse, auth: AuthResult) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user, supabase } = auth;
    const { subscriptionId } = req.body;

    // Verificar permissões
    if (!user.role || !['user', 'super_admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }

    if (!subscriptionId) {
      return res.status(400).json({ error: 'ID da assinatura é obrigatório' });
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

    // Buscar a assinatura para verificar se pertence ao usuário
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (subscriptionError || !subscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    if (!subscription.asaas_subscription_id) {
      return res.status(400).json({ error: 'Assinatura não possui ID do Asaas' });
    }

    // Cancelar assinatura no Asaas
    const asaasResponse = await fetch(
      `https://api-sandbox.asaas.com/v3/subscriptions/${subscription.asaas_subscription_id}`,
      {
        method: 'PUT',
        headers: {
          'accept': 'application/json',
          'access_token': process.env.ASAAS_API_TOKEN!,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          status: 'INACTIVE'
        }),
      }
    );

    if (!asaasResponse.ok) {
      const asaasError = await asaasResponse.json();
      console.error('Erro ao cancelar no Asaas:', asaasError);
      return res.status(500).json({ error: 'Erro ao cancelar assinatura no gateway de pagamento' });
    }

    // Atualizar status da assinatura no banco local
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'INACTIVE',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('Erro ao atualizar assinatura local:', updateError);
      return res.status(500).json({ error: 'Erro ao atualizar status da assinatura' });
    }

    return res.status(200).json({
      success: true,
      message: 'Assinatura cancelada com sucesso',
    });

  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Erro interno: ' + errorMessage });
  }
}

export default withAuth(handler); 