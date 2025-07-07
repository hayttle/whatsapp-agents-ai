import { SupabaseClient } from '@supabase/supabase-js';

export interface Trial {
  id: string;
  tenant_id: string;
  started_at: string;
  expires_at: string;
  status: 'ACTIVE' | 'EXPIRED';
  created_at: string;
  updated_at: string;
}

export interface TrialStatus {
  hasActiveTrial: boolean;
  isExpired: boolean;
  daysRemaining: number;
  trial?: Trial;
}

export class TrialService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Cria um novo trial para um tenant
   */
  async createTrial(tenantId: string, daysDuration: number = 7): Promise<Trial> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysDuration);

    const { data: trial, error } = await this.supabase
      .from('trials')
      .insert({
        tenant_id: tenantId,
        expires_at: expiresAt.toISOString(),
        status: 'ACTIVE'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar trial: ${error.message}`);
    }

    return trial;
  }

  /**
   * Verifica o status do trial de um tenant
   */
  async getTrialStatus(tenantId: string): Promise<TrialStatus> {
    const { data: trial, error } = await this.supabase
      .from('trials')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // Se não encontrar trial, retorna status sem trial ativo
      if (error.code === 'PGRST116') {
        return {
          hasActiveTrial: false,
          isExpired: false,
          daysRemaining: 0
        };
      }
      throw new Error(`Erro ao buscar trial: ${error.message}`);
    }

    const now = new Date();
    const expiresAt = new Date(trial.expires_at);
    const isExpired = expiresAt <= now;
    const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Se o trial expirou, atualiza o status
    if (isExpired && trial.status === 'ACTIVE') {
      await this.updateTrialStatus(trial.id, 'EXPIRED');
      trial.status = 'EXPIRED';
    }

    return {
      hasActiveTrial: trial.status === 'ACTIVE' && !isExpired,
      isExpired: isExpired,
      daysRemaining,
      trial
    };
  }

  /**
   * Atualiza o status de um trial
   */
  async updateTrialStatus(trialId: string, status: 'ACTIVE' | 'EXPIRED'): Promise<void> {
    const { error } = await this.supabase
      .from('trials')
      .update({ status })
      .eq('id', trialId);

    if (error) {
      throw new Error(`Erro ao atualizar trial: ${error.message}`);
    }
  }

  /**
   * Verifica se um tenant tem acesso (trial ativo ou assinatura paga)
   */
  async hasAccess(tenantId: string): Promise<boolean> {
    // Primeiro verifica se tem assinatura paga ativa
    const { data: subscription } = await this.supabase
      .from('subscriptions')
      .select('status')
      .eq('tenant_id', tenantId)
      .in('status', ['ACTIVE', 'PENDING'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subscription) {
      return true; // Tem assinatura paga ativa
    }

    // Se não tem assinatura paga, verifica trial
    const trialStatus = await this.getTrialStatus(tenantId);
    return trialStatus.hasActiveTrial;
  }

  /**
   * Obtém informações completas de acesso (trial + assinatura)
   */
  async getAccessInfo(tenantId: string): Promise<{
    hasAccess: boolean;
    trialStatus: TrialStatus;
    hasActiveSubscription: boolean;
    subscription?: any;
  }> {
    // Busca assinatura ativa
    const { data: subscription } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('status', ['ACTIVE', 'PENDING'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Busca status do trial
    const trialStatus = await this.getTrialStatus(tenantId);

    const hasActiveSubscription = !!subscription;
    const hasAccess = hasActiveSubscription || trialStatus.hasActiveTrial;

    return {
      hasAccess,
      trialStatus,
      hasActiveSubscription,
      subscription
    };
  }
} 