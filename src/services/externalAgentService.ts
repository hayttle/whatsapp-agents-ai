export interface ExternalAgent {
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
  agent_type: 'external';
  created_at?: string;
  updated_at?: string;
}

export interface ExternalAgentFormData {
  tenant_id: string;
  instance_id?: string;
  title: string;
  webhookUrl: string;
  description?: string;
}

class ExternalAgentService {
  async createAgent(data: ExternalAgentFormData): Promise<ExternalAgent> {
    const response = await fetch('/api/agents/external/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar agente externo');
    }

    const result = await response.json();
    return result.agent;
  }

  async updateAgent(id: string, data: Partial<ExternalAgentFormData>): Promise<ExternalAgent> {
    const response = await fetch('/api/agents/external/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar agente externo');
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
      throw new Error(error.error || 'Erro ao deletar agente externo');
    }
  }

  async listAgents(tenantId?: string): Promise<ExternalAgent[]> {
    const url = tenantId 
      ? `/api/agents/external/list?tenantId=${tenantId}`
      : '/api/agents/external/list';
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao listar agentes externos');
    }

    const result = await response.json();
    return result.agents;
  }

  async toggleStatus(id: string): Promise<ExternalAgent> {
    const response = await fetch('/api/agents/toggle-status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao alterar status do agente externo');
    }

    const result = await response.json();
    return result.agent;
  }
}

export const externalAgentService = new ExternalAgentService(); 