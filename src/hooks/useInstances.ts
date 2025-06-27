import { useCallback, useEffect, useState } from 'react';
import { Instance } from '@/components/admin/instances/types';
import { instanceService } from '@/services/instanceService';
import { tenantService } from '@/services/tenantService';

interface InstanceFormData {
  instanceName: string;
  nome: string;
  descricao?: string;
  webhook_url?: string;
  behavior_settings?: Record<string, unknown>;
  tenant_id: string;
}

interface UseInstancesProps {
  isSuperAdmin: boolean;
  tenantId?: string;
  refreshKey?: number;
}

export const useInstances = ({ isSuperAdmin, tenantId, refreshKey }: UseInstancesProps) => {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [empresas, setEmpresas] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstances = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await instanceService.listInstances(isSuperAdmin ? undefined : tenantId);
      const updatedInstances = data.instances || [];

      // Para cada instância, consultar status real na Evolution e atualizar localmente
      await Promise.all(updatedInstances.map(async (inst) => {
        try {
          const res = await fetch(`/api/whatsapp-instances/status?instanceName=${encodeURIComponent(inst.instanceName)}`);
          const statusData = await res.json();
          if (res.ok && statusData.status && statusData.status !== inst.status) {
            inst.status = statusData.status;
          }
        } catch {}
      }));
      setInstances(updatedInstances);
      
      if (isSuperAdmin && updatedInstances) {
        const tenantsData = await tenantService.listTenants();
        const tenantsMap: Record<string, string> = {};
        tenantsData.tenants?.forEach(tenant => {
          tenantsMap[tenant.id] = tenant.name;
        });
        setEmpresas(tenantsMap);
      }
      
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, tenantId]);

  // Efeito para buscar dados iniciais e ao mudar refreshKey
  useEffect(() => {
    fetchInstances();
  }, [fetchInstances, refreshKey]);

  const createInstance = useCallback(async (instanceData: InstanceFormData) => {
    try {
      await instanceService.createInstance(instanceData);
      await fetchInstances();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      throw new Error(errorMessage);
    }
  }, [fetchInstances]);

  const deleteInstance = useCallback(async (instanceName: string) => {
    try {
      await instanceService.deleteInstance(instanceName);
      await fetchInstances();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      throw new Error(errorMessage);
    }
  }, [fetchInstances]);

  const connectInstance = useCallback(async (instanceName: string, forceRegenerate?: boolean) => {
    try {
      const result = await instanceService.connectInstance(instanceName, forceRegenerate);
      await fetchInstances();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      throw new Error(errorMessage);
    }
  }, [fetchInstances]);

  const disconnectInstance = useCallback(async (instanceName: string) => {
    try {
      await instanceService.disconnectInstance(instanceName);
      await fetchInstances();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      throw new Error(errorMessage);
    }
  }, [fetchInstances]);

  return {
    instances,
    empresas,
    loading,
    error,
    refetch: fetchInstances,
    createInstance,
    deleteInstance,
    connectInstance,
    disconnectInstance,
  };
}; 