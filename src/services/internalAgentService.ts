export interface InternalAgent {
  id: string;
  tenant_id: string;
  instance_id?: string | null;
  title: string;
  prompt: string;
  fallback_message: string;
  active: boolean;
  personality?: string | null;
  custom_personality?: string | null;
  tone?: string | null;
  webhookUrl: string;
  description?: string | null;
  agent_type: 'internal';
  created_at?: string;
  updated_at?: string;
}

export interface InternalAgentFormData {
  tenant_id: string;
  instance_id?: string;
  title: string;
  prompt: string;
  fallback_message: string;
  active?: boolean;
  personality?: string;
  custom_personality?: string;
  tone?: string;
  description?: string;
}

class InternalAgentService {
  async createAgent(data: InternalAgentFormData): Promise<InternalAgent> {
    const response = await fetch('/api/agents/internal/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar agente interno');
    }

    const result = await response.json();
    return result.agent;
  }

  async updateAgent(id: string, data: Partial<InternalAgentFormData>): Promise<InternalAgent> {
    const response = await fetch('/api/agents/internal/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar agente interno');
    }

    const result = await response.json();
    return result.agent;
  }

  async deleteAgent(id: string): Promise<void> {
    const response = await fetch('/api/agents/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao deletar agente interno');
    }
  }

  async listAgents(tenantId?: string): Promise<InternalAgent[]> {
    const url = tenantId 
      ? `/api/agents/internal/list?tenantId=${tenantId}`
      : '/api/agents/internal/list';
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao listar agentes internos');
    }

    const result = await response.json();
    return result.agents;
  }

  async toggleStatus(id: string): Promise<InternalAgent> {
    const response = await fetch('/api/agents/toggle-status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao alterar status do agente interno');
    }

    const result = await response.json();
    return result.agent;
  }
}

export const internalAgentService = new InternalAgentService(); 