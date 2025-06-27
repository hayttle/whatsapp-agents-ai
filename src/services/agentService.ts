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
    return this.makeRequest<ApiResponse>("/api/agents/create", {
      method: "POST",
      body: JSON.stringify(agentData),
    });
  }

  async updateAgent(agentId: string, agentData: Partial<Agent>): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>("/api/agents/update", {
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