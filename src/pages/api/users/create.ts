import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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

    const { email, password, nome, role, tenant_id } = req.body;

    // Validação dos dados
    if (!email || !password || !nome || !role || !tenant_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verificar permissões
    if (userData.role !== 'super_admin' && tenant_id !== userData.tenant_id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Criar usuário no Auth
    const { data: authData, error: createAuthError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nome,
        role,
        tenant_id,
      },
    });

    if (createAuthError) {
      console.error('Error creating user in Auth:', createAuthError);
      return res.status(500).json({ error: 'Error creating user in Auth: ' + createAuthError.message });
    }

    const userId = authData.user?.id;
    if (!userId) {
      return res.status(500).json({ error: 'User created in Auth but ID not returned' });
    }

    // Inserir na tabela users
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        nome,
        role,
        tenant_id,
      });

    if (dbError) {
      console.error('Error inserting user in database:', dbError);
      // Tentar deletar o usuário do Auth se falhou no banco
      await supabase.auth.admin.deleteUser(userId);
      return res.status(500).json({ error: 'Error inserting user in database: ' + dbError.message });
    }

    return res.status(201).json({ 
      success: true, 
      user: { id: userId, email, nome, role, tenant_id } 
    });
  } catch (error: any) {
    console.error('Error in user create API:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
} 