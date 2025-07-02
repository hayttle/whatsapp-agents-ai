import { NextApiRequest, NextApiResponse } from 'next';
import { withSuperAdmin, AuthResult } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';

async function handler(req: NextApiRequest, res: NextApiResponse, auth: AuthResult) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, name, role, tenant_id } = req.body;

    // Validações
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    }
    if (role !== 'super_admin' && !tenant_id) {
      return res.status(400).json({ error: 'Usuários que não são super_admin devem ter uma empresa associada.' });
    }

    const adminClient = createAdminClient();

    // 1. Criar usuário no Supabase Auth
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authUser?.user) {
      // Verificar se é erro de email já existente
      if (authError?.message?.includes('already been registered')) {
        return res.status(422).json({ error: 'Este email já está registrado no sistema. Tente usar um email diferente.' });
      }
      
      // Verificar se é erro de email inválido
      if (authError?.message?.includes('Invalid email')) {
        return res.status(400).json({ error: 'Email inválido. Verifique o formato do email.' });
      }
      
      // Verificar se é erro de senha fraca
      if (authError?.message?.includes('Password should be at least')) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
      }
      
      console.error('[Users Create] Erro ao criar usuário no Auth:', authError);
      return res.status(500).json({ error: 'Erro ao criar usuário no sistema de autenticação.' });
    }

    // 2. Inserir dados do usuário na tabela users
    const userDataToInsert = {
      id: authUser.user.id,
      email,
      name,
      role,
      tenant_id: role === 'super_admin' ? null : tenant_id,
    };

    const { error: insertError } = await auth.supabase
      .from('users')
      .insert(userDataToInsert);

    if (insertError) {
      // Se falhar ao inserir na tabela users, deletar o usuário do Auth
      await adminClient.auth.admin.deleteUser(authUser.user.id);
      console.error('[Users Create] Erro ao inserir na tabela users:', insertError);
      return res.status(500).json({ error: 'Erro ao criar usuário no banco de dados.' });
    }

    const newUser = {
      id: authUser.user.id,
      email,
      name,
      role,
      tenant_id: role === 'super_admin' ? null : tenant_id,
    };

    // Log de auditoria

    return res.status(201).json({ 
      success: true, 
      user: newUser
    });
  } catch (error) {
    console.error('[Users Create] Erro inesperado:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withSuperAdmin(handler); 