import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser, createApiClient } from '@/lib/supabase/api';

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

    // Criar tenant
    const { data: tenant, error } = await supabase
      .from('tenants')
      .insert({
        name,
        email,
        cpf_cnpj,
        phone,
        type,
        status: 'ATIVO',
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Error creating tenant: ' + error.message });
    }

    return res.status(201).json({ success: true, tenant: tenant });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 