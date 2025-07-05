"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { subscriptionService } from '@/services/subscriptionService';

export interface SubscriptionData {
  id: string;
  plan: string;
  planType: 'starter' | 'pro' | 'custom';
  quantity: number;
  allowedInstances: number;
  status: string;
  value: number;
  price: number;
  cycle: string;
  startedAt: string;
  nextDueDate: string;
  paidAt?: string;
  paymentMethod?: string;
  invoiceUrl?: string;
  isActive: boolean;
  isTrial: boolean;
  isSuspended: boolean;
}

export interface UseSubscriptionReturn {
  subscription: SubscriptionData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createSubscription: (data: any) => Promise<{ checkoutUrl: string } | null>;
  renewSubscription: (subscriptionId: string, data: any) => Promise<SubscriptionData | null>;
  cancelSubscription: (subscriptionId: string) => Promise<boolean>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapSubscriptionData = (apiSubscription: any): SubscriptionData => ({
    id: apiSubscription.id,
    plan: apiSubscription.plan_name,
    planType: apiSubscription.plan_type || 'custom',
    quantity: apiSubscription.quantity || 1,
    allowedInstances: apiSubscription.allowed_instances || 0,
    status: apiSubscription.status,
    value: apiSubscription.value,
    price: apiSubscription.price || apiSubscription.value,
    cycle: apiSubscription.cycle,
    startedAt: apiSubscription.started_at,
    nextDueDate: apiSubscription.next_due_date,
    paidAt: apiSubscription.paid_at,
    paymentMethod: apiSubscription.payment_method,
    invoiceUrl: apiSubscription.invoice_url,
    isActive: ['TRIAL', 'ACTIVE'].includes(apiSubscription.status),
    isTrial: apiSubscription.status === 'TRIAL',
    isSuspended: apiSubscription.status === 'SUSPENDED',
  });

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await subscriptionService.getMySubscription();
      if (response.subscription) {
        setSubscription(mapSubscriptionData(response.subscription));
      } else {
        setSubscription(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar assinatura';
      setError(errorMessage);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (data: any): Promise<{ checkoutUrl: string } | null> => {
    try {
      setError(null);
      const response = await subscriptionService.createSubscription(data);
      return { checkoutUrl: response.checkoutUrl };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar assinatura';
      setError(errorMessage);
      return null;
    }
  };

  const renewSubscription = async (subscriptionId: string, data: any): Promise<SubscriptionData | null> => {
    try {
      setError(null);
      const response = await subscriptionService.renewSubscription(subscriptionId, data);
      const mappedSubscription = mapSubscriptionData(response.subscription);
      setSubscription(mappedSubscription);
      return mappedSubscription;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao renovar assinatura';
      setError(errorMessage);
      return null;
    }
  };

  const cancelSubscription = async (subscriptionId: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await subscriptionService.cancelSubscription(subscriptionId);
      if (response.success) {
        await fetchSubscription(); // Recarregar dados
      }
      return response.success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao cancelar assinatura';
      setError(errorMessage);
      return false;
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  return {
    subscription,
    loading,
    error,
    refresh: fetchSubscription,
    createSubscription,
    renewSubscription,
    cancelSubscription,
  };
} 