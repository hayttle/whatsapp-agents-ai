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
      return res.status(400).json({ error: 'ID da instância é obrigatório' });
    }

    // Buscar instância existente
    console.log('[DEBUG] Buscando instância:', id);
    const { data: existingInstance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('tenant_id, provider_type')
      .eq('id', id)
      .single();
    console.log('[DEBUG] Instância encontrada:', existingInstance);
    if (fetchError || !existingInstance) {
      console.error('[DEBUG] Erro ao buscar instância:', fetchError);
      return res.status(404).json({ error: 'Instance not found' });
    }
    if (userData.role !== 'super_admin' && existingInstance.tenant_id !== userData.tenant_id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Atualizar instância
    console.log('[DEBUG] Atualizando instância:', id, updateData);
    const { data: updated, error: updateError } = await supabase
      .from('whatsapp_instances')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    console.log('[DEBUG] Instância atualizada:', updated);
    if (updateError) {
      console.error('[DEBUG] Erro ao atualizar instância:', updateError);
      return res.status(500).json({ error: 'Erro ao atualizar instância: ' + updateError.message });
    }

    // Se a instância tem um agente associado, buscar dados do agente para webhook
    if (updated.agent_id) {
      console.log('[DEBUG] Buscando agente vinculado:', updated.agent_id);
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('title, description, webhookUrl, agent_type')
        .eq('id', updated.agent_id)
        .single();
      console.log('[DEBUG] Agente encontrado:', agent);

      if (agentError) {
        console.error('[DEBUG] Erro ao buscar agente:', agentError);
        return res.status(500).json({ error: 'Erro ao buscar dados do agente: ' + agentError.message });
      }

      // Determinar a URL do webhook baseada no tipo do agente
      let webhookUrl = null;
      if (agent.agent_type === 'external') {
        webhookUrl = agent.webhookUrl;
      } else if (agent.agent_type === 'internal' || !agent.agent_type) {
        webhookUrl = process.env.WEBHOOK_AGENT_URL;
      } else {
        webhookUrl = null;
      }
      console.log('[DEBUG] URL do webhook determinada:', webhookUrl);

      // Preparar payload para webhook
      const webhookPayload = {
        instance_id: updated.id,
        instance_name: updated.name,
        provider: updated.provider,
        webhook_url: webhookUrl, // Usar a URL determinada acima
        agent: {
          name: agent.title,
          description: agent.description
        },
        ...(existingInstance.provider_type === 'externo' && agent.agent_type === 'external' && webhookUrl ? {
          webhook: {
            enabled: true,
            url: webhookUrl
          }
        } : {})
      };
      console.log('[DEBUG] Payload do webhook montado:', webhookPayload);

      // Enviar webhook se configurado
      if (webhookUrl) {
        try {
          console.log('[DEBUG] Enviando webhook para:', webhookUrl);
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookPayload),
          });

          const responseText = await response.text();
          console.log('[DEBUG] Resposta do webhook:', response.status, responseText);

          if (!response.ok) {
            return res.status(500).json({ 
              error: `Erro ao enviar webhook: ${response.status} - ${responseText}` 
            });
          }
        } catch (webhookError) {
          console.error('[DEBUG] Erro ao enviar webhook:', webhookError);
          return res.status(500).json({ 
            error: 'Erro ao enviar webhook: ' + (webhookError instanceof Error ? webhookError.message : 'Erro desconhecido') 
          });
        }
      }
    }

    return res.status(200).json({ success: true, instance: updated });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 