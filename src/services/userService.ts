import { authenticatedFetch } from '@/lib/utils';

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
  async listUsers(): Promise<UserListResponse> {
    return authenticatedFetch("/api/users/list");
  }

  async getCurrentUser(): Promise<CurrentUserResponse> {
    return authenticatedFetch("/api/users/current");
  }

  async createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'> & { password: string }): Promise<ApiResponse> {
    return authenticatedFetch("/api/users/create", {
      method: "POST",
      body: JSON.stringify(user),
    });
  }

  async updateUser(userId: string, user: Partial<User> & { password?: string }): Promise<ApiResponse> {
    return authenticatedFetch("/api/users/update", {
      method: "PUT",
      body: JSON.stringify({ id: userId, ...user }),
    });
  }

  async updateProfile(user: Partial<User>): Promise<ApiResponse> {
    return authenticatedFetch("/api/users/profile", {
      method: "PUT",
      body: JSON.stringify(user),
    });
  }

  async deleteUser(userId: string): Promise<ApiResponse> {
    return authenticatedFetch("/api/users/delete", {
      method: "DELETE",
      body: JSON.stringify({ id: userId }),
    });
  }
}

export const userService = new UserService(); 