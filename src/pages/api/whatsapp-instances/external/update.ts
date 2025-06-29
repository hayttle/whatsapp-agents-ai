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
    console.log('[DEBUG] Buscando instância externa:', id);
    const { data: existingInstance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('tenant_id, provider_type')
      .eq('id', id)
      .single();
    console.log('[DEBUG] Instância externa encontrada:', existingInstance);
    if (fetchError || !existingInstance) {
      console.error('[DEBUG] Erro ao buscar instância externa:', fetchError);
      return res.status(404).json({ error: 'Instance not found' });
    }

    // Verificar se é realmente uma instância externa
    if (existingInstance.provider_type !== 'externo') {
      return res.status(400).json({ error: 'This endpoint is only for external instances' });
    }

    if (userData.role !== 'super_admin' && existingInstance.tenant_id !== userData.tenant_id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Atualizar instância
    console.log('[DEBUG] Atualizando instância externa:', id, updateData);
    const { data: updated, error: updateError } = await supabase
      .from('whatsapp_instances')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    console.log('[DEBUG] Instância externa atualizada:', updated);
    if (updateError) {
      console.error('[DEBUG] Erro ao atualizar instância externa:', updateError);
      return res.status(500).json({ error: 'Erro ao atualizar instância: ' + updateError.message });
    }

    // Se a instância tem um agente associado, configurar webhook no provedor externo
    if (updated.agent_id) {
      console.log('[DEBUG] Buscando agente externo vinculado:', updated.agent_id);
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('title, description, webhookUrl, agent_type')
        .eq('id', updated.agent_id)
        .single();
      console.log('[DEBUG] Agente externo encontrado:', agent);

      if (agentError) {
        console.error('[DEBUG] Erro ao buscar agente externo:', agentError);
        return res.status(500).json({ error: 'Erro ao buscar dados do agente: ' + agentError.message });
      }

      // Verificar se é realmente um agente externo
      if (agent.agent_type !== 'external') {
        return res.status(400).json({ error: 'External instances can only be linked to external agents' });
      }

      // Para instâncias externas, usar o webhookUrl do agente
      const webhookUrl = agent.webhookUrl;
      if (!webhookUrl) {
        console.error('[DEBUG] Agente externo sem webhookUrl');
        return res.status(500).json({ error: 'External agent has no webhook URL configured' });
      }
      console.log('[DEBUG] URL do webhook externo:', webhookUrl);

      // Configurar webhook no provedor externo
      try {
        console.log('[DEBUG] Configurando webhook da instância externa no provedor');
        
        // Buscar dados da instância para obter server_url e apikey
        const { data: instanceData, error: instanceError } = await supabase
          .from('whatsapp_instances')
          .select('id, instanceName, apikey, provider_type, provider_id')
          .eq('id', updated.id)
          .single();
        
        if (instanceError) {
          console.error('[DEBUG] Erro ao buscar dados da instância externa:', instanceError);
          return res.status(500).json({ error: 'Erro ao buscar dados da instância: ' + instanceError.message });
        }
        
        // Buscar dados do provedor externo
        const { data: provider, error: providerError } = await supabase
          .from('whatsapp_providers')
          .select('server_url, api_key')
          .eq('id', instanceData.provider_id)
          .single();
          
        if (providerError) {
          console.error('[DEBUG] Erro ao buscar provedor externo:', providerError);
          return res.status(500).json({ error: 'Erro ao buscar dados do provedor: ' + providerError.message });
        }
        
        console.log('[DEBUG] Server URL externo:', provider.server_url);
        console.log('[DEBUG] Instance Name externo:', instanceData.instanceName);
        
        const webhookConfig = {
          webhook: {
            enabled: true,
            url: webhookUrl,
            webhookByEvents: false,
            webhookBase64: false,
            events: [
              "MESSAGES_UPSERT"
            ]
          }
        };
        
        console.log('[DEBUG] Configuração do webhook externo:', JSON.stringify(webhookConfig, null, 2));
        
        const response = await fetch(`${provider.server_url}/webhook/set/${instanceData.instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': provider.api_key,
          },
          body: JSON.stringify(webhookConfig),
        });

        const responseText = await response.text();
        console.log('[DEBUG] Resposta do provedor externo:', response.status, responseText);
        
        // Tentar fazer parse da resposta para verificar se webhookBase64 foi aplicado
        try {
          const responseData = JSON.parse(responseText);
          console.log('[DEBUG] webhookBase64 na resposta:', responseData.webhookBase64);
        } catch (e) {
          console.log('[DEBUG] Não foi possível fazer parse da resposta JSON');
        }

        if (!response.ok) {
          return res.status(500).json({ 
            error: `Erro ao configurar webhook externo: ${response.status} - ${responseText}` 
          });
        }
        
        console.log('[DEBUG] Webhook externo configurado com sucesso');
      } catch (webhookError) {
        console.error('[DEBUG] Erro ao configurar webhook externo:', webhookError);
        return res.status(500).json({ 
          error: 'Erro ao configurar webhook externo: ' + (webhookError instanceof Error ? webhookError.message : 'Erro desconhecido') 
        });
      }
    }

    return res.status(200).json({ success: true, instance: updated });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 