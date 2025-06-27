import { useEffect, useState, useCallback } from 'react';
import { User } from '@/services/userService';
import { userService } from '@/services/userService';
import { tenantService, Tenant } from '@/services/tenantService';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [empresas, setEmpresas] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Buscar o usuário logado para saber o role e dados
      const currentUserData = await userService.getCurrentUser();
      setCurrentUserRole(currentUserData.role);
      setCurrentUser(currentUserData.user);

      // Buscar lista de usuários
      const data = await userService.listUsers();
      setUsers(data.users || []);
      
      // Buscar empresas para super admin
      const tenantsData = await tenantService.listTenants();
      setEmpresas((tenantsData.tenants || []).map((t: Tenant) => ({ ...t, name: t.name })));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    empresas,
    loading,
    error,
    currentUserRole,
    currentUser,
    refetch: fetchUsers,
  };
}; 