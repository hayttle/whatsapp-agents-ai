import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar autenticação via token no header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verificar o token com Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    // Buscar dados do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('email', user.email)
      .single();

    if (userError || !userData) {
      return res.status(403).json({ error: 'User not found in database' });
    }

    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Verificar permissões
    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', id)
      .single();

    if (targetError || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verificar se não está tentando deletar a si mesmo
    if (id === userData.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Apenas super_admin pode deletar qualquer usuário
    // Admin pode deletar apenas usuários do mesmo tenant
    if (userData.role === 'user') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    if (userData.role === 'admin' && targetUser.tenant_id !== userData.tenant_id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Deletar usuário do Auth
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id);
    
    if (authDeleteError) {
      console.error('Error deleting user from Auth:', authDeleteError);
      return res.status(500).json({ error: 'Error deleting user from Auth: ' + authDeleteError.message });
    }

    // Deletar da tabela users
    const { error: dbDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (dbDeleteError) {
      console.error('Error deleting user from database:', dbDeleteError);
      return res.status(500).json({ error: 'Error deleting user from database: ' + dbDeleteError.message });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error in user delete API:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
} 