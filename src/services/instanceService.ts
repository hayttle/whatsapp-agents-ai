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

  async listInstances(tenantId?: string): Promise<InstanceListResponse> {
    let url = "/api/whatsapp-instances/list";
    if (tenantId) {
      url += `?tenantId=${tenantId}`;
    }
    
    return this.makeRequest<InstanceListResponse>(url);
  }

  async connectInstance(instanceName: string, forceRegenerate?: boolean): Promise<ConnectResponse> {
    const response = await this.makeRequest<ConnectResponse>('/api/whatsapp-instances/connect', {
      method: 'POST',
      body: JSON.stringify({ instanceName, forceRegenerate }),
    });
    
    return response;
  }

  async disconnectInstance(instanceName: string): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>('/api/whatsapp-instances/disconnect', {
      method: 'POST',
      body: JSON.stringify({ instanceName }),
    });
  }

  async deleteInstance(instanceName: string): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>("/api/whatsapp-instances/delete", {
      method: "DELETE",
      body: JSON.stringify({ instanceName }),
    });
  }

  async createInstance(instanceData: CreateInstanceData): Promise<ApiResponse> {
    // Determinar o endpoint baseado no provider_type
    const endpoint = instanceData.provider_type === 'externo' 
      ? "/api/whatsapp-instances/external/create"
      : "/api/whatsapp-instances/internal/create";
    
    return this.makeRequest<ApiResponse>(endpoint, {
      method: "POST",
      body: JSON.stringify(instanceData),
    });
  }

  async updateInstance(id: string, updateData: Partial<Instance>): Promise<ApiResponse> {
    // Se provider_type não está no updateData, buscar da instância
    let providerType = updateData.provider_type;
    
    if (!providerType) {
      // Buscar o provider_type da instância
      const response = await fetch(`/api/whatsapp-instances/list`);
      const data = await response.json();
      const instance = data.instances?.find((inst: Instance) => inst.id === id);
      providerType = instance?.provider_type;
    }
    
    // Determinar o endpoint baseado no tipo da instância
    const endpoint = providerType === 'externo' 
      ? "/api/whatsapp-instances/external/update"
      : "/api/whatsapp-instances/internal/update";
    
    return this.makeRequest<ApiResponse>(endpoint, {
      method: "PUT",
      body: JSON.stringify({ id, ...updateData }),
    });
  }
}

export const instanceService = new InstanceService(); 