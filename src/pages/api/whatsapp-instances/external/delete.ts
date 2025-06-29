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

    // instanceName pode vir do body (JSON) ou query
    const instanceName = req.body?.instanceName || req.query.instanceName;
    if (!instanceName) {
      return res.status(400).json({ error: 'instanceName é obrigatório' });
    }

    // Verificar se a instância externa existe e se o usuário tem permissão
    const { data: existingInstance } = await supabase
      .from('whatsapp_instances')
      .select('tenant_id, provider_type, provider_id')
      .eq('instanceName', instanceName)
      .single();

    if (!existingInstance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    // Verificar se é realmente uma instância externa
    if (existingInstance.provider_type !== 'externo') {
      return res.status(400).json({ error: 'This endpoint is only for external instances' });
    }

    if (userData.role !== 'super_admin' && existingInstance.tenant_id !== userData.tenant_id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Buscar dados do provedor externo
    const { data: provider, error: providerError } = await supabase
      .from('whatsapp_providers')
      .select('server_url, api_key')
      .eq('id', existingInstance.provider_id)
      .single();
      
    if (providerError) {
      return res.status(500).json({ error: 'Erro ao buscar dados do provedor: ' + providerError.message });
    }

    console.log('[DEBUG] Deletando instância externa:', instanceName);

    // Deletar no provedor externo
    const response = await fetch(`${provider.server_url}/instance/delete/${encodeURIComponent(instanceName)}`, {
      method: 'DELETE',
      headers: {
        'apikey': provider.api_key,
      },
    });
    
    const responseText = await response.text();
    console.log('[DEBUG] Resposta do provedor externo (delete):', response.status, responseText);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Erro ao deletar instância externa no provedor' });
    }

    // Deletar no banco local
    const { error: dbError } = await supabase.from('whatsapp_instances').delete().eq('instanceName', instanceName);
    if (dbError) {
      return res.status(500).json({ error: dbError.message || 'Erro ao deletar no banco local' });
    }
    
    console.log('[DEBUG] Instância externa deletada com sucesso:', instanceName);
    return res.status(200).json({ success: true });
  } catch (err: unknown) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erro inesperado' });
  }
} 