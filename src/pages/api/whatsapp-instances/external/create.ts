import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser } from '@/lib/supabase/api';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

    const { tenantId, instanceName, provider_id } = req.body;
    
    // Verificar se o provider_type é 'externo' (obrigatório para esta API)
    if (req.body.provider_type !== 'externo') {
      return res.status(400).json({ error: 'Esta API é apenas para instâncias externas (provider_type deve ser "externo")' });
    }
    
    // Verificar se o agente externo existe (se fornecido)
    if (req.body.agent_id) {
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id, agent_type')
        .eq('id', req.body.agent_id)
        .single();
      if (agentError) {
        return res.status(400).json({ error: 'Erro ao buscar agente vinculado.' });
      }
      if (agent.agent_type !== 'external') {
        return res.status(400).json({ error: 'External instances can only be linked to external agents' });
      }
    }
    
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId é obrigatório' });
    }
    if (!instanceName) {
      return res.status(400).json({ error: 'instanceName é obrigatório' });
    }
    if (!provider_id) {
      return res.status(400).json({ error: 'provider_id é obrigatório para instâncias externas' });
    }

    // Verificar permissões
    if (userData.role !== 'super_admin' && tenantId !== userData.tenant_id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Validação de duplicidade: não permitir instância com mesmo nome para o mesmo provedor
    const { data: existingInstance, error: dupError } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('instanceName', instanceName)
      .eq('provider_id', provider_id);
      
    if (dupError) {
      return res.status(500).json({ error: dupError.message || 'Erro ao verificar duplicidade' });
    }
    if (existingInstance && existingInstance.length > 0) {
      return res.status(409).json({ error: 'Já existe uma instância com este nome para este provedor. Por favor, escolha um nome diferente.' });
    }

    // Buscar provedor externo
    const { data: provider, error: providerError } = await supabase
      .from('whatsapp_providers')
      .select('*')
      .eq('id', provider_id)
      .single();
    if (providerError || !provider) {
      return res.status(400).json({ error: 'Servidor WhatsApp externo não encontrado.' });
    }

    // Montar payload mínimo para provedor externo
    const externalPayload: Record<string, unknown> = {
      instanceName,
      integration: "WHATSAPP-BAILEYS",
      groupsIgnore: true
    };
    
    // Criar na API do provedor externo
    try {
      const response = await fetch(provider.server_url.replace(/\/$/, '') + '/instance/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': provider.api_key,
        },
        body: JSON.stringify(externalPayload),
      });
      
      let data;
      try {
        data = await response.json();
      } catch {
        const textData = await response.text();
        console.log('[WHATSAPP-INSTANCE][EXTERNAL] Resposta inválida do provedor:', textData);
        return res.status(response.status).json({ error: 'Resposta inválida do provedor externo' });
      }
      
      if (!response.ok) {
        return res.status(response.status).json({ 
          error: data.error || data.response?.message?.[0] || data.message || 'Erro ao criar instância no provedor externo' 
        });
      }

      const rawStatus = data.status || data.instance?.status || 'close';
      const normalizedStatus = rawStatus === 'open' ? 'open' : 'close';
      
      const instanceData = {
        id: data.instanceId || data.id || randomUUID(),
        instanceName,
        integration: "WHATSAPP-BAILEYS",
        status: normalizedStatus,
        qrcode: data.qrcode || null,
        apikey: data.apikey || null,
        tenant_id: tenantId,
        webhookEvents: ["MESSAGES_UPSERT"],
        byEvents: false,
        base64: true,
        msgCall: "",
        rejectCall: false,
        groupsIgnore: true,
        alwaysOnline: false,
        readMessages: false,
        readStatus: false,
        syncFullHistory: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        public_hash: randomUUID(),
        provider_type: 'externo',
        provider_id,
        description: req.body.description || null,
        ...(req.body.agent_id ? { agent_id: req.body.agent_id } : {}),
      };

      // Salvar no banco de dados
      const { error: dbError } = await supabase.from('whatsapp_instances').insert(instanceData);
      if (dbError) {
        return res.status(500).json({ error: dbError.message || 'Erro ao salvar instância no banco' });
      }
      
      console.log('[WHATSAPP-INSTANCE][EXTERNAL] Instância externa criada com sucesso:', instanceData.instanceName);
      return res.status(201).json({ instance: instanceData });
      
    } catch (fetchError) {
      console.log('[WHATSAPP-INSTANCE][EXTERNAL] Erro de conexão com provedor:', fetchError);
      return res.status(500).json({ error: 'Erro de conexão com o provedor externo: ' + (fetchError instanceof Error ? fetchError.message : 'Erro desconhecido') });
    }
  } catch (err: unknown) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erro inesperado' });
  }
} 