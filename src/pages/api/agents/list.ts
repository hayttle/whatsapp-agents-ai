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
    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('email', session.user.email)
      .single();

    if (!userData) {
      return res.status(403).json({ error: 'User not found' });
    }

    const { tenantId } = req.query;
    let query = supabase.from('agents').select('*');

    // Filtrar por tenant baseado no role
    if (userData.role === 'super_admin') {
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
    } else if (userData.role === 'admin') {
      query = query.eq('tenant_id', userData.tenant_id);
    } else {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { data: agents, error } = await query;

    if (error) {
      console.error('Error fetching agents:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    return res.status(200).json({ agents: agents || [] });
  } catch (error: any) {
    console.error('Error in agents list API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 