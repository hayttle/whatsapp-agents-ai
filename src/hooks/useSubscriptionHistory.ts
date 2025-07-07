"use client";

import { useState, useEffect } from 'react';

export interface SubscriptionPayment {
  id: string;
  asaasPaymentId: string;
  amount: number;
  status: string;
  paidAt: string | null;
  paymentMethod: string | null;
  invoiceUrl: string | null;
  createdAt: string;
  dueDate?: string | null;
}

export interface SubscriptionHistoryItem {
  id: string;
  asaasSubscriptionId: string | null;
  plan: string;
  planType: string;
  quantity: number;
  allowedInstances: number;
  status: string;
  value: number;
  price: number;
  cycle: string;
  startedAt: string;
  nextDueDate: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  paymentMethod: string | null;
  invoiceUrl: string | null;
  isActive: boolean;
  isTrial: boolean;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
  payments: SubscriptionPayment[];
  paymentsCount: number;
}

interface UseSubscriptionHistoryReturn {
  subscriptions: SubscriptionHistoryItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSubscriptionHistory(): UseSubscriptionHistoryReturn {
  const [subscriptions, setSubscriptions] = useState<SubscriptionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/subscriptions/history', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSubscriptions(data.subscriptions);
      } else {
        throw new Error(data.error || 'Erro ao buscar histórico');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar histórico';
      setError(errorMessage);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return {
    subscriptions,
    loading,
    error,
    refetch: fetchHistory
  };
} 