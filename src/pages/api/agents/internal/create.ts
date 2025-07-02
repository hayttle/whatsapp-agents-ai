import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthResult } from '@/lib/auth/helpers';

async function handler(req: NextApiRequest, res: NextApiResponse, auth: AuthResult) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar permissões - usuários comuns podem criar agentes para seu próprio tenant
    if (!auth.user.role || !['user', 'super_admin'].includes(auth.user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }

    const { tenant_id, instance_id, title, prompt, fallback_message, active, personality, custom_personality, tone, description, buffer_time, agent_model_id, rules, scheduling_enabled, calendar_id, scheduling_query_prompt, scheduling_create_prompt } = req.body;

    // Validação para agentes internos
    if (!tenant_id || !title || !prompt || !fallback_message) {
      return res.status(400).json({ error: 'Missing required fields for internal agent' });
    }

    // Verificar permissões de tenant
    if (auth.user.role !== 'super_admin' && tenant_id !== auth.user.tenant_id) {
      return res.status(403).json({ error: 'Forbidden - Cannot create agent for different tenant' });
    }

    // Para agentes internos, sempre usar a variável de ambiente
    const webhookUrl = process.env.WEBHOOK_AGENT_URL;
    if (!webhookUrl) {
      return res.status(500).json({ error: 'Internal webhook URL not configured' });
    }

    const { data: agent, error } = await auth.supabase
      .from('agents')
      .insert({
        tenant_id,
        instance_id: instance_id || null,
        title,
        prompt,
        fallback_message,
        active: active ?? true,
        personality: personality || null,
        custom_personality: custom_personality || null,
        tone: tone || null,
        webhookUrl: null,
        description: description || null,
        agent_type: 'internal',
        buffer_time: buffer_time ?? null,
        agent_model_id: agent_model_id || null,
        rules: rules || null,
        scheduling_enabled: scheduling_enabled ?? false,
        calendar_id: calendar_id || null,
        scheduling_query_prompt: scheduling_query_prompt || null,
        scheduling_create_prompt: scheduling_create_prompt || null
      })
      .select()
      .single();

    if (error) {
      console.error('[Agents Internal Create] Erro ao criar agente interno:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Log de auditoria
    // logAuditAction(
    //   'CREATE_INTERNAL_AGENT',
    //   'agents',
    //   agent.id,
    //   auth.user.id,
    //   auth.user.email,
    //   { 
    //     agent_title: title,
    //     tenant_id,
    //     instance_id,
    //     agent_type: 'internal',
    //     method: req.method 
    //   }
    // );

    return res.status(201).json({ success: true, agent });
  } catch (error) {
    console.error('[Agents Internal Create] Erro inesperado:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler); 