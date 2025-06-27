import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser, createApiClient } from '@/lib/supabase/api';

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
    const apiSupabase = createApiClient(req, res);

    const apikey = process.env.EVOLUTION_API_KEY;
    if (!apikey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const { instanceName } = req.body;
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

    // 1. Chamar a API externa para deslogar a instância
    const response = await fetch(`${process.env.EVOLUTION_API_URL}/instance/logout/${encodeURIComponent(instanceName)}`, {
      method: 'DELETE',
      headers: { 'apikey': apikey },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: errorData.error || 'Erro ao desconectar instância na API externa' });
    }
    
    // 2. Atualizar a instância no nosso banco para 'close'
    const { error: dbError } = await supabase
      .from('whatsapp_instances')
      .update({ 
          status: 'close', 
          qrcode: null, // Limpar o QR code antigo
          updated_at: new Date().toISOString() 
        })
      .eq('instanceName', instanceName);

    if (dbError) {
      // Mesmo com erro no nosso DB, a instância foi desconectada na API externa, então retornamos sucesso.
    }

    // 3. Retornar sucesso
    return res.status(200).json({ success: true, message: 'Instância desconectada com sucesso.' });

  } catch (err: unknown) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erro inesperado' });
  }
} 