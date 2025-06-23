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

    // Teste 1: Verificar se o usuário já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single();

    if (existingUser) {
      return res.status(200).json({ 
        success: true,
        message: 'Usuário já existe',
        user: existingUser
      });
    }

    // Teste 2: Tentar inserir um novo usuário
    const testData = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário Teste',
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newUser } = await supabase
      .from('users')
      .insert(testData)
      .select()
      .single();

    if (newUser) {
      return res.status(200).json({ 
        success: true,
        message: 'Usuário criado com sucesso',
        user: newUser
      });
    }

    return res.status(500).json({ 
      success: false,
      error: 'Falha na inserção',
      details: newUser
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro no teste de inserção:', error);
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 