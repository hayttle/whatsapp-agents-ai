export interface User {
  id: string;
  email: string;
  nome: string;
  role: 'super_admin' | 'admin' | 'user';
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserListResponse {
  users: User[];
}

export interface CurrentUserResponse {
  user: User;
  role: string;
}

export interface ApiResponse {
  success?: boolean;
  error?: string;
}

class UserService {
  private async getAuthToken(): Promise<string | null> {
    if (typeof window !== 'undefined') {
      // Try to get token from Supabase session
      const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
      const supabase = createClientComponentClient();
      
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    }
    return null;
  }

  private async makeRequest<T>(url: string, options?: RequestInit): Promise<T> {
    const token = await this.getAuthToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      headers,
      ...options,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `Erro na requisição: ${response.status}`);
    }

    return data;
  }

  async listUsers(tenantId?: string): Promise<UserListResponse> {
    let url = "/api/users/list";
    if (tenantId) {
      url += `?tenantId=${tenantId}`;
    }
    
    return this.makeRequest<UserListResponse>(url);
  }

  async getCurrentUser(): Promise<CurrentUserResponse> {
    return this.makeRequest<CurrentUserResponse>("/api/users/current");
  }

  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'> & { password: string }): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>("/api/users/create", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: string, userData: Partial<User> & { password?: string }): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>("/api/users/update", {
      method: "PUT",
      body: JSON.stringify({ id: userId, ...userData }),
    });
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>("/api/users/profile", {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>("/api/users/delete", {
      method: "DELETE",
      body: JSON.stringify({ id: userId }),
    });
  }
}

export const userService = new UserService(); 