import { authenticatedFetch } from '@/lib/utils';

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
  active?: boolean;
}

class ExternalAgentService {
  async createAgent(data: ExternalAgentFormData): Promise<ExternalAgent> {
    const result = await authenticatedFetch('/api/agents/external/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return result.agent;
  }

  async updateAgent(id: string, data: Partial<ExternalAgentFormData>): Promise<ExternalAgent> {
    const result = await authenticatedFetch('/api/agents/external/update', {
      method: 'PUT',
      body: JSON.stringify({ id, ...data }),
    });

    return result.agent;
  }

  async deleteAgent(id: string): Promise<void> {
    await authenticatedFetch('/api/agents/delete', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  }

  async listAgents(tenantId?: string): Promise<ExternalAgent[]> {
    const url = tenantId 
      ? `/api/agents/list?tenantId=${tenantId}&agent_type=external`
      : '/api/agents/list?agent_type=external';
    
    const result = await authenticatedFetch(url);
    return result.agents;
  }

  async toggleStatus(id: string): Promise<ExternalAgent> {
    const result = await authenticatedFetch('/api/agents/toggle-status', {
      method: 'PUT',
      body: JSON.stringify({ id }),
    });

    return result.agent;
  }
}

export const externalAgentService = new ExternalAgentService(); 