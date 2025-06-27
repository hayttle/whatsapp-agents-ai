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

    const { instanceName } = req.query;
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

    // Testar a API externa
    const evolutionUrl = `${process.env.EVOLUTION_API_URL}/instance/connect/${encodeURIComponent(instanceName)}`;
    
    const response = await fetch(evolutionUrl, {
      method: 'GET',
      headers: {
        'apikey': apikey,
      },
    });

    const data = await response.json();

    return res.status(200).json({
      success: true,
      externalApiStatus: response.status,
      externalApiData: data,
      url: evolutionUrl
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro inesperado';
    return res.status(500).json({ 
      success: false,
      error: errorMessage,
      stack: err instanceof Error ? err.stack : undefined
    });
  }
} 