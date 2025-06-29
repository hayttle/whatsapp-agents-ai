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

      // Enviar webhook se configurado
      if (webhookUrl) {
        try {
          console.log('[DEBUG] Configurando webhook da instância na Evolution API');
          
          // Buscar dados da instância para obter server_url e apikey
          const { data: instanceData, error: instanceError } = await supabase
            .from('whatsapp_instances')
            .select('id, instanceName, apikey, provider_type, provider_id')
            .eq('id', updated.id)
            .single();
          
          if (instanceError) {
            console.error('[DEBUG] Erro ao buscar dados da instância:', instanceError);
            return res.status(500).json({ error: 'Erro ao buscar dados da instância: ' + instanceError.message });
          }
          
          let serverUrl = process.env.EVOLUTION_API_URL;
          let apiKey = instanceData.apikey;
          
          // Se for instância externa, buscar dados do provedor
          if (instanceData.provider_type === 'externo' && instanceData.provider_id) {
            const { data: provider, error: providerError } = await supabase
              .from('whatsapp_providers')
              .select('server_url, api_key')
              .eq('id', instanceData.provider_id)
              .single();
              
            if (providerError) {
              console.error('[DEBUG] Erro ao buscar provedor:', providerError);
              return res.status(500).json({ error: 'Erro ao buscar dados do provedor: ' + providerError.message });
            }
            
            serverUrl = provider.server_url;
            apiKey = provider.api_key;
          }
          
          console.log('[DEBUG] Server URL:', serverUrl);
          console.log('[DEBUG] Instance Name:', instanceData.instanceName);
          
          if (!apiKey) {
            console.error('[DEBUG] API Key não encontrada');
            return res.status(500).json({ error: 'API Key não configurada' });
          }
          
          // Configurar webhook da instância
          const webhookConfig = {
            webhook: {
              enabled: true,
              url: webhookUrl,
              webhookByEvents: false,
              webhookBase64: true,
              events: ["MESSAGES_UPSERT"]
            }
          };
          
          console.log('[DEBUG] Configuração do webhook:', webhookConfig);
          
          const response = await fetch(`${serverUrl}/webhook/set/${instanceData.instanceName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': apiKey,
            },
            body: JSON.stringify(webhookConfig),
          });

          const responseText = await response.text();
          console.log('[DEBUG] Resposta da Evolution API:', response.status, responseText);

          if (!response.ok) {
            return res.status(500).json({ 
              error: `Erro ao configurar webhook: ${response.status} - ${responseText}` 
            });
          }
        } catch (webhookError) {
          console.error('[DEBUG] Erro ao configurar webhook:', webhookError);
          return res.status(500).json({ 
            error: 'Erro ao configurar webhook: ' + (webhookError instanceof Error ? webhookError.message : 'Erro desconhecido') 
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