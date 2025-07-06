"use client";

import { useState, useEffect } from 'react';

export interface SubscriptionData {
  id: string;
  plan: string;
  planType: 'starter' | 'pro';
  quantity: number;
  allowedInstances: number;
  status: string;
  value: number;
  price: number;
  cycle: string;
  startedAt: string;
  nextDueDate: string;
  expiresAt: string;
  paidAt?: string;
  paymentMethod?: string;
  invoiceUrl?: string;
  isActive: boolean;
  isTrial: boolean;
  isSuspended: boolean;
}

interface UseSubscriptionReturn {
  subscription: SubscriptionData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/subscriptions/current', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSubscription(data.subscription);
      } else {
        throw new Error(data.error || 'Erro ao buscar assinatura');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar assinatura';
      setError(errorMessage);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  return {
    subscription,
    loading,
    error,
    refetch: fetchSubscription
  };
} 