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
  if (!apikey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { tenantId, instanceName, integration, webhookByEvents, webhookBase64 } = req.body;
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
      .ilike('name', instanceName);
    if (checkErrorGlobal) {
      return res.status(500).json({ error: checkErrorGlobal.message || 'Erro ao verificar duplicidade global' });
    }
    if (existingGlobal && existingGlobal.length > 0) {
      return res.status(409).json({ error: 'Já existe uma instância com este nome na plataforma. Por favor, escolha um nome diferente.' });
    }

    // Criar na API externa
    const response = await fetch('https://evolution.hayttle.dev/instance/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apikey,
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || data.response?.message?.[0] || 'Erro ao criar instância' });
    }

    // Salvar no banco de dados
    const instanceData = {
      id: data.instanceId || data.id, // id retornado pela API externa
      name: instanceName,
      integration,
      status: data.status || data.instance?.status || 'pending',
      qrcode: data.qrcode || null,
      apikey: data.apikey || null,
      tenant_id: tenantId,
      webhookUrl: req.body.webhook?.url || null,
      webhookEvents: req.body.webhook?.events || null,
      webhookByEvents: webhookByEvents ?? false,
      webhookBase64: webhookBase64 ?? true,
      msgCall: req.body.msgCall || null,
      rejectCall: req.body.rejectCall ?? false,
      groupsIgnore: req.body.groupsIgnore ?? true,
      alwaysOnline: req.body.alwaysOnline ?? false,
      readMessages: req.body.readMessages ?? false,
      readStatus: req.body.readStatus ?? false,
      syncFullHistory: req.body.syncFullHistory ?? false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error: dbError } = await supabase.from('whatsapp_instances').insert(instanceData);
    if (dbError) {
      return res.status(500).json({ error: dbError.message || 'Erro ao salvar instância no banco' });
    }
    return res.status(201).json({ instance: instanceData });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro inesperado' });
  }
} 