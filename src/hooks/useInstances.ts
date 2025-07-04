import { useCallback, useEffect, useState } from 'react';
import { Instance } from '@/components/admin/instances/types';
import { instanceService } from '@/services/instanceService';

interface InstanceFormData {
  instanceName: string;
  nome: string;
  descricao?: string;
  webhook_url?: string;
  behavior_settings?: Record<string, unknown>;
  tenant_id: string;
  provider_type: string; // 'nativo' | 'externo'
}

interface UseInstancesProps {
  isSuperAdmin: boolean;
  tenantId?: string;
  refreshKey?: number;
}

export const useInstances = ({ isSuperAdmin, tenantId, refreshKey }: UseInstancesProps) => {
  const [data, setData] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstances = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await instanceService.listInstances(isSuperAdmin ? undefined : tenantId);
      const updatedInstances = response.instances || [];

      // Para cada instância, consultar status real na Evolution e atualizar localmente
      await Promise.all(updatedInstances.map(async (inst) => {
        try {
          const res = await fetch(`/api/whatsapp-instances/status?instanceName=${encodeURIComponent(inst.instanceName)}`);
          const statusData = await res.json();
          if (res.ok && statusData.status && statusData.status !== inst.status) {
            inst.status = statusData.status;
          }
        } catch (error) {
          // Silenciosamente ignora erros de status
        }
      }));
      
      setData(updatedInstances);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar instâncias';
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
    data,
    loading,
    error,
    refetch: fetchInstances,
    createInstance,
    deleteInstance,
    connectInstance,
    disconnectInstance,
  };
}; 