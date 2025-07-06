"use client";

import { useState, useEffect, useCallback } from 'react';

export interface UsageStats {
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  currentPlan: string;
  planQuantity: number;
  allowedInstances: number;
  currentInstances: number;
  remainingInstances: number;
  subscriptionStatus: string;
  nextDueDate: string;
  monthlyPrice: number;
  usagePercentage: number;
  isOverLimit: boolean;
}

export interface UseUsageReturn {
  stats: UsageStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useUsage(tenantId?: string): UseUsageReturn {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsageStats = useCallback(async () => {
    if (!tenantId) {
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Endpoint removido - definir stats como null
      setStats(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar estatísticas de uso';
      setError(errorMessage);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchUsageStats();
  }, [fetchUsageStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchUsageStats,
  };
} 