import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthResult } from '@/lib/auth/helpers';
import { asaasRequest } from '@/services/asaasService';
import { TrialService } from '@/services/trialService';

async function handler(req: NextApiRequest, res: NextApiResponse, auth: AuthResult) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user, supabase } = auth;

    // Apenas super_admin pode criar tenants
    if (user.role !== 'super_admin') {
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
  
      // Verificar se já existe um customer com este CPF/CNPJ
      let customer: any;
      try {
        const search: any = await asaasRequest(`/customers?cpfCnpj=${cpf_cnpj.replace(/\D/g, '')}`);

        if (search.data && search.data.length > 0) {
          customer = search.data[0];
          asaasStatus = { success: true, customer_id: customer.id, message: 'Cliente já existia no Asaas', error: null };
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
            cpfCnpj: cpf_cnpj.replace(/\D/g, ''),
            mobilePhone: phone ? phone.replace(/\D/g, '') : undefined,
            company: name,
            notificationDisabled: false,
          })
        });
        
        asaasStatus = { success: true, customer_id: customer.id, message: 'Cliente criado no Asaas', error: null };
      }
      asaasCustomerId = customer.id;
    } catch (asaasError: any) {
      
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
      return res.status(500).json({ error: 'Error creating tenant: ' + error.message });
    }

    // 3. Criar trial para o tenant
    let trial = null;
    let trialError = null;
    try {
      const trialService = new TrialService(supabase);
      trial = await trialService.createTrial(tenant.id, 7);
    } catch (err) {
      trialError = err instanceof Error ? err.message : 'Erro desconhecido ao criar trial';
    }

    return res.status(201).json({
      success: true,
      tenant: tenant,
      asaas: asaasStatus,
      trial: trial,
      trialError,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
}

export default withAuth(handler); 