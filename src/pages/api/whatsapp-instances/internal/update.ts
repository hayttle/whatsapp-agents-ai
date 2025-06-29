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
    console.log('[DEBUG] Buscando instância interna:', id);
    const { data: existingInstance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('tenant_id, provider_type')
      .eq('id', id)
      .single();
    console.log('[DEBUG] Instância interna encontrada:', existingInstance);
    if (fetchError || !existingInstance) {
      console.error('[DEBUG] Erro ao buscar instância interna:', fetchError);
      return res.status(404).json({ error: 'Instance not found' });
    }

    // Verificar se é realmente uma instância interna
    if (existingInstance.provider_type !== 'nativo') {
      return res.status(400).json({ error: 'This endpoint is only for internal instances' });
    }

    if (userData.role !== 'super_admin' && existingInstance.tenant_id !== userData.tenant_id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Atualizar instância
    console.log('[DEBUG] Atualizando instância interna:', id, updateData);
    const { data: updated, error: updateError } = await supabase
      .from('whatsapp_instances')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    console.log('[DEBUG] Instância interna atualizada:', updated);
    if (updateError) {
      console.error('[DEBUG] Erro ao atualizar instância interna:', updateError);
      return res.status(500).json({ error: 'Erro ao atualizar instância: ' + updateError.message });
    }

    // Se a instância tem um agente associado, configurar webhook na Evolution API
    if (updated.agent_id) {
      console.log('[DEBUG] Buscando agente interno vinculado:', updated.agent_id);
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('title, description, webhookUrl, agent_type')
        .eq('id', updated.agent_id)
        .single();
      console.log('[DEBUG] Agente interno encontrado:', agent);

      if (agentError) {
        console.error('[DEBUG] Erro ao buscar agente interno:', agentError);
        return res.status(500).json({ error: 'Erro ao buscar dados do agente: ' + agentError.message });
      }

      // Verificar se é realmente um agente interno
      if (agent.agent_type !== 'internal') {
        return res.status(400).json({ error: 'Internal instances can only be linked to internal agents' });
      }

      // Para instâncias internas, sempre usar a variável de ambiente
      const webhookUrl = process.env.WEBHOOK_AGENT_URL;
      if (!webhookUrl) {
        console.error('[DEBUG] WEBHOOK_AGENT_URL não configurada');
        return res.status(500).json({ error: 'Internal webhook URL not configured' });
      }
      console.log('[DEBUG] URL do webhook interno (do .env):', webhookUrl);

      // Verificar se a API key está configurada
      const apiKey = process.env.EVOLUTION_API_KEY;
      if (!apiKey) {
        console.error('[DEBUG] EVOLUTION_API_KEY não configurada');
        return res.status(500).json({ error: 'Evolution API key not configured' });
      }
      console.log('[DEBUG] API Key encontrada:', apiKey ? 'Sim' : 'Não');

      // Configurar webhook na Evolution API
      try {
        console.log('[DEBUG] Configurando webhook da instância interna na Evolution API');
        
        const webhookConfig = {
          webhook: {
            enabled: true,
            url: webhookUrl,
            webhookByEvents: false,
            webhookBase64: true,
            events: ["MESSAGES_UPSERT"]
          }
        };
        
        console.log('[DEBUG] Configuração do webhook interno:', webhookConfig);
        
        const response = await fetch(`${process.env.EVOLUTION_API_URL}/webhook/set/${updated.instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
          },
          body: JSON.stringify(webhookConfig),
        });

        const responseText = await response.text();
        console.log('[DEBUG] Resposta da Evolution API (interno):', response.status, responseText);

        if (!response.ok) {
          return res.status(500).json({ 
            error: `Erro ao configurar webhook interno: ${response.status} - ${responseText}` 
          });
        }
      } catch (webhookError) {
        console.error('[DEBUG] Erro ao configurar webhook interno:', webhookError);
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