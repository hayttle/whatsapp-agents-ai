import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser } from '@/lib/auth/helpers';
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

    const { user } = auth;

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
    if (user.role !== 'super_admin' && tenantId !== user.tenant_id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Verificar se o tenant tem acesso (trial ativo ou assinatura paga)
    const { data: activeSubscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('tenant_id', user.tenant_id)
      .in('status', ['ACTIVE', 'PENDING'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (activeSubscription) {
      // Tem assinatura paga ativa
    } else {
      // Verificar trial
      const { data: trial } = await supabase
        .from('trials')
        .select('status, expires_at')
        .eq('tenant_id', user.tenant_id)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!trial) {
        return res.status(403).json({ error: 'Acesso negado. Trial expirado ou sem assinatura ativa.' });
      }

      const now = new Date();
      const expiresAt = new Date(trial.expires_at);
      
      if (expiresAt <= now) {
        // Trial expirado, atualizar status
        await supabase
          .from('trials')
          .update({ status: 'EXPIRED' })
          .eq('tenant_id', user.tenant_id)
          .eq('status', 'ACTIVE');
        
        return res.status(403).json({ error: 'Trial expirado. Renove sua assinatura para continuar.' });
      }
    }

    // Verificar limites do plano considerando todas as assinaturas ativas
    const limitCheck = await usageService.checkPlanLimits(tenantId, 'create_instance', 'external');
    
    if (!limitCheck.success) {
      return res.status(500).json({ 
        error: limitCheck.error || 'Erro ao verificar limites do plano',
        limitReached: false
      });
    }

    if (!limitCheck.allowed) {
      return res.status(403).json({ 
        error: limitCheck.reason || 'Limite do plano atingido',
        limitReached: true,
        totalLimits: limitCheck.totalLimits
      });
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
      
      return res.status(201).json({ instance: instanceData });
      
    } catch {
      return res.status(500).json({ error: 'Erro de conexão com o provedor externo' });
    }
  } catch (err: unknown) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erro inesperado' });
  }
} 