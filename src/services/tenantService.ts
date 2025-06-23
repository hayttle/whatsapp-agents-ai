export interface Tenant {
  id: string;
  type: string;
  name: string;
  cpf_cnpj?: string;
  phone?: string;
  email: string;
  status: string;
  user_id?: string;
  created_at?: string;
}

export interface TenantListResponse {
  tenants: Tenant[];
}

export interface TenantResponse {
  tenant: Tenant;
}

export interface ApiResponse {
  success?: boolean;
  error?: string;
  message?: string;
}

export interface CreateTenantData {
  name: string;
  email: string;
  cpf_cnpj: string;
  phone: string;
  type?: string;
}

export interface UpdateTenantData {
  id: string;
  name: string;
  email: string;
  cpf_cnpj: string;
  phone: string;
  type?: string;
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
    const response = await this.makeRequest<{ tenants: unknown[] }>("/api/tenants/list");
    
    // Mapear os dados da API para o formato esperado pelo frontend
    const tenants = (response.tenants as Tenant[]) || [];
    const mappedTenants = tenants.map(tenant => ({
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      cpf_cnpj: tenant.cpf_cnpj,
      phone: tenant.phone,
      type: tenant.type,
      status: tenant.status,
      user_id: tenant.user_id,
      created_at: tenant.created_at
    }));
    
    return { tenants: mappedTenants };
  }

  async createTenant(tenantData: CreateTenantData): Promise<TenantResponse> {
    const response = await this.makeRequest<{ tenant: unknown }>("/api/tenants/create", {
      method: "POST",
      body: JSON.stringify(tenantData),
    });
    
    // Mapear a resposta da API
    const tenant = response.tenant as Tenant;
    const mappedTenant = {
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      cpf_cnpj: tenant.cpf_cnpj,
      phone: tenant.phone,
      type: tenant.type,
      status: tenant.status,
      user_id: tenant.user_id,
      created_at: tenant.created_at
    };
    
    return { tenant: mappedTenant };
  }

  async updateTenant(tenantData: UpdateTenantData): Promise<TenantResponse> {
    const response = await this.makeRequest<{ tenant: unknown }>("/api/tenants/update", {
      method: "PUT",
      body: JSON.stringify(tenantData),
    });
    
    // Mapear a resposta da API
    const tenant = response.tenant as Tenant;
    const mappedTenant = {
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      cpf_cnpj: tenant.cpf_cnpj,
      phone: tenant.phone,
      type: tenant.type,
      status: tenant.status,
      user_id: tenant.user_id,
      created_at: tenant.created_at
    };
    
    return { tenant: mappedTenant };
  }

  async deleteTenant(id: string): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/api/tenants/delete?id=${id}`, {
      method: "DELETE",
    });
  }
}

export const tenantService = new TenantService(); 