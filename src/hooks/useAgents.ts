import { useEffect, useState, useCallback } from 'react';
import { Agent } from '@/services/agentService';
import { agentService } from '@/services/agentService';


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
  const [data, setData] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgentes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await agentService.listAgents(isSuperAdmin ? undefined : tenantId);
      setData(response.agents || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar agentes';
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
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover agente';
      throw new Error(errorMessage);
    }
  }, [fetchAgentes]);

  const toggleAgentStatus = useCallback(async (id: string, active: boolean) => {
    try {
      await agentService.toggleAgentStatus(id, active);
      await fetchAgentes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao alterar status do agente';
      throw new Error(errorMessage);
    }
  }, [fetchAgentes]);

  useEffect(() => {
    fetchAgentes();
  }, [fetchAgentes]);

  return {
    data,
    loading,
    error,
    refetch: fetchAgentes,
    createAgent,
    updateAgent,
    deleteAgent,
    toggleAgentStatus,
  };
}; 