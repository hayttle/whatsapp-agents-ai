import { useEffect, useState } from 'react';
import { Instance } from '@/components/admin/instances/types';
import { instanceService } from '@/services/instanceService';
import { tenantService } from '@/services/tenantService';

interface UseInstancesProps {
  isSuperAdmin: boolean;
  tenantId?: string;
  refreshKey: number;
}

export const useInstances = ({ isSuperAdmin, tenantId, refreshKey }: UseInstancesProps) => {
  const [instancias, setInstancias] = useState<Instance[]>([]);
  const [empresas, setEmpresas] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstancias = async () => {
    if (!loading) setLoading(true);
    setError(null);
    
    try {
      const data = await instanceService.listInstances(isSuperAdmin ? undefined : tenantId);
      setInstancias(data.instances || []);
      
      if (isSuperAdmin && data.instances) {
        const tenantIds = Array.from(new Set(data.instances.map((i: Instance) => i.tenant_id).filter(Boolean)));
        if (tenantIds.length > 0) {
          const dataEmp = await tenantService.listTenants();
          const empresaMap = (dataEmp.tenants || []).reduce((acc: Record<string, string>, t: any) => {
            acc[t.id] = t.nome;
            return acc;
          }, {});
          setEmpresas(empresaMap);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstancias();
  }, [isSuperAdmin, tenantId, refreshKey]);

  useEffect(() => {
    const hasConnecting = instancias.some(inst => inst.status === 'connecting');
    if (hasConnecting) {
      const interval = setInterval(() => fetchInstancias(), 3000);
      return () => clearInterval(interval);
    }
  }, [instancias]);

  return {
    instancias,
    empresas,
    loading,
    error,
    refetch: fetchInstancias,
  };
}; 