import { useState, useEffect, useCallback } from 'react';
import { internalAgentService, InternalAgent, InternalAgentFormData } from '@/services/internalAgentService';

export function useInternalAgents(tenantId?: string) {
  const [agents, setAgents] = useState<InternalAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await internalAgentService.listAgents(tenantId);
      setAgents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar agentes internos');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const createAgent = async (data: InternalAgentFormData) => {
    try {
      const newAgent = await internalAgentService.createAgent(data);
      setAgents(prev => [newAgent, ...prev]);
      return newAgent;
    } catch (err) {
      throw err;
    }
  };

  const updateAgent = async (id: string, data: Partial<InternalAgentFormData>) => {
    try {
      const updatedAgent = await internalAgentService.updateAgent(id, data);
      setAgents(prev => prev.map(agent => agent.id === id ? updatedAgent : agent));
      return updatedAgent;
    } catch (err) {
      throw err;
    }
  };

  const deleteAgent = async (id: string) => {
    try {
      await internalAgentService.deleteAgent(id);
      setAgents(prev => prev.filter(agent => agent.id !== id));
    } catch (err) {
      throw err;
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      const updatedAgent = await internalAgentService.toggleStatus(id);
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