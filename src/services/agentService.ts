export interface Agent {
  id: string;
  tenant_id: string;
  instance_id?: string | null;
  title: string;
  prompt: string;
  fallback_message: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  personality?: string;
  custom_personality?: string;
  tone?: string;
  description?: string | null;
  agent_type?: 'internal' | 'external';
}

export interface AgentListResponse {
  agents: Agent[];
}

export interface ApiResponse {
  success?: boolean;
  error?: string;
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
      throw new Error(data.error || `Erro na requisição: ${response.status}`);
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

  async createAgent(agentData: Omit<Agent, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse> {
    // Determinar o endpoint baseado no agent_type
    const endpoint = agentData.agent_type === 'external' 
      ? "/api/agents/external/create"
      : "/api/agents/internal/create";
    
    return this.makeRequest<ApiResponse>(endpoint, {
      method: "POST",
      body: JSON.stringify(agentData),
    });
  }

  async updateAgent(agentId: string, agentData: Partial<Agent>): Promise<ApiResponse> {
    // Se agent_type não está no agentData, buscar do agente existente
    let agentType = agentData.agent_type;
    
    if (!agentType) {
      // Buscar o agent_type do agente
      const response = await fetch(`/api/agents/list`);
      const data = await response.json();
      const agent = data.agents?.find((a: Agent) => a.id === agentId);
      agentType = agent?.agent_type;
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
}

export const agentService = new AgentService(); 