import { useEffect, useState } from 'react';
import { User } from '@/services/userService';
import { userService } from '@/services/userService';
import { tenantService } from '@/services/tenantService';

interface UseUsersProps {
  isSuperAdmin: boolean;
  tenantId?: string;
  refreshKey?: number;
}

export const useUsers = ({ isSuperAdmin, tenantId, refreshKey }: UseUsersProps) => {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [empresas, setEmpresas] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const fetchUsuarios = async () => {
    if (!loading) setLoading(true);
    setError(null);
    
    try {
      // Buscar o usuário logado para saber o role e dados
      const currentUserData = await userService.getCurrentUser();
      setCurrentUserRole(currentUserData.role);
      setCurrentUser(currentUserData.user);

      // Buscar lista de usuários
      const data = await userService.listUsers(isSuperAdmin ? undefined : tenantId);
      setUsuarios(data.users || []);
      
      // Buscar nomes das empresas
      const tenantIds = Array.from(new Set((data.users || []).map((u: User) => u.tenant_id).filter(Boolean)));
      if (tenantIds.length > 0) {
        const dataEmp = await tenantService.listTenants();
        const empresaMap: Record<string, string> = {};
        (dataEmp.tenants || []).forEach((t: any) => { empresaMap[t.id] = t.nome; });
        setEmpresas(empresaMap);
      } else {
        setEmpresas({});
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, [isSuperAdmin, tenantId, refreshKey]);

  return {
    usuarios,
    empresas,
    loading,
    error,
    currentUserRole,
    currentUser,
    refetch: fetchUsuarios,
  };
}; 