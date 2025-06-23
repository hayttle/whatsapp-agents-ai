import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser, createApiClient } from '@/lib/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
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

    // Apenas super_admin pode atualizar tenants
    if (userData.role !== 'super_admin') {
      return res.status(403).json({ error: 'Insufficient permissions - Only super_admin can update tenants' });
    }

    const { id, name, email, cpf_cnpj, phone, type } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Verificar se o tenant existe
    const { data: existingTenant, error: fetchError } = await supabase
      .from('tenants')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingTenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Atualizar tenant
    const { data: tenant, error } = await supabase
      .from('tenants')
      .update({
        name,
        email,
        cpf_cnpj,
        phone,
        type,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Error updating tenant: ' + error.message });
    }

    return res.status(200).json({ success: true, tenant });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 