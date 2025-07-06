import type { NextApiRequest, NextApiResponse } from 'next';
import { asaasRequest } from '@/services/asaasService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, cpf_cnpj, phone, company } = req.body;

  // Validações
  if (!name || !email || !cpf_cnpj) {
    return res.status(400).json({ 
      error: 'Campos obrigatórios: name, email, cpf_cnpj' 
    });
  }

  try {
    // Verificar se já existe um customer com este CPF/CNPJ
    let customer: any;
    try {
      const search: any = await asaasRequest(`/customers?cpfCnpj=${cpf_cnpj}`);
      if (search.data && search.data.length > 0) {
        customer = search.data[0];

      }
    } catch (searchError) {
      
    }

    // Se não existe, criar novo customer
    if (!customer) {
      customer = await asaasRequest('/customers', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          cpfCnpj: cpf_cnpj,
          mobilePhone: phone || undefined,
          company: company || undefined,
          notificationDisabled: false,
        })
      });
      
    }

    return res.status(200).json({ 
      success: true, 
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        cpfCnpj: customer.cpfCnpj,
        phone: customer.phone,
        mobilePhone: customer.mobilePhone,
        company: customer.company
      }
    });

  } catch (error: any) {
    console.error('Erro ao criar/buscar customer no Asaas:', error);
    return res.status(500).json({ 
      error: error.message || 'Erro ao processar customer no Asaas' 
    });
  }
} 