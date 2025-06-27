import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser, createApiClient } from '@/lib/supabase/api';
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
    const apiSupabase = createApiClient(req, res);

    const { tenantId, instanceName } = req.body;
    const finalWebhookUrl = process.env.WEBHOOK_AGENT_URL || '';
    
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

    // Verificar duplicidade de nome na plataforma inteira (todas empresas)
    const { data: existingGlobal, error: checkErrorGlobal } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .ilike('instanceName', instanceName);
    if (checkErrorGlobal) {
      return res.status(500).json({ error: checkErrorGlobal.message || 'Erro ao verificar duplicidade global' });
    }
    if (existingGlobal && existingGlobal.length > 0) {
      return res.status(409).json({ error: 'Já existe uma instância com este nome na plataforma. Por favor, escolha um nome diferente.' });
    }

    // Montar payload para Evolution com valores padrão
    const evolutionPayload: Record<string, unknown> = {
      instanceName,
      integration: "WHATSAPP-BAILEYS",
      msgCall: "",
      rejectCall: false,
      groupsIgnore: true,
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
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || data.response?.message?.[0] || 'Erro ao criar instância' });
    }

    // Salvar no banco de dados
    const rawStatus = data.status || data.instance?.status || 'close';
    // Normalizar status - qualquer status diferente de 'open' é tratado como 'close'
    const normalizedStatus = rawStatus === 'open' ? 'open' : 'close';
    
    const instanceData = {
      id: data.instanceId || data.id, // id retornado pela API externa
      instanceName,
      integration: "WHATSAPP-BAILEYS",
      status: normalizedStatus,
      qrcode: data.qrcode || null,
      apikey: data.apikey || null,
      tenant_id: tenantId,
      webhookUrl: finalWebhookUrl,
      webhookEvents: ["MESSAGES_UPSERT"],
      webhookByEvents: false,
      webhookBase64: true,
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
    };
    const { error: dbError } = await supabase.from('whatsapp_instances').insert(instanceData);
    if (dbError) {
      return res.status(500).json({ error: dbError.message || 'Erro ao salvar instância no banco' });
    }
    return res.status(201).json({ instance: instanceData });
  } catch (err: unknown) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erro inesperado' });
  }
} 