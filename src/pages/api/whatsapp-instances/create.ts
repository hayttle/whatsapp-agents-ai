import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apikey = process.env.EVOLUTION_API_KEY;
  const evolutionUrl = `${process.env.EVOLUTION_API_URL}/instance/create`;

  if (!apikey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { tenantId, instanceName, integration, webhookByEvents, webhookBase64, webhookUrl, webhookEvents, msgCall, rejectCall, groupsIgnore, alwaysOnline, readMessages, readStatus, syncFullHistory } = req.body;
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId é obrigatório' });
    }
    if (!instanceName) {
      return res.status(400).json({ error: 'instanceName é obrigatório' });
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

    // Montar payload para Evolution
    const evolutionPayload: Record<string, unknown> = {
      instanceName,
      integration,
      msgCall,
      rejectCall,
      groupsIgnore,
      alwaysOnline,
      readMessages,
      readStatus,
      syncFullHistory,
      webhook: {
        url: webhookUrl,
        byEvents: webhookByEvents ?? false,
        base64: webhookBase64 ?? true,
        events: webhookEvents || [],
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
    const response = await fetch(evolutionUrl, {
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
    const instanceData = {
      id: data.instanceId || data.id, // id retornado pela API externa
      instanceName,
      integration,
      status: data.status || data.instance?.status || 'close',
      qrcode: data.qrcode || null,
      apikey: data.apikey || null,
      tenant_id: tenantId,
      webhookUrl,
      webhookEvents,
      webhookByEvents: webhookByEvents ?? false,
      webhookBase64: webhookBase64 ?? true,
      msgCall,
      rejectCall: rejectCall ?? false,
      groupsIgnore: groupsIgnore ?? true,
      alwaysOnline: alwaysOnline ?? false,
      readMessages: readMessages ?? false,
      readStatus: readStatus ?? false,
      syncFullHistory: syncFullHistory ?? false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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