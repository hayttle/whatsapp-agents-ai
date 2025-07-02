import { useState, useEffect, useCallback } from 'react';
import { PromptModel, getPromptModelById } from '@/services/promptModelService';

interface AgentData {
  id: string;
  title: string;
  description?: string;
  prompt: string;
  fallback_message: string;
  active: boolean;
  personality?: string;
  custom_personality?: string;
  tone?: string;
  rules?: string;
  buffer_time?: number;
  agent_model_id?: string | null;
  scheduling_enabled?: boolean;
  calendar_id?: string;
  scheduling_query_prompt?: string;
  scheduling_create_prompt?: string;
  webhookUrl?: string;
  agent_type?: 'internal' | 'external';
  prompt_models?: PromptModel;
  tenant_id?: string;
  instance_id?: string | null;
}

interface UseAgentConfigProps {
  agentId: string;
}

export function useAgentConfig({ agentId }: UseAgentConfigProps) {
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados do agente
  const loadAgent = useCallback(async () => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/agents/${agentId}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar agente');
      }
      
      const data = await response.json();
      
      // Se o agente tem um modelo de prompt, buscar os dados do modelo
      if (data.agent_model_id) {
        try {
          const modelData = await getPromptModelById(data.agent_model_id);
          data.prompt_models = modelData;
        } catch (modelError) {
          console.warn('Erro ao carregar modelo de prompt:', modelError);
          // Não falhar se não conseguir carregar o modelo
        }
      }
      
      setAgent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  // Salvar dados do agente
  const saveAgent = async (agentData: Partial<AgentData>) => {
    try {
      setSaving(true);
      setError(null);

      // Escolher endpoint conforme o tipo do agente
      const endpoint =
        agent?.agent_type === 'external'
          ? '/api/agents/external/update'
          : '/api/agents/internal/update';

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: agentId,
          ...agentData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar agente');
      }

      const updatedAgent = await response.json();
      setAgent(updatedAgent);
      return { success: true, agent: updatedAgent };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSaving(false);
    }
  };

  // Atualizar campo específico
  const updateField = (field: keyof AgentData, value: string | number | boolean | null | undefined) => {
    if (agent) {
      setAgent(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  useEffect(() => {
    loadAgent();
  }, [loadAgent]);

  return {
    agent,
    loading,
    saving,
    error,
    loadAgent,
    saveAgent,
    updateField,
  };
} 