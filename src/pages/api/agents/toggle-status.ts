import { NextApiRequest, NextApiResponse } from 'next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
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

    const { id, active } = req.body;

    if (!id || typeof active !== 'boolean') {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Verificar permissões
    const { data: agent } = await supabase
      .from('agents')
      .select('tenant_id')
      .eq('id', id)
      .single();

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    if (userData.role !== 'super_admin' && agent.tenant_id !== userData.tenant_id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { error } = await supabase
      .from('agents')
      .update({ active })
      .eq('id', id);

    if (error) {
      console.error('Error updating agent status:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error in agent toggle status API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 