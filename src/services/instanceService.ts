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
    const response = await this.makeRequest<any>('/api/whatsapp-instances/connect', {
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

  async createInstance(instanceData: any): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>("/api/whatsapp-instances/create", {
      method: "POST",
      body: JSON.stringify(instanceData),
    });
  }

  async updateInstance(instanceName: string, instanceData: any): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>("/api/whatsapp-instances/update", {
      method: "PUT",
      body: JSON.stringify({ instanceName, ...instanceData }),
    });
  }
}

export const instanceService = new InstanceService(); 