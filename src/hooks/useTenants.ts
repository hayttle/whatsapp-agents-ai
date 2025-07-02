import { useCallback, useEffect, useState } from 'react';
import { tenantService, Tenant } from '@/services/tenantService';

export function useTenants(enabled: boolean = true) {
  const [data, setData] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await tenantService.listTenants();
      setData(response.tenants || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar empresas';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      fetchTenants();
    } else {
      setData([]);
      setLoading(false);
    }
  }, [fetchTenants, enabled]);

  return {
    data,
    loading,
    error,
    refetch: fetchTenants,
  };
} 