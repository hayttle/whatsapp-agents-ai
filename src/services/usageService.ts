import { createClient } from '@supabase/supabase-js';
import { UsageStats, ActiveSubscription, TotalLimits, calculateTotalLimits, checkTotalPlanLimits, getTotalUsagePercentage } from '@/lib/plans';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface UsageResponse {
  usage: UsageStats;
  success: boolean;
  error?: string;
}

export interface TotalLimitsResponse {
  totalLimits: TotalLimits;
  success: boolean;
  error?: string;
}

export interface PlanLimitsResponse {
  allowed: boolean;
  reason?: string;
  totalLimits?: TotalLimits;
  success: boolean;
  error?: string;
}

class UsageService {
  async getUsageStats(tenantId: string): Promise<UsageResponse> {
    try {
      // Buscar instâncias
      const { data: instances, error: instancesError } = await supabase
        .from('whatsapp_instances')
        .select('provider_type')
        .eq('tenant_id', tenantId);

      if (instancesError) {
        throw new Error(`Erro ao buscar instâncias: ${instancesError.message}`);
      }

      // Buscar agentes
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('agent_type')
        .eq('tenant_id', tenantId);

      if (agentsError) {
        throw new Error(`Erro ao buscar agentes: ${agentsError.message}`);
      }

      // Calcular estatísticas
      const usage: UsageStats = {
        nativeInstances: 0,
        externalInstances: 0,
        internalAgents: 0,
        externalAgents: 0,
      };

      // Contar instâncias
      instances?.forEach(instance => {
        if (instance.provider_type === 'nativo') {
          usage.nativeInstances++;
        } else if (instance.provider_type === 'externo') {
          usage.externalInstances++;
        }
      });

      // Contar agentes
      agents?.forEach(agent => {
        if (agent.agent_type === 'internal') {
          usage.internalAgents++;
        } else if (agent.agent_type === 'external') {
          usage.externalAgents++;
        }
      });

      return {
        usage,
        success: true,
      };
    } catch (error) {
      return {
        usage: {
          nativeInstances: 0,
          externalInstances: 0,
          internalAgents: 0,
          externalAgents: 0,
        },
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  // Nova função para buscar todas as assinaturas ativas de um tenant
  async getActiveSubscriptions(tenantId: string): Promise<ActiveSubscription[]> {
    try {
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('plan_name, quantity, status')
        .eq('tenant_id', tenantId)
        .in('status', ['ACTIVE', 'PENDING'])
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar assinaturas: ${error.message}`);
      }

      return subscriptions || [];
    } catch (error) {
      console.error('Erro ao buscar assinaturas ativas:', error);
      return [];
    }
  }

  // Nova função para calcular limites totais de um tenant
  async getTotalLimits(tenantId: string): Promise<TotalLimitsResponse> {
    try {
      const subscriptions = await this.getActiveSubscriptions(tenantId);
      const totalLimits = calculateTotalLimits(subscriptions);

      return {
        totalLimits,
        success: true,
      };
    } catch (error) {
      return {
        totalLimits: {
          nativeInstances: 0,
          externalInstances: 0,
          internalAgents: 0,
          externalAgents: 0,
          subscriptions: [],
        },
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  // Nova função para verificar se uma ação é permitida considerando todas as assinaturas
  async checkPlanLimits(
    tenantId: string,
    action: 'create_instance' | 'create_agent',
    type: 'native' | 'external' | 'internal' | 'external'
  ): Promise<PlanLimitsResponse> {
    try {
      const [usageResponse, subscriptions] = await Promise.all([
        this.getUsageStats(tenantId),
        this.getActiveSubscriptions(tenantId)
      ]);

      if (!usageResponse.success) {
        throw new Error(usageResponse.error || 'Erro ao buscar estatísticas de uso');
      }

      const limitCheck = checkTotalPlanLimits(
        subscriptions,
        usageResponse.usage,
        action,
        type
      );

      return {
        ...limitCheck,
        success: true,
      };
    } catch (error) {
      return {
        allowed: false,
        reason: 'Erro ao verificar limites do plano',
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  // Nova função para obter porcentagem de uso total
  async getTotalUsagePercentage(tenantId: string): Promise<Record<string, number>> {
    try {
      const [usageResponse, subscriptions] = await Promise.all([
        this.getUsageStats(tenantId),
        this.getActiveSubscriptions(tenantId)
      ]);

      if (!usageResponse.success) {
        return {
          nativeInstances: 0,
          externalInstances: 0,
          internalAgents: 0,
          externalAgents: 0,
        };
      }

      return getTotalUsagePercentage(subscriptions, usageResponse.usage);
    } catch (error) {
      console.error('Erro ao calcular porcentagem de uso:', error);
      return {
        nativeInstances: 0,
        externalInstances: 0,
        internalAgents: 0,
        externalAgents: 0,
      };
    }
  }
}

export const usageService = new UsageService(); 