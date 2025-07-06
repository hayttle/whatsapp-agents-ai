export async function asaasRequest<T>(endpoint: string, options: RequestInit = {}) {
  const ASAAS_API_URL = process.env.ASAAS_API_URL;
  const ASAAS_API_TOKEN = process.env.ASAAS_API_TOKEN;

  if (!ASAAS_API_TOKEN) {
    throw new Error('ASAAS_API_TOKEN não definido no .env.local');
  }

  // Corrigir URL duplicada - remover /v3 do endpoint se a URL base já contiver
  let fullUrl = ASAAS_API_URL;
  if (endpoint.startsWith('/v3/')) {
    // Se a URL base já termina com /v3, remover do endpoint
    if (ASAAS_API_URL?.endsWith('/v3')) {
      fullUrl = ASAAS_API_URL + endpoint.substring(3); // Remove /v3 do início
    } else {
      fullUrl = ASAAS_API_URL + endpoint;
    }
  } else {
    fullUrl = ASAAS_API_URL + endpoint;
  }

  console.log('[AsaasService] Fazendo requisição para:', fullUrl);
  console.log('[AsaasService] Método:', options.method || 'GET');
  console.log('[AsaasService] Headers:', {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'access_token': '***HIDDEN***',
    ...(options.headers || {})
  });

  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'access_token': ASAAS_API_TOKEN,
      ...(options.headers || {})
    },
  });

  console.log('[AsaasService] Status da resposta:', res.status);
  console.log('[AsaasService] Headers da resposta:', Object.fromEntries(res.headers.entries()));

  const responseText = await res.text();
  console.log('[AsaasService] Corpo da resposta (primeiros 500 chars):', responseText.substring(0, 500));

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (parseError) {
    console.error('[AsaasService] Erro ao fazer parse JSON da resposta:', parseError);
    console.error('[AsaasService] Resposta completa:', responseText);
    throw new Error(`Resposta inválida do Asaas: ${responseText.substring(0, 200)}`);
  }

  if (!res.ok) {
    console.error('[AsaasService] Erro na resposta:', data);
    throw new Error(data.errors?.[0]?.description || data.message || 'Erro na API Asaas');
  }
  return data as T;
}

// Tipos para assinatura do Asaas
export interface AsaasSubscriptionRequest {
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  customer: string; // customer_id
  value: number;
  nextDueDate: string; // YYYY-MM-DD
  description: string;
}

export interface AsaasSubscriptionResponse {
  object: string;
  id: string;
  dateCreated: string;
  customer: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  description: string;
  billingType: string;
  status: string;
  fine: {
    value: number;
  };
  interest: {
    value: number;
  };
  discount: {
    value: number;
    dueDateLimitDays: number;
  };
  endDate: string;
  maxPayments: number;
  invoiceUrl: string;
  bankSlipUrl: string;
  transactionReceiptUrl: string;
  installment: string;
  installmentNumber: number;
  installmentCount: number;
}

// Função para criar assinatura no Asaas
export async function createAsaasSubscription(subscriptionData: AsaasSubscriptionRequest): Promise<AsaasSubscriptionResponse> {
  return asaasRequest<AsaasSubscriptionResponse>('/v3/subscriptions', {
    method: 'POST',
    body: JSON.stringify(subscriptionData),
  });
}

// Função para buscar assinatura no Asaas
export async function getAsaasSubscription(subscriptionId: string): Promise<AsaasSubscriptionResponse> {
  return asaasRequest<AsaasSubscriptionResponse>(`/v3/subscriptions/${subscriptionId}`);
}

// Função para cancelar assinatura no Asaas
export async function cancelAsaasSubscription(subscriptionId: string): Promise<AsaasSubscriptionResponse> {
  return asaasRequest<AsaasSubscriptionResponse>(`/v3/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
  });
}

// Tipos para cobranças do Asaas
export interface AsaasPaymentResponse {
  object: string;
  id: string;
  dateCreated: string;
  customer: string;
  subscription: string;
  installment: string;
  installmentNumber: number;
  installmentCount: number;
  value: number;
  netValue: number;
  originalValue: number;
  interestValue: number;
  description: string;
  billingType: string;
  status: string;
  dueDate: string;
  originalDueDate: string;
  paymentDate: string;
  clientPaymentDate: string;
  invoiceUrl: string;
  bankSlipUrl: string;
  transactionReceiptUrl: string;
  discount: {
    value: number;
    dueDateLimitDays: number;
  };
  fine: {
    value: number;
  };
  interest: {
    value: number;
  };
  postalService: boolean;
}

export interface AsaasPaymentListResponse {
  object: string;
  data: AsaasPaymentResponse[];
  totalCount: number;
  limit: number;
  offset: number;
}

// Função para listar cobranças de uma assinatura
export async function getAsaasSubscriptionPayments(subscriptionId: string, limit: number = 100, offset: number = 0): Promise<AsaasPaymentListResponse> {
  return asaasRequest<AsaasPaymentListResponse>(`/v3/subscriptions/${subscriptionId}/payments?limit=${limit}&offset=${offset}`);
}

// Função para buscar uma cobrança específica
export async function getAsaasPayment(paymentId: string): Promise<AsaasPaymentResponse> {
  return asaasRequest<AsaasPaymentResponse>(`/v3/payments/${paymentId}`);
}

// Função para listar todas as cobranças de um cliente
export async function getAsaasCustomerPayments(customerId: string, limit: number = 100, offset: number = 0): Promise<AsaasPaymentListResponse> {
  return asaasRequest<AsaasPaymentListResponse>(`/v3/customers/${customerId}/payments?limit=${limit}&offset=${offset}`);
} 