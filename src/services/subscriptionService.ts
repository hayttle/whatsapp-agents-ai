import { authenticatedFetch } from '@/lib/utils';
import { createClient } from '@supabase/supabase-js';

export interface Subscription {
  id: string;
  tenant_id: string;
  user_id: string;
  asaas_subscription_id: string;
  plan_name: string;
  plan_type: 'starter' | 'pro' | 'custom';
  quantity: number;
  allowed_instances: number;
  status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'OVERDUE';
  value: number;
  price: number;
  cycle: 'MONTHLY' | 'YEARLY' | 'WEEKLY' | 'DAILY';
  started_at: string;
  next_due_date: string;
  paid_at?: string;
  invoice_url?: string;
  payment_method?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPayment {
  id: string;
  subscription_id: string;
  payment_id: string;
  invoice_url?: string;
  payment_method?: string;
  amount: number;
  paid_at?: string;
  status: 'PENDING' | 'CONFIRMED' | 'RECEIVED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS';
  created_at: string;
}

export interface CreateSubscriptionData {
  tenant_id: string;
  user_id: string;
  plan_name: string;
  plan_type: 'starter' | 'pro' | 'custom';
  quantity: number;
  value: number;
  price: number;
  cycle: 'MONTHLY' | 'YEARLY' | 'WEEKLY' | 'DAILY';
  billing_type: 'CREDIT_CARD' | 'BOLETO' | 'PIX';
  description: string;
  next_due_date: string;
}

export interface SubscriptionResponse {
  subscription: Subscription;
}

export interface SubscriptionListResponse {
  subscriptions: Subscription[];
}

export interface SubscriptionPaymentsResponse {
  payments: SubscriptionPayment[];
}

export interface CheckoutResponse {
  checkoutUrl: string;
  subscription: Subscription;
}

export interface CreateTrialSubscriptionData {
  tenant_id: string;
  plan_type?: 'starter' | 'pro' | 'custom';
  plan_name?: string;
  quantity?: number;
}

class SubscriptionService {
  async createSubscription(data: CreateSubscriptionData): Promise<CheckoutResponse> {
    return authenticatedFetch('/api/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    }) as Promise<CheckoutResponse>;
  }

  async getSubscriptionPayments(subscriptionId: string): Promise<SubscriptionPaymentsResponse> {
    return authenticatedFetch(`/api/subscriptions/${subscriptionId}/payments`) as Promise<SubscriptionPaymentsResponse>;
  }

  async renewSubscription(subscriptionId: string, data: Partial<CreateSubscriptionData>): Promise<SubscriptionResponse> {
    return authenticatedFetch(`/api/subscriptions/renew`, {
      method: 'POST',
      body: JSON.stringify({ subscriptionId, ...data }),
    }) as Promise<SubscriptionResponse>;
  }

  async updateQuantity(subscriptionId: string, quantity: number): Promise<SubscriptionResponse> {
    return authenticatedFetch('/api/subscriptions/update-quantity', {
      method: 'POST',
      body: JSON.stringify({ subscriptionId, quantity }),
    }) as Promise<SubscriptionResponse>;
  }

  async getSubscriptionHistory(): Promise<SubscriptionListResponse> {
    return authenticatedFetch('/api/subscriptions/history') as Promise<SubscriptionListResponse>;
  }

  async getCurrentSubscription(): Promise<SubscriptionResponse> {
    return authenticatedFetch('/api/subscriptions/current') as Promise<SubscriptionResponse>;
  }

  async createTrialSubscription({ tenant_id, plan_type = 'starter', plan_name = 'Trial', quantity = 1 }: CreateTrialSubscriptionData) {
    const trialStartDate = new Date();
    const trialExpiresAt = new Date();
    trialExpiresAt.setDate(trialStartDate.getDate() + 7);

    const calculateAllowedInstances = (planType: string, quantity: number) => {
      switch (planType) {
        case 'starter':
          return 2 * quantity;
        case 'pro':
          return 5 * quantity;
        default:
          return 0;
      }
    };

    const trialSubscriptionData = {
      tenant_id,
      asaas_subscription_id: null,
      plan_name,
      plan_type,
      quantity,
      allowed_instances: calculateAllowedInstances(plan_type, quantity),
      status: 'TRIAL',
      value: 0,
      price: 0,
      cycle: 'MONTHLY',
      started_at: trialStartDate.toISOString(),
      expires_at: trialExpiresAt.toISOString().split('T')[0],
      next_due_date: trialExpiresAt.toISOString().split('T')[0],
      paid_at: null,
      invoice_url: null,
      payment_method: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await supabase
      .from('subscriptions')
      .insert(trialSubscriptionData);
    if (error) {
      throw new Error('Erro ao criar assinatura trial: ' + error.message);
    }
    return trialSubscriptionData;
  }
}

export const subscriptionService = new SubscriptionService(); 