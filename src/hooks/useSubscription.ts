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
  isExpired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrialStatus {
  hasActiveTrial: boolean;
  isExpired: boolean;
  daysRemaining: number;
  trial?: {
    id: string;
    tenant_id: string;
    started_at: string;
    expires_at: string;
    status: 'ACTIVE' | 'EXPIRED';
    created_at: string;
    updated_at: string;
  };
}

export interface SubscriptionResponse {
  subscription: SubscriptionData | null;
  trialStatus: TrialStatus | null;
  hasAccess: boolean;
}

interface UseSubscriptionReturn {
  subscription: SubscriptionData | null;
  trialStatus: TrialStatus | null;
  hasAccess: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
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
        setTrialStatus(data.trialStatus);
        setHasAccess(data.hasAccess);
      } else {
        throw new Error(data.error || 'Erro ao buscar assinatura');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar assinatura';
      setError(errorMessage);
      setSubscription(null);
      setTrialStatus(null);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  return {
    subscription,
    trialStatus,
    hasAccess,
    loading,
    error,
    refetch: fetchSubscription
  };
} 