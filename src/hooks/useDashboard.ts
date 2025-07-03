"use client";
import { useEffect, useState, useCallback } from 'react';
import { useUserRole } from './useUserRole';
import { instanceService } from '@/services/instanceService';
import { agentService } from '@/services/agentService';
import { userService } from '@/services/userService';

interface DashboardStats {
  // Para usuário comum
  instancesActive: number;
  instancesInactive: number;
  agentsTotal: number;
  
  // Para super admin
  instancesInternal: number;
  instancesExternal: number;
  agentsInternal: number;
  agentsExternal: number;
  usersActive: number;
  usersInactive: number;
}

interface UseDashboardReturn {
  stats: DashboardStats;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  const { isSuperAdmin, userData } = useUserRole();
  const [stats, setStats] = useState<DashboardStats>({
    instancesActive: 0,
    instancesInactive: 0,
    agentsTotal: 0,
    instancesInternal: 0,
    instancesExternal: 0,
    agentsInternal: 0,
    agentsExternal: 0,
    usersActive: 0,
    usersInactive: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const tenantId = userData?.tenant_id;
      const newStats: DashboardStats = {
        instancesActive: 0,
        instancesInactive: 0,
        agentsTotal: 0,
        instancesInternal: 0,
        instancesExternal: 0,
        agentsInternal: 0,
        agentsExternal: 0,
        usersActive: 0,
        usersInactive: 0,
      };

      // Buscar instâncias
      try {
        const instancesResponse = await instanceService.listInstances(tenantId);
        const instances = instancesResponse.instances || [];

        if (isSuperAdmin) {
          // Para super admin: contar por tipo
          instances.forEach(instance => {
            if (instance.provider_type === 'nativo') {
              newStats.instancesInternal++;
            } else if (instance.provider_type === 'externo') {
              newStats.instancesExternal++;
            }
          });
        } else {
          // Para usuário comum: contar por status
          instances.forEach(instance => {
            if (instance.status === 'open') {
              newStats.instancesActive++;
            } else {
              newStats.instancesInactive++;
            }
          });
        }
      } catch (error) {
        console.error('[Dashboard] Erro ao buscar instâncias:', error);
      }

      // Buscar agentes
      try {
        const agentsResponse = await agentService.listAgents(tenantId);
        const agents = agentsResponse.agents || [];

        if (isSuperAdmin) {
          // Para super admin: contar por tipo
          agents.forEach(agent => {
            if (agent.agent_type === 'internal') {
              newStats.agentsInternal++;
            } else {
              newStats.agentsExternal++;
            }
          });
        } else {
          // Para usuário comum: total de agentes
          newStats.agentsTotal = agents.length;
        }
      } catch (error) {
        console.error('[Dashboard] Erro ao buscar agentes:', error);
      }

      // Buscar usuários (apenas para super admin)
      if (isSuperAdmin) {
        try {
          const usersResponse = await userService.listUsers();
          const users = usersResponse.users || [];

          users.forEach(user => {
            // Considerar usuário ativo se foi criado nos últimos 30 dias ou tem atividade recente
            const isActive = user.created_at && 
              new Date(user.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            
            if (isActive) {
              newStats.usersActive++;
            } else {
              newStats.usersInactive++;
            }
          });
        } catch (error) {
          console.error('[Dashboard] Erro ao buscar usuários:', error);
        }
      }

      setStats(newStats);
    } catch (error) {
      console.error('[Dashboard] Erro geral:', error);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdmin, userData]);

  useEffect(() => {
    if (userData) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, userData]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchDashboardData
  };
} 