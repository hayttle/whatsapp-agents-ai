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

    // Buscar dados do usuário
    const { data: userData, error } = await supabase
      .from('users')
      .select('id, email, nome, role, tenant_id')
      .eq('email', user.email)
      .single();

    if (error || !userData) {
      return res.status(404).json({ error: 'User not found' });
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