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

    const { tenantId, instanceName, provider_type, provider_id } = req.body;
    // Verificar se o agente existe (se fornecido)
    if (req.body.agent_id) {
      const { error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('id', req.body.agent_id)
        .single();
      if (agentError) {
        return res.status(400).json({ error: 'Erro ao buscar agente vinculado.' });
      }
    }
    
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId é obrigatório' });
    }
    if (!instanceName) {
      return res.status(400).json({ error: 'instanceName é obrigatório' });
    }

    // Verificar permissões
    if (userData.role !== 'super_admin' && tenantId !== userData.tenant_id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const apikey = process.env.EVOLUTION_API_KEY;
    if (!apikey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Validação de duplicidade: não permitir instância com mesmo nome para o mesmo servidor WhatsApp (nativo ou externo)
    let dupQuery = supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('instanceName', instanceName);
    if (provider_type === 'externo' && provider_id) {
      dupQuery = dupQuery.eq('provider_id', provider_id);
    } else {
      dupQuery = dupQuery.is('provider_id', null);
    }
    const { data: existingInstance, error: dupError } = await dupQuery;
    if (dupError) {
      return res.status(500).json({ error: dupError.message || 'Erro ao verificar duplicidade' });
    }
    if (existingInstance && existingInstance.length > 0) {
      return res.status(409).json({ error: 'Já existe uma instância com este nome para este servidor Whatsapp. Por favor, escolha um nome diferente.' });
    }

    let instanceData: Record<string, unknown> = {};
    if (provider_type === 'externo' && provider_id) {
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
        groupIgnore: true
      };
      
      console.log('[DEBUG] Payload para criação de instância externa:', JSON.stringify(externalPayload, null, 2));
      
      // Criar na API do provedor externo
      const response = await fetch(provider.server_url.replace(/\/$/, '') + '/instance/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': provider.api_key,
        },
        body: JSON.stringify(externalPayload),
      });
      const data = await response.json();
      // LOG: Response recebido do provedor externo
      console.log('[WHATSAPP-INSTANCE][EXTERNAL] Response status:', response.status);
      console.log('[WHATSAPP-INSTANCE][EXTERNAL] Response body:', JSON.stringify(data));
      if (!response.ok) {
        return res.status(response.status).json({ error: data.error || data.response?.message?.[0] || 'Erro ao criar instância no provedor externo' });
    }
      const rawStatus = data.status || data.instance?.status || 'close';
      const normalizedStatus = rawStatus === 'open' ? 'open' : 'close';
      instanceData = {
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
        groupIgnore: true,
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
      // LOG: Payload salvo no banco
      console.log('[WHATSAPP-INSTANCE][EXTERNAL] instanceData salvo:', JSON.stringify(instanceData));
    } else {
    // Montar payload para Evolution com valores padrão
    const evolutionPayload: Record<string, unknown> = {
      instanceName,
      integration: "WHATSAPP-BAILEYS",
      msgCall: "",
      rejectCall: false,
      groupIgnore: true,
      alwaysOnline: false,
      readMessages: false,
      readStatus: false,
      syncFullHistory: false,
      webhook: {
        enabled: true,
        url: process.env.WEBHOOK_AGENT_URL || '',
        byEvents: false,
        base64: true,
        events: ["MESSAGES_UPSERT"],
      },
    };
    
    console.log('[DEBUG] Payload para criação de instância interna:', JSON.stringify(evolutionPayload, null, 2));
    
    // Remover campos undefined
    Object.keys(evolutionPayload).forEach(key => {
      if (evolutionPayload[key] === undefined) delete evolutionPayload[key];
    });
    // Limpar campos undefined do webhook
    if (evolutionPayload.webhook && typeof evolutionPayload.webhook === 'object') {
      Object.keys(evolutionPayload.webhook as { [key: string]: unknown }).forEach(key => {
        if ((evolutionPayload.webhook as { [key: string]: unknown })[key] === undefined) {
          delete (evolutionPayload.webhook as { [key: string]: unknown })[key];
        }
      });
    }

    // Criar na API externa
    const response = await fetch(process.env.EVOLUTION_API_URL + '/instance/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apikey,
      },
      body: JSON.stringify(evolutionPayload),
    });
    const data = await response.json();
    
    console.log('[WHATSAPP-INSTANCE][INTERNAL] Response status:', response.status);
    console.log('[WHATSAPP-INSTANCE][INTERNAL] Response body:', JSON.stringify(data));
    
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || data.response?.message?.[0] || 'Erro ao criar instância' });
    }

    // Salvar no banco de dados
    const rawStatus = data.status || data.instance?.status || 'close';
    // Normalizar status - qualquer status diferente de 'open' é tratado como 'close'
    const normalizedStatus = rawStatus === 'open' ? 'open' : 'close';
    
      instanceData = {
      id: data.instanceId || data.id, // id retornado pela API externa
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
      groupIgnore: true,
      alwaysOnline: false,
      readMessages: false,
      readStatus: false,
      syncFullHistory: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      public_hash: randomUUID(),
      provider_type: 'nativo',
      provider_id: null,
      description: req.body.description || null,
      ...(req.body.agent_id ? { agent_id: req.body.agent_id } : {}),
    };
    }
    // Salvar no banco de dados
    const { error: dbError } = await supabase.from('whatsapp_instances').insert(instanceData);
    if (dbError) {
      return res.status(500).json({ error: dbError.message || 'Erro ao salvar instância no banco' });
    }
    return res.status(201).json({ instance: instanceData });
  } catch (err: unknown) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erro inesperado' });
  }
} 