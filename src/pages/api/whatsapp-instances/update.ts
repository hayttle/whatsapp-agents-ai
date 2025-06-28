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

    // Atualizar instância
    const { data: updated, error: updateError } = await supabase
      .from('whatsapp_instances')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (updateError) {
      return res.status(500).json({ error: 'Erro ao atualizar instância: ' + updateError.message });
    }

    // Se a instância tem um agente associado, buscar dados do agente
    if (updated.agent_id) {
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('name, description, instructions, model, temperature, max_tokens')
        .eq('id', updated.agent_id)
        .single();

      if (agentError) {
        return res.status(500).json({ error: 'Erro ao buscar dados do agente: ' + agentError.message });
      }

      // Preparar payload para webhook
      const webhookPayload = {
        instance_id: updated.id,
        instance_name: updated.name,
        provider: updated.provider,
        webhook_url: updated.webhook_url,
        agent: {
          name: agent.name,
          description: agent.description,
          instructions: agent.instructions,
          model: agent.model,
          temperature: agent.temperature,
          max_tokens: agent.max_tokens
        }
      };

      // Enviar webhook se configurado
      if (updated.webhook_url) {
        try {
          const endpoint = updated.webhook_url;
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookPayload),
          });

          const responseText = await response.text();

          if (!response.ok) {
            return res.status(500).json({ 
              error: `Erro ao enviar webhook: ${response.status} - ${responseText}` 
            });
          }
        } catch (webhookError) {
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