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

    // Verificar se a instância interna existe e se o usuário tem permissão
    const { data: existingInstance } = await supabase
      .from('whatsapp_instances')
      .select('tenant_id, provider_type')
      .eq('instanceName', instanceName)
      .single();

    if (!existingInstance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    // Verificar se é realmente uma instância interna
    if (existingInstance.provider_type !== 'nativo') {
      return res.status(400).json({ error: 'This endpoint is only for internal instances' });
    }

    if (userData.role !== 'super_admin' && existingInstance.tenant_id !== userData.tenant_id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    console.log('[DEBUG] Deletando instância interna:', instanceName);

    // Deletar na Evolution API
    const response = await fetch(`${process.env.EVOLUTION_API_URL}/instance/delete/${encodeURIComponent(instanceName)}`, {
      method: 'DELETE',
      headers: {
        'apikey': apikey,
      },
    });
    
    const responseText = await response.text();
    console.log('[DEBUG] Resposta da Evolution API (delete interno):', response.status, responseText);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Erro ao deletar instância interna na Evolution API' });
    }

    // Deletar no banco local
    const { error: dbError } = await supabase.from('whatsapp_instances').delete().eq('instanceName', instanceName);
    if (dbError) {
      return res.status(500).json({ error: dbError.message || 'Erro ao deletar no banco local' });
    }
    
    console.log('[DEBUG] Instância interna deletada com sucesso:', instanceName);
    return res.status(200).json({ success: true });
  } catch (err: unknown) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erro inesperado' });
  }
} 