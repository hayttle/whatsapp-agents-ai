"use client";
import { useEffect, useState } from 'react';
import { authenticatedFetch } from '@/lib/utils';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'super_admin';
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface UseUserRoleReturn {
  userRole: string | null;
  isSuperAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  user: UserData | null;
  refetch: () => Promise<void>;
}

export function useUserRole(): UseUserRoleReturn {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await authenticatedFetch('/api/users/current');
      const role = data.user?.role || 'user';
      
      setUserRole(role);
      setUser(data.user);
    } catch (error) {
      console.error('[useUserRole] Erro ao buscar dados do usuário:', error);
      setError('Erro ao buscar dados do usuário');
      setUserRole(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const isSuperAdmin = userRole === 'super_admin';

  return {
    userRole,
    isSuperAdmin,
    isLoading,
    error,
    user,
    refetch: fetchUserData
  };
} 