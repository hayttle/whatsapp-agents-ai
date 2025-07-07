import { authenticatedFetch } from '@/lib/utils';

export interface Subscription {
  id: string;
  tenant_id: string;
  user_id: string;
  asaas_subscription_id: string;
  plan_name: string;
  plan_type: 'starter' | 'pro' | 'custom';
  quantity: number;
  allowed_instances: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'OVERDUE' | 'PENDING';
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
}

export const subscriptionService = new SubscriptionService(); 