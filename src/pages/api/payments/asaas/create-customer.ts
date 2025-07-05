import type { NextApiRequest, NextApiResponse } from 'next';
import { asaasRequest } from '@/services/asaasService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { name, email, cpfCnpj, phone } = req.body;
  if (!name || !email || !cpfCnpj) {
    return res.status(400).json({ error: 'name, email e cpfCnpj são obrigatórios' });
  }
  try {
    const data = await asaasRequest('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        cpfCnpj,
        phone: phone || undefined,
        notificationDisabled: false,
      })
    });
    return res.status(200).json({ success: true, customer: data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erro ao criar cliente no Asaas' });
  }
} 