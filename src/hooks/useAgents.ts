import { useEffect, useState, useCallback } from 'react';
import { Agent } from '@/services/agentService';
import { agentService } from '@/services/agentService';
import { tenantService } from '@/services/tenantService';
import { Instance } from '@/components/admin/instances/types';

interface UseAgentsProps {
  isSuperAdmin: boolean;
  tenantId?: string;
}

interface AgentFormData {
  tenant_id: string;
  instance_id: string;
  title: string;
  prompt: string;
  fallback_message: string;
  active: boolean;
}

export const useAgents = ({ isSuperAdmin, tenantId }: UseAgentsProps) => {
  const [agentes, setAgentes] = useState<Agent[]>([]);
  const [empresas, setEmpresas] = useState<Record<string, string>>({});
  const [instancias, setInstancias] = useState<Record<string, Instance>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgentes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await agentService.listAgents(isSuperAdmin ? undefined : tenantId);
      setAgentes(data.agents || []);
      
      if (isSuperAdmin && data.agents) {
        const tenantIds = [...new Set(data.agents.map((a: Agent) => a.tenant_id).filter(Boolean))];
        if (tenantIds.length > 0) {
          const dataEmp = await tenantService.listTenants();
          const empresaMap = (dataEmp.tenants || []).reduce((acc: Record<string, string>, t) => {
            acc[t.id] = t.name;
            return acc;
          }, {});
          setEmpresas(empresaMap);
        } else {
          setEmpresas({});
        }
      }
      
      // Buscar nomes das instâncias
      const instanceIds = Array.from(new Set((data.agents || []).map((a: Agent) => a.instance_id).filter(Boolean)));
      if (instanceIds.length > 0) {
        // TODO: Criar instanceService.listInstancesByIds quando necessário
        // Por enquanto, vamos manter a lógica atual
        const insts = await fetch('/api/whatsapp-instances/list').then(res => res.json());
        const instMap: Record<string, Instance> = {};
        (insts?.instances || []).forEach((i: Instance) => { instMap[i.id] = i; });
        setInstancias(instMap);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, tenantId]);

  const createAgent = useCallback(async (agentData: AgentFormData) => {
    try {
      await agentService.createAgent(agentData);
      await fetchAgentes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      throw new Error(errorMessage);
    }
  }, [fetchAgentes]);

  const updateAgent = useCallback(async (id: string, agentData: Partial<AgentFormData>) => {
    try {
      await agentService.updateAgent(id, agentData);
      await fetchAgentes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      throw new Error(errorMessage);
    }
  }, [fetchAgentes]);

  const deleteAgent = useCallback(async (id: string) => {
    try {
      await agentService.deleteAgent(id);
      await fetchAgentes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      throw new Error(errorMessage);
    }
  }, [fetchAgentes]);

  const toggleAgentStatus = useCallback(async (id: string, active: boolean) => {
    try {
      await agentService.toggleAgentStatus(id, active);
      await fetchAgentes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      throw new Error(errorMessage);
    }
  }, [fetchAgentes]);

  useEffect(() => {
    fetchAgentes();
  }, [fetchAgentes]);

  return {
    agentes,
    empresas,
    instancias,
    loading,
    error,
    refetch: fetchAgentes,
    createAgent,
    updateAgent,
    deleteAgent,
    toggleAgentStatus,
  };
}; 