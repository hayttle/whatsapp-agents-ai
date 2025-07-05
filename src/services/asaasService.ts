export async function asaasRequest<T>(endpoint: string, options: RequestInit = {}) {
  const ASAAS_API_URL = process.env.ASAAS_API_URL;
  const ASAAS_API_TOKEN = process.env.ASAAS_API_TOKEN;

  if (!ASAAS_API_TOKEN) {
    throw new Error('ASAAS_API_TOKEN não definido no .env');
  }

  const res = await fetch(`${ASAAS_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${ASAAS_API_TOKEN}`,
      ...(options.headers || {})
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.errors?.[0]?.description || data.message || 'Erro na API Asaas');
  }
  return data as T;
} 