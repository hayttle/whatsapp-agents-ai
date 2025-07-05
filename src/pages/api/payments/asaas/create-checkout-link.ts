import type { NextApiRequest, NextApiResponse } from 'next';
import { asaasRequest } from '@/services/asaasService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { name, email, cpfCnpj, phone, plan } = req.body;
  if (!name || !email || !cpfCnpj || !plan) {
    return res.status(400).json({ error: 'Campos obrigatórios: name, email, cpfCnpj, plan' });
  }
  try {
    // 1. Criar ou buscar cliente
    let customer: any;
    try {
      // Buscar cliente existente pelo CPF/CNPJ
      const search: any = await asaasRequest(`/customers?cpfCnpj=${cpfCnpj}`);
      if (search.data && search.data.length > 0) {
        customer = search.data[0];
      }
    } catch {}
    if (!customer) {
      // Criar cliente se não existir
      customer = await asaasRequest('/customers', {
        method: 'POST',
        body: JSON.stringify({ name, email, cpfCnpj, phone })
      });
    }

    // 2. Criar assinatura (subscription) com checkout
    const subscription: any = await asaasRequest('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        customer: customer.id,
        billingType: plan.billingType, // 'CREDIT_CARD', 'BOLETO', 'PIX'
        value: plan.value,
        cycle: plan.cycle, // 'MONTHLY', 'YEARLY', etc.
        description: plan.description,
        nextDueDate: plan.nextDueDate, // 'YYYY-MM-DD'
        // checkout options:
        remoteIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        callback: plan.callbackUrl || undefined,
      })
    });

    // 3. Retornar link de checkout
    if (subscription.invoiceUrl) {
      return res.status(200).json({ success: true, checkoutUrl: subscription.invoiceUrl });
    } else if (subscription.charge && subscription.charge.invoiceUrl) {
      return res.status(200).json({ success: true, checkoutUrl: subscription.charge.invoiceUrl });
    } else {
      return res.status(200).json({ success: true, subscription });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erro ao criar checkout no Asaas' });
  }
} 