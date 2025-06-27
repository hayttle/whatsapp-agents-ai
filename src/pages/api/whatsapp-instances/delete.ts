import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser } from '@/lib/supabase/api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
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

  // instanceName pode vir do body (JSON) ou query
  const instanceName = req.body?.instanceName || req.query.instanceName;
  if (!instanceName) {
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

    // Deletar na API externa
    const response = await fetch(`${process.env.EVOLUTION_API_URL}/instance/delete/${encodeURIComponent(instanceName)}`, {
      method: 'DELETE',
      headers: {
        'apikey': apikey,
      },
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: data.error || data.message || 'Erro ao deletar na API externa' });
    }

    // Deletar no banco local
    const { error: dbError } = await supabase.from('whatsapp_instances').delete().eq('instanceName', instanceName);
    if (dbError) {
      return res.status(500).json({ error: dbError.message || 'Erro ao deletar no banco local' });
    }
    return res.status(200).json({ success: true });
  } catch (err: unknown) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erro inesperado' });
  }
} 