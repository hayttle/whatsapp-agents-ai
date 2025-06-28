export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'user';
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
  whatsapp?: string;
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

  async listUsers(): Promise<UserListResponse> {
    return this.makeRequest<UserListResponse>("/api/users/list");
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