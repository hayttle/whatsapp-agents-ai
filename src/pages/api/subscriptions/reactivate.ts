import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthResult } from '@/lib/auth/helpers';
import { reactivateAsaasSubscription } from '@/services/asaasService';
import { formatDateToISO } from '@/lib/utils';

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

    // Gerar data de hoje no formato YYYY-MM-DD para nextDueDate usando fuso horário correto
    const today = new Date();
    const nextDueDate = formatDateToISO(today, 'America/Sao_Paulo'); // Formato YYYY-MM-DD no fuso horário de São Paulo

    // Log do payload enviado para o Asaas
    const payload = { status: 'ACTIVE', nextDueDate };
    console.log('[Reativação Assinatura] Payload enviado para o Asaas:', payload);
    
    // Reativar assinatura no Asaas usando o serviço
    const asaasResult = await reactivateAsaasSubscription(subscription.asaas_subscription_id, nextDueDate);
    console.log('Assinatura reativada no Asaas:', asaasResult);
    console.log('Próxima data de vencimento:', nextDueDate);

    return res.status(200).json({
      success: true,
      message: `Solicitação de reativação enviada com sucesso. A próxima cobrança será em ${nextDueDate}. O status será atualizado em breve.`,
      asaasData: asaasResult,
      nextDueDate
    });

  } catch (error) {
    console.error('Erro ao reativar assinatura:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Erro interno: ' + errorMessage });
  }
}

export default withAuth(handler); 