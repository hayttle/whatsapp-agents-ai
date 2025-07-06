import { createClient } from '@/lib/supabase/client';
import { UsageStats } from '@/lib/plans';

const supabase = createClient();

export interface UsageResponse {
  usage: UsageStats;
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

  async getUsageStatsForUser(userId: string): Promise<UsageResponse> {
    try {
      // Buscar tenant do usuário
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', userId)
        .single();

      if (userError || !user?.tenant_id) {
        throw new Error('Usuário não encontrado ou sem tenant');
      }

      return this.getUsageStats(user.tenant_id);
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
}

export const usageService = new UsageService(); 