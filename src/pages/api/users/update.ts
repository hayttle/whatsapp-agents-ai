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
    
    // Apenas super_admin pode atualizar usuários
    if (userData.role !== 'super_admin') {
      return res.status(403).json({ error: 'Insufficient permissions - Only super_admin can update users' });
    }

    const supabase = createApiClient(req, res);

    const { id, email, name, role, tenant_id } = req.body;

    if (!id || !email || !name || !role) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    }
    if (role !== 'super_admin' && !tenant_id) {
      return res.status(400).json({ error: 'Usuários que não são super_admin devem ter uma empresa associada.' });
    }

    // Verificar se o usuário existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', id)
      .single();

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verificar permissões para mudança de role
    if (role === 'super_admin' && userData.role !== 'super_admin') {
      return res.status(403).json({ error: 'Insufficient permissions to assign super_admin role' });
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (tenant_id !== undefined) updateData.tenant_id = role === 'super_admin' ? null : tenant_id;

    // Atualizar usuário
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ error: 'Error updating user: ' + error.message });
    }

    return res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 