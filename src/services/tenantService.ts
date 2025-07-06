import { authenticatedFetch } from '@/lib/utils';

export type CompanyType = 'FISICA' | 'JURIDICA';

export interface Tenant {
  id: string;
  type: CompanyType;
  name: string;
  cpf_cnpj?: string;
  phone?: string;
  email: string;
  status: string;
  user_id?: string;
  created_at?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_zip_code?: string;
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
  type?: CompanyType;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_zip_code?: string;
}

export interface UpdateTenantData {
  id: string;
  name: string;
  email: string;
  cpf_cnpj: string;
  phone: string;
  type?: CompanyType;
  status?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_zip_code?: string;
}

class TenantService {
  async listTenants(): Promise<TenantListResponse> {
    const response = await authenticatedFetch("/api/tenants/list");
    
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
    const response = await authenticatedFetch("/api/tenants/create", {
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
    const response = await authenticatedFetch("/api/tenants/update", {
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
    return authenticatedFetch(`/api/tenants/delete?id=${id}`, {
      method: "DELETE",
    });
  }
}

export const tenantService = new TenantService(); 