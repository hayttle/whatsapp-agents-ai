import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apikey = process.env.EVOLUTION_API_KEY;
  if (!apikey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const instanceName = req.query.instanceName || req.body?.instanceName;
  if (!instanceName || typeof instanceName !== 'string') {
    return res.status(400).json({ error: 'instanceName é obrigatório' });
  }

  try {
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

    // Atualizar status no banco local, se encontrado
    if (status) {
      await supabase
        .from('whatsapp_instances')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('instanceName', instanceName);
    }

    return res.status(200).json({ status, evolution: data });
  } catch (err: unknown) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erro inesperado' });
  }
} 