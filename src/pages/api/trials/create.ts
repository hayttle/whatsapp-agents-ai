import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthResult } from '@/lib/auth/helpers';
import { TrialService } from '@/services/trialService';

async function handler(req: NextApiRequest, res: NextApiResponse, auth: AuthResult) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user, supabase } = auth;

    // Verificar permissões
    if (!user.role || !['user', 'super_admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
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

    const trialService = new TrialService(supabase);

    // Verificar se já existe um trial ativo
    const existingTrialStatus = await trialService.getTrialStatus(userData.tenant_id);
    
    if (existingTrialStatus.hasActiveTrial) {
      return res.status(400).json({ 
        error: 'Usuário já possui um trial ativo',
        trialStatus: existingTrialStatus 
      });
    }

    // Criar novo trial (7 dias por padrão)
    const { daysDuration = 7 } = req.body;
    const trial = await trialService.createTrial(userData.tenant_id, daysDuration);

    // Buscar status atualizado
    const trialStatus = await trialService.getTrialStatus(userData.tenant_id);

    return res.status(201).json({
      success: true,
      trial,
      trialStatus,
      message: `Trial criado com sucesso. Expira em ${daysDuration} dias.`
    });

  } catch (error) {
    console.error('[Create Trial] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Erro interno: ' + errorMessage });
  }
}

export default withAuth(handler); 