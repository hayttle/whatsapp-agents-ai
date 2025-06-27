import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser, createApiClient } from '@/lib/supabase/api';
import { createAdminClient } from '@/lib/supabase/admin';

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
    
    // Apenas super_admin pode criar usuários
    if (userData.role !== 'super_admin') {
      return res.status(403).json({ error: 'Insufficient permissions - Only super_admin can create users' });
    }

    const supabase = createApiClient(req, res);
    const adminClient = createAdminClient();

    const { email, password, name, role, tenant_id } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    }
    if (role !== 'super_admin' && !tenant_id) {
      return res.status(400).json({ error: 'Usuários que não são super_admin devem ter uma empresa associada.' });
    }

    // Verificar permissões para criar super_admin
    if (role === 'super_admin' && userData.role !== 'super_admin') {
      return res.status(403).json({ error: 'Insufficient permissions to create super_admin' });
    }

    // 1. Criar usuário no Supabase Auth
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authUser?.user) {
      return res.status(500).json({ error: 'Erro ao criar usuário no Auth: ' + (authError?.message || 'Erro desconhecido') });
    }

    // 2. Inserir dados do usuário na tabela users
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        name,
        role,
        tenant_id: role === 'super_admin' ? null : tenant_id,
      });

    if (insertError) {
      // Se falhar ao inserir na tabela users, deletar o usuário do Auth
      await adminClient.auth.admin.deleteUser(authUser.user.id);
      return res.status(500).json({ error: 'Erro ao criar usuário: ' + insertError.message });
    }

    return res.status(201).json({ 
      success: true, 
      user: {
        id: authUser.user.id,
        email,
        name,
        role,
        tenant_id: role === 'super_admin' ? null : tenant_id,
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 