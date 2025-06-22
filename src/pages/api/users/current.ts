import { NextApiRequest, NextApiResponse } from 'next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Buscar dados do usuário
    const { data: userData, error } = await supabase
      .from('users')
      .select('id, email, nome, role, tenant_id')
      .eq('email', session.user.email)
      .single();

    if (error || !userData) {
      console.error('Error fetching current user:', error);
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ 
      user: userData,
      role: userData.role 
    });
  } catch (error: any) {
    console.error('Error in current user API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 