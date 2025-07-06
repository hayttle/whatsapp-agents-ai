import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthResult } from '@/lib/auth/helpers';

async function handler(req: NextApiRequest, res: NextApiResponse, auth: AuthResult) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user, supabase } = auth;

    // Apenas super_admin pode atualizar tenants
    if (user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Insufficient permissions - Only super_admin can update tenants' });
    }

    const { id, name, email, cpf_cnpj, phone, type, status } = req.body;

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
        ...(status !== undefined ? { status } : {}),
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

export default withAuth(handler); 