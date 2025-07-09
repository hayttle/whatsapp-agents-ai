"use client";

import { useState, useEffect } from 'react';
import { UsageStats, TotalLimits } from '@/lib/plans';

interface UsageData {
  usage: UsageStats;
  totalLimits: TotalLimits;
  usagePercentage: Record<string, number>;
}

interface UseUsageProps {
  tenantId?: string;
  isSuperAdmin?: boolean;
}

export function useUsage({ tenantId, isSuperAdmin = false }: UseUsageProps = {}) {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    if (!tenantId && !isSuperAdmin) return;

    setLoading(true);
    setError(null);

    try {
      const url = isSuperAdmin && tenantId 
        ? `/api/usage/stats?tenantId=${tenantId}`
        : '/api/usage/stats';

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar estatísticas de uso');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao buscar estatísticas de uso:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [tenantId, isSuperAdmin]);

  const refetch = () => {
    fetchUsage();
  };

  return {
    data,
    loading,
    error,
    refetch,
  };
} 