import { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '@/lib/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createApiClient(req, res);
    
    // Teste 1: Verificar se conseguimos listar todos os usuários
    const { data: allUsers, error: listError } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    // Teste 2: Verificar se conseguimos contar usuários
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Teste 3: Verificar estrutura da tabela
    const { data: sampleUser, error: sampleError } = await supabase
      .from('users')
      .select('id, email, name, role, tenant_id, created_at, updated_at')
      .limit(1)
      .single();

    return res.status(200).json({ 
      success: true,
      tests: {
        listUsers: { data: allUsers, error: listError },
        countUsers: { count, error: countError },
        sampleUser: { data: sampleUser, error: sampleError }
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 