import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar se há token de autorização
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autorização não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    
    // Criar cliente Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verificar usuário pelo token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Não autorizado: ' + (authError?.message || 'Usuário não encontrado') });
    }

    // Verificar se a tabela subscriptions existe
    const { data: tableCheck, error: tableError } = await supabase
      .from('subscriptions')
      .select('count')
      .limit(1);

    if (tableError) {
      return res.status(500).json({ 
        error: 'Erro ao acessar tabela subscriptions: ' + tableError.message,
        user: { id: user.id, email: user.email }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Autenticação e tabela funcionando corretamente',
      user: { id: user.id, email: user.email },
      tableExists: true
    });

  } catch (error: any) {
    console.error('Erro no teste:', error);
    return res.status(500).json({ 
      error: error.message || 'Erro interno do servidor' 
    });
  }
} 