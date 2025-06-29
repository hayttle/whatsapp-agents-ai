import { useState, useEffect, useCallback } from 'react';
import { externalAgentService, ExternalAgent, ExternalAgentFormData } from '@/services/externalAgentService';

export function useExternalAgents(tenantId?: string) {
  const [agents, setAgents] = useState<ExternalAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await externalAgentService.listAgents(tenantId);
      setAgents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar agentes externos');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const createAgent = async (data: ExternalAgentFormData) => {
    try {
      const newAgent = await externalAgentService.createAgent(data);
      setAgents(prev => [newAgent, ...prev]);
      return newAgent;
    } catch (err) {
      throw err;
    }
  };

  const updateAgent = async (id: string, data: Partial<ExternalAgentFormData>) => {
    try {
      const updatedAgent = await externalAgentService.updateAgent(id, data);
      setAgents(prev => prev.map(agent => agent.id === id ? updatedAgent : agent));
      return updatedAgent;
    } catch (err) {
      throw err;
    }
  };

  const deleteAgent = async (id: string) => {
    try {
      await externalAgentService.deleteAgent(id);
      setAgents(prev => prev.filter(agent => agent.id !== id));
    } catch (err) {
      throw err;
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      const updatedAgent = await externalAgentService.toggleStatus(id);
      setAgents(prev => prev.map(agent => agent.id === id ? updatedAgent : agent));
      return updatedAgent;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return {
    agents,
    loading,
    error,
    createAgent,
    updateAgent,
    deleteAgent,
    toggleStatus,
    refresh: fetchAgents
  };
} 