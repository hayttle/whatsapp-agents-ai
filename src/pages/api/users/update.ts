import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
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

    const { id, nome, email, role, tenant_id, password } = req.body;

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

    // Apenas super_admin pode editar qualquer usuário
    // Admin pode editar apenas usuários do mesmo tenant
    // User pode editar apenas seu próprio perfil
    if (userData.role === 'user' && id !== userData.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    if (userData.role === 'admin' && targetUser.tenant_id !== userData.tenant_id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Preparar dados para atualização
    const updateData: any = {};
    if (nome !== undefined) updateData.nome = nome;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined && userData.role === 'super_admin') updateData.role = role;
    if (tenant_id !== undefined && userData.role === 'super_admin') updateData.tenant_id = tenant_id;

    // Atualizar senha se fornecida
    if (password) {
      const { error: passwordError } = await supabase.auth.admin.updateUserById(id, {
        password: password
      });
      
      if (passwordError) {
        console.error('Error updating password:', passwordError);
        return res.status(500).json({ error: 'Error updating password: ' + passwordError.message });
      }
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ error: 'Internal server error: ' + error.message });
    }

    return res.status(200).json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Error in user update API:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
} 