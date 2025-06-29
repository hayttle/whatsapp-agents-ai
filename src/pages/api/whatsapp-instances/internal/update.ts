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
      .select('tenant_id, provider_type, agent_id, instanceName')
      .eq('id', id)
      .single();
    if (fetchError || !existingInstance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    // Verificar se é realmente uma instância interna
    if (existingInstance.provider_type !== 'nativo') {
      return res.status(400).json({ error: 'This endpoint is only for internal instances' });
    }

    if (userData.role !== 'super_admin' && existingInstance.tenant_id !== userData.tenant_id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Verificar se um agente foi desvinculado (tinha agente antes, agora não tem)
    const agentWasUnlinked = existingInstance.agent_id && !updateData.agent_id;

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

    // Verificar se a API key está configurada
    const apiKey = process.env.EVOLUTION_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Evolution API key not configured' });
    }

    // Se um agente foi desvinculado, desativar o webhook
    if (agentWasUnlinked) {
      try {
        const webhookConfig = {
          webhook: {
            enabled: false
          }
        };
        
        const response = await fetch(`${process.env.EVOLUTION_API_URL}/webhook/set/${existingInstance.instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
          },
          body: JSON.stringify(webhookConfig),
        });

        if (!response.ok) {
          const responseText = await response.text();
          return res.status(500).json({ 
            error: `Erro ao desativar webhook: ${response.status} - ${responseText}` 
          });
        }
      } catch (webhookError) {
        return res.status(500).json({ 
          error: 'Erro ao desativar webhook: ' + (webhookError instanceof Error ? webhookError.message : 'Erro desconhecido') 
        });
      }
    }
    // Se a instância tem um agente associado, configurar webhook na Evolution API
    else if (updated.agent_id) {
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('title, description, webhookUrl, agent_type')
        .eq('id', updated.agent_id)
        .single();

      if (agentError) {
        return res.status(500).json({ error: 'Erro ao buscar dados do agente: ' + agentError.message });
      }

      // Verificar se é realmente um agente interno
      if (agent.agent_type !== 'internal') {
        return res.status(400).json({ error: 'Internal instances can only be linked to internal agents' });
      }

      // Para instâncias internas, sempre usar a variável de ambiente
      const webhookUrl = process.env.WEBHOOK_AGENT_URL;
      if (!webhookUrl) {
        return res.status(500).json({ error: 'Internal webhook URL not configured' });
      }

      // Configurar webhook na Evolution API
      try {
        const webhookConfig = {
          webhook: {
            enabled: true,
            url: webhookUrl,
            byEvents: false,
            base64: true,
            events: ["MESSAGES_UPSERT"]
          }
        };
        
        const response = await fetch(`${process.env.EVOLUTION_API_URL}/webhook/set/${updated.instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
          },
          body: JSON.stringify(webhookConfig),
        });

        if (!response.ok) {
          const responseText = await response.text();
          return res.status(500).json({ 
            error: `Erro ao configurar webhook interno: ${response.status} - ${responseText}` 
          });
        }
      } catch (webhookError) {
        return res.status(500).json({ 
          error: 'Erro ao configurar webhook interno: ' + (webhookError instanceof Error ? webhookError.message : 'Erro desconhecido') 
        });
      }
    }

    return res.status(200).json({ success: true, instance: updated });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 