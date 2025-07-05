import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser } from '@/lib/supabase/api';
import { randomUUID } from 'crypto';
import { checkPlanLimits } from '@/lib/plans';
import { usageService } from '@/services/usageService';

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

    const { tenantId, instanceName } = req.body;
    
    // Verificar se o agente interno existe (se fornecido)
    if (req.body.agent_id) {
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id, agent_type')
        .eq('id', req.body.agent_id)
        .single();
      if (agentError) {
        return res.status(400).json({ error: 'Erro ao buscar agente vinculado.' });
      }
      if (agent.agent_type !== 'internal') {
        return res.status(400).json({ error: 'Internal instances can only be linked to internal agents' });
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

    // Verificar limites do plano
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_name, quantity')
      .eq('user_id', userData.id)
      .in('status', ['TRIAL', 'ACTIVE'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subscription?.plan_name) {
      const usageResponse = await usageService.getUsageStats(tenantId);
      if (usageResponse.success) {
        const limitCheck = checkPlanLimits(
          subscription.plan_name,
          usageResponse.usage,
          'create_instance',
          'native',
          subscription.quantity || 1
        );

        if (!limitCheck.allowed) {
          return res.status(403).json({ 
            error: limitCheck.reason || 'Limite do plano atingido',
            limitReached: true
          });
        }
      }
    }

    const apikey = process.env.EVOLUTION_API_KEY;
    if (!apikey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Validação de duplicidade: não permitir instância com mesmo nome para o mesmo tenant
    const { data: existingInstance, error: dupError } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('instanceName', instanceName)
      .is('provider_id', null);
      
    if (dupError) {
      return res.status(500).json({ error: dupError.message || 'Erro ao verificar duplicidade' });
    }
    if (existingInstance && existingInstance.length > 0) {
      return res.status(409).json({ error: 'Já existe uma instância com este nome. Por favor, escolha um nome diferente.' });
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
      return res.status(response.status).json({ error: data.error || data.response?.message?.[0] || 'Erro ao criar instância interna' });
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
      provider_type: 'nativo',
      provider_id: null,
      description: req.body.description || null,
      ...(req.body.agent_id ? { agent_id: req.body.agent_id } : {}),
    };

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