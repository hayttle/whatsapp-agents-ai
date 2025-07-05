import type { NextApiRequest, NextApiResponse } from 'next';
import { asaasRequest } from '@/services/asaasService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { customer, billingType, value, cycle, description, nextDueDate } = req.body;
  if (!customer || !billingType || !value || !cycle || !description || !nextDueDate) {
    return res.status(400).json({ error: 'Campos obrigatórios: customer, billingType, value, cycle, description, nextDueDate' });
  }
  try {
    const data = await asaasRequest('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        customer,
        billingType, // 'CREDIT_CARD', 'BOLETO', 'PIX'
        value,
        cycle, // 'MONTHLY', 'YEARLY', etc.
        description,
        nextDueDate, // 'YYYY-MM-DD'
      })
    });
    return res.status(200).json({ success: true, subscription: data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erro ao criar assinatura no Asaas' });
  }
} 