import { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '@/lib/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createApiClient(req, res);
    
    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Primeiro, verificar se o usuário existe na tabela users
    let userData;
    const { error, data } = await supabase
      .from('users')
      .select('id, email, name, role, tenant_id, created_at, updated_at')
      .eq('email', user.email)
      .single();
    userData = data;

    // Se o usuário não existe na tabela users, criar um registro
    if (error && error.code === 'PGRST116') {
      
      const insertData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        return res.status(500).json({ error: 'Failed to create user', details: insertError });
      }

      userData = newUser;
    } else if (error) {
      return res.status(404).json({ error: 'User not found', details: error });
    }

    if (!userData) {
      return res.status(404).json({ error: 'User data not found' });
    }

    return res.status(200).json({ 
      user: userData,
      role: userData.role 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 