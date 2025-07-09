"use client";

import { useState, useEffect } from 'react';

interface Subscription {
  id: string;
  asaasSubscriptionId: string;
  plan: string;
  planType: string;
  quantity: number;
  status: string;
  value: number;
  price: number;
  cycle: string;
  startedAt: string;
  nextDueDate: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface UseSubscriptionsProps {
  status?: 'ALL' | 'ACTIVE' | 'PENDING' | 'INACTIVE' | 'CANCELED';
}

export function useSubscriptions({ status = 'ALL' }: UseSubscriptionsProps = {}) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = status === 'ALL' 
        ? '/api/subscriptions/list'
        : `/api/subscriptions/list?status=${status}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar assinaturas');
      }

      const result = await response.json();
      setSubscriptions(result.subscriptions || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao buscar assinaturas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [status]);

  const refetch = () => {
    fetchSubscriptions();
  };

  return {
    subscriptions,
    loading,
    error,
    refetch,
  };
} 