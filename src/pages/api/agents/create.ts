import { NextApiRequest, NextApiResponse } from 'next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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

    const { tenant_id, instance_id, title, prompt, fallback_message, active } = req.body;

    // Validação dos dados
    if (!tenant_id || !instance_id || !title || !prompt || !fallback_message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verificar permissões
    if (userData.role !== 'super_admin' && tenant_id !== userData.tenant_id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { data: agent, error } = await supabase
      .from('agents')
      .insert({
        tenant_id,
        instance_id,
        title,
        prompt,
        fallback_message,
        active: active ?? true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating agent:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    return res.status(201).json({ success: true, agent });
  } catch (error: any) {
    console.error('Error in agent create API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 