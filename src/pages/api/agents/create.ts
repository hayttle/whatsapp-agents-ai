import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser, createApiClient } from '@/lib/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Autenticar usuário via cookies
    const auth = await authenticateUser(req, res);
    
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
    }

    const { userData } = auth;
    const supabase = createApiClient(req, res);

    const { tenant_id, instance_id, title, prompt, fallback_message, active, personality, custom_personality, tone, webhookUrl } = req.body;

    // Validação dos dados (instance_id agora é opcional)
    if (!tenant_id || !title || !prompt || !fallback_message) {
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
        instance_id: instance_id || null,
        title,
        prompt,
        fallback_message,
        active: active ?? true,
        personality,
        custom_personality,
        tone,
        webhookUrl: webhookUrl || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating agent:', error);
      return res.status(500).json({ error: 'Error creating agent: ' + error.message });
    }

    return res.status(201).json({ success: true, agent });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Error in agent create API:', error);
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 