import { createClient } from '@/lib/supabase/client';

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

export interface TenantUsageStats {
  tenant_id: string;
  tenant_name: string;
  tenant_email: string;
  current_plan: string;
  plan_quantity: number;
  allowed_instances: number;
  current_instances: number;
  remaining_instances: number;
  subscription_status: string;
  next_due_date: string;
  monthly_price: number;
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

export interface TenantUsageStatsResponse {
  stats: TenantUsageStats;
}

export interface CheckoutResponse {
  checkoutUrl: string;
  subscription: Subscription;
}

export interface WebhookEvent {
  event: string;
  payment?: {
    id: string;
    subscription: string;
    status: string;
    value: number;
    billingType: string;
    invoiceUrl?: string;
    dueDate: string;
    paymentDate?: string;
  };
  subscription?: {
    id: string;
    status: string;
    value: number;
    cycle: string;
    nextDueDate: string;
  };
}

class SubscriptionService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async createSubscription(data: CreateSubscriptionData): Promise<CheckoutResponse> {
    return this.makeRequest<CheckoutResponse>('/api/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMySubscription(): Promise<SubscriptionResponse> {
    // Obter token de autenticação do Supabase
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    return this.makeRequest<SubscriptionResponse>('/api/subscriptions/my', {
      headers
    });
  }

  async getTenantUsageStats(tenantId: string): Promise<TenantUsageStatsResponse> {
    return this.makeRequest<TenantUsageStatsResponse>(`/api/subscriptions/usage/${tenantId}`);
  }

  async getSubscriptionPayments(subscriptionId: string): Promise<SubscriptionPaymentsResponse> {
    return this.makeRequest<SubscriptionPaymentsResponse>(`/api/subscriptions/${subscriptionId}/payments`);
  }

  async renewSubscription(subscriptionId: string, data: Partial<CreateSubscriptionData>): Promise<SubscriptionResponse> {
    return this.makeRequest<SubscriptionResponse>(`/api/subscriptions/renew`, {
      method: 'POST',
      body: JSON.stringify({ subscriptionId, ...data }),
    });
  }

  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean }> {
    return this.makeRequest<{ success: boolean }>(`/api/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
    });
  }

  async getSubscriptionHistory(): Promise<SubscriptionListResponse> {
    return this.makeRequest<SubscriptionListResponse>('/api/subscriptions/history');
  }
}

export const subscriptionService = new SubscriptionService(); 