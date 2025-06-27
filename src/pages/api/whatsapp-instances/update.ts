import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser, createApiClient } from '@/lib/supabase/api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
    const apiSupabase = createApiClient(req, res);

    const apikey = process.env.EVOLUTION_API_KEY;
    const evolutionApiUrl = process.env.EVOLUTION_API_URL;
    if (!apikey) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    if (!evolutionApiUrl) {
      return res.status(500).json({ error: 'EVOLUTION_API_URL not configured' });
    }

    const { id, integration, msgCall, webhookUrl, webhookEvents, webhookByEvents, webhookBase64, rejectCall, groupsIgnore, alwaysOnline, readMessages, readStatus, syncFullHistory } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'id é obrigatório' });
    }

    // Buscar o nome da instância no banco
    const { data: instanceData, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('instanceName, tenant_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !instanceData) {
      return res.status(404).json({ error: 'Instância não encontrada' });
    }

    // Verificar permissões
    if (userData.role !== 'super_admin' && instanceData.tenant_id !== userData.tenant_id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const instanceName = instanceData.instanceName;

    // 1. Atualizar configurações na API externa
    const settingsResponse = await fetch(`${evolutionApiUrl}/settings/set/${encodeURIComponent(instanceName)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apikey,
      },
      body: JSON.stringify({
        rejectCall,
        msgCall,
        groupsIgnore,
        alwaysOnline,
        readMessages,
        readStatus,
        syncFullHistory
      }),
    });

    if (!settingsResponse.ok) {
      const settingsError = await settingsResponse.json().catch(() => ({}));
      return res.status(settingsResponse.status).json({ 
        error: settingsError.error || settingsError.message || 'Erro ao atualizar configurações na API externa' 
      });
    }

    // 2. Atualizar webhook na API externa
    const webhookResponse = await fetch(`${evolutionApiUrl}/webhook/set/${encodeURIComponent(instanceName)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apikey,
      },
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: process.env.WEBHOOK_AGENT_URL || "",
          headers: {
            "Content-Type": "application/json"
          },
          byEvents: webhookByEvents ?? false,
          base64: webhookBase64 ?? true,
          events: Array.isArray(webhookEvents) ? webhookEvents : [],
        }
      }),
    });

    const webhookResponseBody = await webhookResponse.text();

    if (!webhookResponse.ok) {
      let webhookError;
      try {
        webhookError = JSON.parse(webhookResponseBody);
      } catch {
        webhookError = { message: webhookResponseBody };
      }
      return res.status(webhookResponse.status).json({ 
        error: webhookError.error || webhookError.message || 'Erro ao atualizar webhook na API externa' 
      });
    }

    // Verificar se a resposta é 201 (sucesso)
    if (webhookResponse.status !== 201) {
      return res.status(webhookResponse.status).json({ 
        error: 'Resposta inesperada da API externa ao atualizar webhook' 
      });
    }

    // 3. Atualizar no banco local
    const { error: dbError } = await supabase.from('whatsapp_instances').update({
      integration,
      msgCall,
      webhookUrl,
      webhookEvents,
      webhookByEvents: webhookByEvents ?? false,
      webhookBase64: webhookBase64 ?? true,
      rejectCall,
      groupsIgnore,
      alwaysOnline,
      readMessages,
      readStatus,
      syncFullHistory,
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    if (dbError) {
      return res.status(500).json({ error: dbError.message || 'Erro ao atualizar instância no banco' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro inesperado';
    return res.status(500).json({ error: errorMessage });
  }
} 