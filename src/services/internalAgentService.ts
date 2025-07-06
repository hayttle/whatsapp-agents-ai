import { authenticatedFetch } from '@/lib/utils';

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
    const result = await authenticatedFetch('/api/agents/internal/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return result.agent;
  }

  async updateAgent(id: string, data: Partial<InternalAgentFormData>): Promise<InternalAgent> {
    const result = await authenticatedFetch('/api/agents/internal/update', {
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

  async listAgents(tenantId?: string): Promise<InternalAgent[]> {
    const url = tenantId 
      ? `/api/agents/list?tenantId=${tenantId}&agent_type=internal`
      : '/api/agents/list?agent_type=internal';
    
    const result = await authenticatedFetch(url);
    return result.agents;
  }

  async toggleStatus(id: string): Promise<InternalAgent> {
    const result = await authenticatedFetch('/api/agents/toggle-status', {
      method: 'PUT',
      body: JSON.stringify({ id }),
    });

    return result.agent;
  }
}

export const internalAgentService = new InternalAgentService(); 