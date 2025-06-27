import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser, createApiClient } from '@/lib/supabase/api';

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

    // Permitir id via body (JSON) ou query
    let id = req.body?.id;
    if (!id) id = req.query?.id;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Verificar se o usuário existe
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', id)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Deletar usuário
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ error: 'Error deleting user: ' + error.message });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 