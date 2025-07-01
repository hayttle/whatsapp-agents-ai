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
      .select('tenant_id, provider_type, agent_id, instanceName, provider_id')
      .eq('id', id)
      .single();
    if (fetchError || !existingInstance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    // Verificar se é realmente uma instância externa
    if (existingInstance.provider_type !== 'externo') {
      return res.status(400).json({ error: 'This endpoint is only for external instances' });
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

    // Se um agente foi desvinculado, desativar o webhook no provedor externo
    if (agentWasUnlinked) {
      try {
        // Buscar dados do provedor externo
        const { data: provider, error: providerError } = await supabase
          .from('whatsapp_providers')
          .select('server_url, api_key')
          .eq('id', existingInstance.provider_id)
          .single();
        if (providerError) {
          return res.status(500).json({ error: 'Erro ao buscar dados do provedor: ' + providerError.message });
        }
        
        // Buscar o agente que estava vinculado para obter o webhookUrl
        const { data: agent, error: agentError } = await supabase
          .from('agents')
          .select('webhookUrl')
          .eq('id', existingInstance.agent_id)
          .single();
        
        if (agentError) {
          return res.status(500).json({ error: 'Erro ao buscar dados do agente: ' + agentError.message });
        }
        
        const webhookConfig = {
          webhook: {
            enabled: false,
            url: agent.webhookUrl,
            byEvents: false,
            base64: true,
            events: ["MESSAGES_UPSERT"]
          }
        };
        const response = await fetch(`${provider.server_url}/webhook/set/${existingInstance.instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': provider.api_key,
          },
          body: JSON.stringify(webhookConfig),
        });
        if (!response.ok) {
          const responseText = await response.text();
          return res.status(500).json({ 
            error: `Erro ao desativar webhook externo: ${response.status} - ${responseText}` 
          });
        }
      } catch (err) {
        return res.status(500).json({ error: 'Erro ao desativar webhook externo: ' + (err instanceof Error ? err.message : 'Erro desconhecido') });
      }
    }
    // Se a instância tem um agente associado, configurar webhook no provedor externo
    else if (updated.agent_id) {
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('title, description, webhookUrl, agent_type')
        .eq('id', updated.agent_id)
        .single();
      if (agentError) {
        return res.status(500).json({ error: 'Erro ao buscar dados do agente: ' + agentError.message });
      }

      // Verificar se é realmente um agente externo
      if (agent.agent_type !== 'external') {
        return res.status(400).json({ error: 'External instances can only be linked to external agents' });
      }

      // Para instâncias externas, usar o webhookUrl do agente
      const webhookUrl = agent.webhookUrl;
      if (!webhookUrl) {
        return res.status(500).json({ error: 'External agent has no webhook URL configured' });
      }

      // Configurar webhook no provedor externo
      try {
        // Buscar dados da instância para obter server_url e apikey
        const { data: instanceData, error: instanceError } = await supabase
          .from('whatsapp_instances')
          .select('id, instanceName, apikey, provider_type, provider_id')
          .eq('id', updated.id)
          .single();
        if (instanceError) {
          return res.status(500).json({ error: 'Erro ao buscar dados da instância: ' + instanceError.message });
        }
        // Buscar dados do provedor externo
        const { data: provider, error: providerError } = await supabase
          .from('whatsapp_providers')
          .select('server_url, api_key')
          .eq('id', instanceData.provider_id)
          .single();
        if (providerError) {
          return res.status(500).json({ error: 'Erro ao buscar dados do provedor: ' + providerError.message });
        }
        const webhookConfig = {
          webhook: {
            enabled: true,
            url: webhookUrl,
            byEvents: false,
            base64: true,
            events: [
              "MESSAGES_UPSERT"
            ]
          }
        };
        await fetch(`${provider.server_url}/webhook/set/${instanceData.instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': provider.api_key,
          },
          body: JSON.stringify(webhookConfig),
        });
      } catch {
        return res.status(500).json({ error: 'Erro ao configurar webhook externo' });
      }
    }

    return res.status(200).json({ success: true, instance: updated });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 