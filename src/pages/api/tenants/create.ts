import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser, createApiClient } from '@/lib/supabase/api';
import { asaasRequest } from '@/services/asaasService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Autenticar usuário via cookies
    const auth = await authenticateUser(req, res);
    
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
    }

    const { userData } = auth;
    const supabase = createApiClient(req, res);

    // Apenas super_admin pode criar tenants
    if (userData.role !== 'super_admin') {
      return res.status(403).json({ error: 'Insufficient permissions - Only super_admin can create tenants' });
    }

    const { name, email, cpf_cnpj, phone, type } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // 1. Criar customer no Asaas
    let asaasCustomerId: string | null = null;
    let asaasStatus = { success: false, customer_id: null as string | null, message: '', error: null as string | null };
    try {
      console.log('[Asaas] Iniciando busca/criação de customer...');
      // Verificar se já existe um customer com este CPF/CNPJ
      let customer: any;
      try {
        const search: any = await asaasRequest(`/customers?cpfCnpj=${cpf_cnpj.replace(/\D/g, '')}`);
        console.log('[Asaas] Resultado busca customer:', search);
        if (search.data && search.data.length > 0) {
          customer = search.data[0];
          asaasStatus = { success: true, customer_id: customer.id, message: 'Cliente já existia no Asaas', error: null };
        }
      } catch (searchError) {
        console.log('[Asaas] Erro ao buscar customer existente:', searchError);
      }
      // Se não existe, criar novo customer
      if (!customer) {
        customer = await asaasRequest('/customers', {
          method: 'POST',
          body: JSON.stringify({
            name,
            email,
            cpfCnpj: cpf_cnpj.replace(/\D/g, ''),
            mobilePhone: phone ? phone.replace(/\D/g, '') : undefined,
            company: name,
            notificationDisabled: false,
          })
        });
        console.log('[Asaas] Customer criado:', customer);
        asaasStatus = { success: true, customer_id: customer.id, message: 'Cliente criado no Asaas', error: null };
      }
      asaasCustomerId = customer.id;
    } catch (asaasError: any) {
      console.log('[Asaas] Erro ao criar/buscar customer:', asaasError);
      asaasStatus = { success: false, customer_id: null, message: '', error: asaasError?.message || 'Erro desconhecido ao criar/buscar customer no Asaas' };
      // Não falhar o cadastro se não conseguir criar no Asaas
    }

    // 2. Criar tenant
    const { data: tenant, error } = await supabase
      .from('tenants')
      .insert({
        name,
        email,
        cpf_cnpj,
        phone,
        type,
        status: 'ATIVO',
        asaas_customer_id: asaasCustomerId || null,
      })
      .select()
      .single();

    if (error) {
      console.log('[Tenant] Erro ao criar tenant:', error);
      return res.status(500).json({ error: 'Error creating tenant: ' + error.message });
    }

    console.log('[Tenant] Tenant criado:', tenant);
    console.log('[Tenant] Status Asaas:', asaasStatus);
    return res.status(201).json({ success: true, tenant: tenant, asaas: asaasStatus });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.log('[Tenant] Erro inesperado:', errorMessage);
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 