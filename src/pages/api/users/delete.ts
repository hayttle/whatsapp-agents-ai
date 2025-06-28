import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser, createApiClient } from '@/lib/supabase/api';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Autenticar usuário via cookies
    const auth = await authenticateUser(req, res);
    
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
    }

    const { userData } = auth;
    
    // Apenas super_admin pode deletar usuários
    if (userData.role !== 'super_admin') {
      return res.status(403).json({ error: 'Insufficient permissions - Only super_admin can delete users' });
    }

    const supabase = createApiClient(req, res);
    const adminClient = createAdminClient();

    // Permitir id via body (JSON) ou query
    let id = req.body?.id;
    if (!id) id = req.query?.id;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Verificar se o usuário existe
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, role, tenant_id, email')
      .eq('id', id)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Não permitir que o usuário se delete a si mesmo
    if (id === userData.id) {
      return res.status(400).json({ error: 'Você não pode excluir sua própria conta. Entre em contato com outro administrador.' });
    }

    // 1. Deletar usuário da tabela users
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(500).json({ error: 'Error deleting user from database: ' + deleteError.message });
    }

    // 2. Deletar usuário do Supabase Auth
    try {
      const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(id);
      
      if (authDeleteError) {
        // Não falhar se não conseguir deletar do Auth, apenas logar o erro
        console.warn('User deleted from database but failed to delete from Auth:', authDeleteError.message);
      }
    } catch {
      // Não falhar se não conseguir deletar do Auth
      console.warn('User deleted from database but failed to delete from Auth');
    }

    return res.status(200).json({ 
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 