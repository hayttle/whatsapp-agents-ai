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

    const { id, tenant_id, instance_id, title, prompt, fallback_message, active } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Agent ID is required' });
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

    // Preparar dados para atualização
    const updateData: any = {};
    if (tenant_id !== undefined) updateData.tenant_id = tenant_id;
    if (instance_id !== undefined) updateData.instance_id = instance_id;
    if (title !== undefined) updateData.title = title;
    if (prompt !== undefined) updateData.prompt = prompt;
    if (fallback_message !== undefined) updateData.fallback_message = fallback_message;
    if (active !== undefined) updateData.active = active;

    const { data: updatedAgent, error } = await supabase
      .from('agents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating agent:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    return res.status(200).json({ success: true, agent: updatedAgent });
  } catch (error: any) {
    console.error('Error in agent update API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 