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
    const supabase = createApiClient(req, res);
    const adminClient = createAdminClient();

    const { name, email, role, tenant_id, password } = req.body;

    if (!name || !email || !role || !password) {
      return res.status(400).json({ error: 'Name, email, role and password are required' });
    }

    // Verificar permissões
    if (userData.role !== 'super_admin' && role === 'super_admin') {
      return res.status(403).json({ error: 'Insufficient permissions to create super_admin' });
    }

    // Se não for super_admin, só pode criar usuários para o mesmo tenant
    const targetTenantId = userData.role === 'super_admin' ? tenant_id : userData.tenant_id;

    // 1. Criar usuário no Supabase Auth
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authUser?.user) {
      return res.status(500).json({ error: 'Erro ao criar usuário no Auth: ' + (authError?.message || 'Erro desconhecido') });
    }

    // 2. Inserir usuário na tabela users, usando o mesmo id do Auth
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        name,
        email,
        role,
        tenant_id: targetTenantId
      })
      .select()
      .single();

    if (error) {
      // Se falhar aqui, idealmente remover o usuário do Auth para não ficar "órfão"
      await adminClient.auth.admin.deleteUser(authUser.user.id);
      return res.status(500).json({ error: 'Erro ao criar usuário na tabela users: ' + error.message });
    }

    return res.status(201).json({ success: true, user });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 