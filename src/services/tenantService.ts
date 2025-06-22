export interface Tenant {
  id: string;
  nome: string;
  email: string;
  cpf_cnpj: string;
  telefone: string;
  created_at?: string;
  updated_at?: string;
}

export interface TenantListResponse {
  tenants: Tenant[];
}

class TenantService {
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

  async listTenants(): Promise<TenantListResponse> {
    return this.makeRequest<TenantListResponse>("/api/tenants/list");
  }
}

export const tenantService = new TenantService(); 