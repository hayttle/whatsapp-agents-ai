"use client";
import { useEffect, useState } from 'react';

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
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  userData: UserData | null;
  refetch: () => Promise<void>;
}

export function useUserRole(): UseUserRoleReturn {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/users/current');
      
      if (response.ok) {
        const data = await response.json();
        const role = data.user?.role || 'user';
        
        setUserRole(role);
        setUserData(data.user);
      } else {
        console.error('[useUserRole] Erro ao buscar dados do usuário:', response.status);
        setError('Erro ao buscar dados do usuário');
        setUserRole(null);
        setUserData(null);
      }
    } catch (error) {
      console.error('[useUserRole] Erro na requisição:', error);
      setError('Erro na requisição');
      setUserRole(null);
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'super_admin';

  return {
    userRole,
    isSuperAdmin,
    isAdmin,
    isLoading,
    error,
    userData,
    refetch: fetchUserData
  };
} 