import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser, createApiClient } from '@/lib/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
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

    const { id, ...updateData } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Instance ID is required' });
    }

    // Buscar instância existente
    const { data: existingInstance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('tenant_id')
      .eq('id', id)
      .single();
    if (fetchError || !existingInstance) {
      return res.status(404).json({ error: 'Instance not found' });
    }
    if (userData.role !== 'super_admin' && existingInstance.tenant_id !== userData.tenant_id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    console.log('[DEBUG] updateData recebido:', updateData);
    // Atualizar instância
    const { data: updated, error: updateError } = await supabase
      .from('whatsapp_instances')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }
    console.log('[DEBUG] Instância após update:', updated);

    // --- INTEGRAÇÃO COM PROVEDOR EXTERNO ---
    // Buscar instância atualizada com provider_type, provider_id, agent_id, instanceName
    const { data: instanceFull, error: instanceFullError } = await supabase
      .from('whatsapp_instances')
      .select('id, instanceName, provider_type, provider_id, agent_id')
      .eq('id', id)
      .single();
    if (instanceFullError) {
      return res.status(500).json({ error: 'Erro ao buscar instância atualizada.' });
    }
    if (instanceFull.provider_type === 'externo' && instanceFull.provider_id) {
      // Buscar provedor externo
      const { data: provider, error: providerError } = await supabase
        .from('whatsapp_providers')
        .select('server_url, api_key')
        .eq('id', instanceFull.provider_id)
        .single();
      if (providerError || !provider) {
        return res.status(500).json({ error: 'Erro ao buscar provedor externo.' });
      }
      // Definir webhook
      let webhookPayload: any = {
        enabled: false,
        url: updated?.webhookUrl || '',
        webhookByEvents: updated?.webhookByEvents ?? false,
        webhookBase64: updated?.webhookBase64 ?? false,
        events: updated?.webhookEvents ?? ["MESSAGES_UPSERT"]
      };
      console.log('[DEBUG] agent_id:', instanceFull.agent_id);
      if (instanceFull.agent_id) {
        // Buscar agente
        const { data: agent, error: agentError } = await supabase
          .from('agents')
          .select('webhookUrl')
          .eq('id', instanceFull.agent_id)
          .single();
        if (agentError || !agent) {
          return res.status(500).json({ error: 'Erro ao buscar agente vinculado.' });
        }
        webhookPayload = {
          enabled: true,
          url: agent.webhookUrl,
          webhookByEvents: updated?.webhookByEvents ?? false,
          webhookBase64: updated?.webhookBase64 ?? false,
          events: updated?.webhookEvents ?? ["MESSAGES_UPSERT"]
        };
      }
      console.log('[DEBUG] webhookPayload a ser enviado:', webhookPayload);
      const endpoint = provider.server_url.replace(/\/$/, '') + `/webhook/set/${encodeURIComponent(instanceFull.instanceName)}`;
      console.log('[DEBUG] Endpoint chamado:', endpoint);
      // Chamar API do provedor externo para atualizar webhook
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': provider.api_key,
          },
          body: JSON.stringify({ webhook: webhookPayload }),
        });
        const responseText = await response.text();
        console.log('[DEBUG] Status resposta provedor externo:', response.status);
        console.log('[DEBUG] Body resposta provedor externo:', responseText);
      } catch (err) {
        console.error('[DEBUG] Erro ao atualizar webhook no provedor externo:', err);
        return res.status(500).json({ error: 'Erro ao atualizar webhook no provedor externo.' });
      }
    }
    // --- FIM INTEGRAÇÃO ---

    return res.status(200).json({ success: true, instance: updated });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 