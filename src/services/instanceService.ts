import { authenticatedFetch } from '@/lib/utils';
import { Instance } from "@/components/admin/instances/types";

export interface InstanceListResponse {
  instances: Instance[];
}

export interface ConnectResponse {
  base64?: string;
  pairingCode?: string;
}

export interface ApiResponse {
  success?: boolean;
  error?: string;
  instance?: Record<string, unknown>;
}

export interface CreateInstanceData {
  instanceName: string;
  descricao?: string;
  webhook_url?: string;
  behavior_settings?: Record<string, unknown>;
  tenant_id: string;
  status?: string;
  provider_type: string;
}

class InstanceService {
  async listInstances(tenantId?: string): Promise<InstanceListResponse> {
    let url = "/api/whatsapp-instances/list";
    if (tenantId) {
      url += `?tenantId=${tenantId}`;
    }
    
    return authenticatedFetch(url);
  }

  async connectInstance(instanceName: string, forceRegenerate?: boolean): Promise<ConnectResponse> {
    return authenticatedFetch('/api/whatsapp-instances/connect', {
      method: 'POST',
      body: JSON.stringify({ instanceName, forceRegenerate }),
    });
  }

  async disconnectInstance(instanceName: string): Promise<ApiResponse> {
    return authenticatedFetch('/api/whatsapp-instances/disconnect', {
      method: 'POST',
      body: JSON.stringify({ instanceName }),
    });
  }

  async deleteInstance(instanceName: string): Promise<ApiResponse> {
    return authenticatedFetch("/api/whatsapp-instances/delete", {
      method: "DELETE",
      body: JSON.stringify({ instanceName }),
    });
  }

  async createInstance(instanceData: CreateInstanceData): Promise<ApiResponse> {
    // Determinar o endpoint baseado no provider_type
    const endpoint = instanceData.provider_type === 'externo' 
      ? "/api/whatsapp-instances/external/create"
      : "/api/whatsapp-instances/internal/create";
    
    return authenticatedFetch(endpoint, {
      method: "POST",
      body: JSON.stringify(instanceData),
    });
  }

  async updateInstance(id: string, updateData: Partial<Instance>): Promise<ApiResponse> {
    // Determinar o endpoint baseado no provider_type fornecido
    const providerType = updateData.provider_type;
    
    if (!providerType) {
      throw new Error('provider_type é obrigatório para atualização');
    }
    
    // Determinar o endpoint baseado no tipo da instância
    const endpoint = providerType === 'externo' 
      ? "/api/whatsapp-instances/external/update"
      : "/api/whatsapp-instances/internal/update";
    
    return authenticatedFetch(endpoint, {
      method: "PUT",
      body: JSON.stringify({ id, ...updateData }),
    });
  }

  async getInstanceByName(instanceName: string): Promise<Instance | null> {
    const data = await authenticatedFetch(`/api/whatsapp-instances/list`);
    return data.instances.find((inst: Instance) => inst.instanceName === instanceName) || null;
  }
}

export const instanceService = new InstanceService(); 