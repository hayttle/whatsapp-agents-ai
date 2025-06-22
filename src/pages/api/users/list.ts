import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    const { tenantId } = req.query;
    let query = supabase.from('users').select('id, email, nome, role, tenant_id');

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

    const { data: users, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    return res.status(200).json({ users: users || [] });
  } catch (error: any) {
    console.error('Error in users list API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 