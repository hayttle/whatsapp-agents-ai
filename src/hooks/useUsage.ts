"use client";

import { useState, useEffect, useCallback } from 'react';
import { subscriptionService, TenantUsageStats } from '@/services/subscriptionService';

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

  const mapUsageStats = (apiStats: TenantUsageStats): UsageStats => {
    const usagePercentage = apiStats.allowed_instances > 0 
      ? Math.round((apiStats.current_instances / apiStats.allowed_instances) * 100)
      : 0;

    return {
      tenantId: apiStats.tenant_id,
      tenantName: apiStats.tenant_name,
      tenantEmail: apiStats.tenant_email,
      currentPlan: apiStats.current_plan,
      planQuantity: apiStats.plan_quantity,
      allowedInstances: apiStats.allowed_instances,
      currentInstances: apiStats.current_instances,
      remainingInstances: apiStats.remaining_instances,
      subscriptionStatus: apiStats.subscription_status,
      nextDueDate: apiStats.next_due_date,
      monthlyPrice: apiStats.monthly_price,
      usagePercentage,
      isOverLimit: apiStats.current_instances > apiStats.allowed_instances,
    };
  };

  const fetchUsageStats = useCallback(async () => {
    if (!tenantId) {
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await subscriptionService.getTenantUsageStats(tenantId);
      if (response.stats) {
        setStats(mapUsageStats(response.stats));
      } else {
        setStats(null);
      }
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