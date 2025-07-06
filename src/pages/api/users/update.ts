import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthResult } from '@/lib/auth/helpers';

async function handler(req: NextApiRequest, res: NextApiResponse, auth: AuthResult) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user, supabase } = auth;
    
    // Apenas super_admin pode atualizar usuários
    if (user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Insufficient permissions - Only super_admin can update users' });
    }

    const { id, email, name, role, tenant_id, status } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }

    // Verificar se o usuário existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {};
    
    // Atualizar apenas os campos fornecidos
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) {
      // Validações específicas para mudança de role
      if (role !== 'super_admin' && !tenant_id) {
        return res.status(400).json({ error: 'Usuários que não são super_admin devem ter uma empresa associada.' });
      }
      if (role === 'super_admin' && user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Insufficient permissions to assign super_admin role' });
      }
      updateData.role = role;
    }
    if (tenant_id !== undefined) updateData.tenant_id = role === 'super_admin' ? null : tenant_id;
    if (status !== undefined && status === 'inactive' && id === user.id) {
      return res.status(400).json({ error: 'Você não pode desativar o próprio usuário.' });
    }
    if (status !== undefined) updateData.status = status;

    // Verificar se há dados para atualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Nenhum campo fornecido para atualização.' });
    }

    // Atualizar usuário
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Error updating user: ' + error.message });
    }

    return res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
}

export default withAuth(handler); 