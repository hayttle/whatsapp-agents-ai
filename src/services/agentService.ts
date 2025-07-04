export interface Agent {
  id: string;
  tenant_id: string;
  instance_id?: string | null;
  title: string;
  prompt?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  personality?: string;
  custom_personality?: string;
  tone?: string;
  description?: string | null;
  agent_type?: 'internal' | 'external';
  agent_model_id?: string | null;
  webhookUrl?: string | null;
}

export interface AgentListResponse {
  agents: Agent[];
}

export interface ApiResponse {
  success?: boolean;
  error?: string;
  agent?: Agent;
}

class AgentService {
  private async makeRequest<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw { message: data.error || `Erro na requisição: ${response.status}`, code: data.code, error: data.error };
    }

    return data;
  }

  async listAgents(tenantId?: string): Promise<AgentListResponse> {
    let url = "/api/agents/list";
    if (tenantId) {
      url += `?tenantId=${tenantId}`;
    }
    
    return this.makeRequest<AgentListResponse>(url);
  }

  async createAgent(agentData: Omit<Agent, 'id' | 'created_at' | 'updated_at' | 'prompt' | 'fallback_message'> & { prompt?: string }): Promise<ApiResponse> {
    // Usar endpoint único para criação de agentes
    return this.makeRequest<ApiResponse>("/api/agents/create", {
      method: "POST",
      body: JSON.stringify(agentData),
    });
  }

  async updateAgent(agentId: string, agentData: Partial<Agent>): Promise<ApiResponse> {
    // Determinar o endpoint baseado no agent_type fornecido
    const agentType = agentData.agent_type;
    
    if (!agentType) {
      throw new Error('agent_type é obrigatório para atualização');
    }
    
    // Determinar o endpoint baseado no agent_type
    const endpoint = agentType === 'external' 
      ? "/api/agents/external/update"
      : "/api/agents/internal/update";
    
    return this.makeRequest<ApiResponse>(endpoint, {
      method: "PUT",
      body: JSON.stringify({ id: agentId, ...agentData }),
    });
  }

  async deleteAgent(agentId: string): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>("/api/agents/delete", {
      method: "DELETE",
      body: JSON.stringify({ id: agentId }),
    });
  }

  async toggleAgentStatus(agentId: string, active: boolean): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>("/api/agents/toggle-status", {
      method: "PUT",
      body: JSON.stringify({ id: agentId, active }),
    });
  }

  async getAgentById(agentId: string): Promise<Agent | null> {
    const data = await this.makeRequest<{ agent: Agent }>(`/api/agents/${agentId}`);
    return data.agent || null;
  }
}

export const agentService = new AgentService(); 