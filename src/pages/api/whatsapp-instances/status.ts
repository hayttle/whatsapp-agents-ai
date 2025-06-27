import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser } from '@/lib/supabase/api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Autenticar usuário via cookies
    const auth = await authenticateUser(req, res);
    
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
    }

    const { userData } = auth;

    const apikey = process.env.EVOLUTION_API_KEY;
    if (!apikey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const instanceName = req.query.instanceName || req.body?.instanceName;
    if (!instanceName || typeof instanceName !== 'string') {
      return res.status(400).json({ error: 'instanceName é obrigatório' });
    }

    // Verificar se a instância existe e se o usuário tem permissão
    const { data: existingInstance } = await supabase
      .from('whatsapp_instances')
      .select('tenant_id')
      .eq('instanceName', instanceName)
      .single();

    if (!existingInstance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    if (userData.role !== 'super_admin' && existingInstance.tenant_id !== userData.tenant_id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const url = `${process.env.EVOLUTION_API_URL}/instance/connectionState/${encodeURIComponent(instanceName)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'apikey': apikey },
    });
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || data.message || 'Erro ao consultar status na Evolution' });
    }

    // Extrair status da resposta
    let status = data.status || data.state || (data.instance && (data.instance.status || data.instance.state));
    if (!status && typeof data === 'string') status = data;

    // Normalizar status - qualquer status diferente de 'open' é tratado como 'close'
    const normalizedStatus = status === 'open' ? 'open' : 'close';

    // Atualizar status no banco local, se encontrado
    if (status) {
      await supabase
        .from('whatsapp_instances')
        .update({ status: normalizedStatus, updated_at: new Date().toISOString() })
        .eq('instanceName', instanceName);

      // Se status open, buscar o número conectado e atualizar no banco
      if (normalizedStatus === 'open') {
        try {
          const fetchUrl = `${process.env.EVOLUTION_API_URL}/instance/fetchInstances`;
          const fetchRes = await fetch(fetchUrl, {
            method: 'GET',
            headers: { 'apikey': apikey },
          });
          const fetchData = await fetchRes.json();
          if (Array.isArray(fetchData)) {
            const found = fetchData.find((item) => item.name === instanceName);
            let phoneNumber = null;
            if (found?.ownerJid) {
              phoneNumber = found.ownerJid.replace(/@s\.whatsapp\.net$/, '');
            }
            if (phoneNumber) {
              await supabase
                .from('whatsapp_instances')
                .update({ phone_number: phoneNumber })
                .eq('instanceName', instanceName);
            }
          }
        } catch {
          // Não interrompe o fluxo se falhar
        }
      }
    }

    return res.status(200).json({ status: normalizedStatus, evolution: data });
  } catch (err: unknown) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erro inesperado' });
  }
} 