import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser } from '@/lib/supabase/api';
import { createServerClient } from '@supabase/ssr';

// Função para validar URL
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

// Função para validar se a URL do servidor está acessível
async function validateServerUrl(serverUrl: string): Promise<{ valid: boolean; error?: string }> {
  try {
    // Validar formato da URL
    if (!isValidUrl(serverUrl)) {
      return { valid: false, error: 'Erro, URL do servidor está incorreto.' };
    }

    // Tentar conectar ao servidor
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

    const response = await fetch(serverUrl, { 
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'WhatsApp-Agent-AI/1.0'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { valid: false, error: 'Erro, URL do servidor está incorreto.' };
    }

    return { valid: true };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { valid: false, error: 'Erro, URL do servidor está incorreto.' };
    }
    return { valid: false, error: 'Erro, URL do servidor está incorreto.' };
  }
}

// Função para validar API Key
async function validateApiKey(serverUrl: string, apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    // Construir URL para testar a API key
    let testUrl = serverUrl;
    if (!testUrl.endsWith('/')) testUrl += '/';
    testUrl += 'instance/fetchInstances';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: { 
        'apikey': apiKey,
        'User-Agent': 'WhatsApp-Agent-AI/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      return { valid: false, error: 'API Key inválida.' };
    }

    if (!response.ok) {
      return { valid: false, error: 'API Key inválida.' };
    }

    return { valid: true };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { valid: false, error: 'API Key inválida.' };
    }
    return { valid: false, error: 'API Key inválida.' };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Autenticar usuário
    const auth = await authenticateUser(req, res);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { userData } = auth;
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return []; }, setAll() {} } }
    );

    const { name, server_url, api_key, tenant_id } = req.body;
    
    // Validação dos campos obrigatórios
    if (!name || !server_url || !api_key) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos.' });
    }

    const isSuperAdmin = userData.role === 'super_admin';

    // Validação da URL do servidor
    const serverValidation = await validateServerUrl(server_url);
    if (!serverValidation.valid) {
      return res.status(400).json({ error: serverValidation.error });
    }

    // Validação da API Key
    const apiKeyValidation = await validateApiKey(server_url, api_key);
    if (!apiKeyValidation.valid) {
      return res.status(400).json({ error: apiKeyValidation.error });
    }

    // Se id for enviado, fazer update; senão, insert
    if (req.body.id) {
      const { id, ...updateData } = req.body;
      let query = supabase
        .from('whatsapp_providers')
        .update({ ...updateData, provider_type: 'evolution', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (!isSuperAdmin) {
        query = query.eq('tenant_id', userData.tenant_id);
        updateData.tenant_id = userData.tenant_id; // Garante que usuário comum não troque tenant
      }
      const { error } = await query;
      if (error) {
        if (error.message && error.message.includes('whatsapp_providers_tenant_id_name_key')) {
          return res.status(400).json({ error: 'Já existe um provedor com esse nome. Escolha outro nome.' });
        }
        return res.status(500).json({ error: error.message });
      }
      return res.status(200).json({ success: true });
    } else {
      const { error } = await supabase
        .from('whatsapp_providers')
        .insert({
          tenant_id: isSuperAdmin ? (tenant_id || userData.tenant_id) : userData.tenant_id,
          name,
          provider_type: 'evolution',
          server_url,
          api_key,
          updated_at: new Date().toISOString(),
        });
      if (error) {
        if (error.message && error.message.includes('whatsapp_providers_tenant_id_name_key')) {
          return res.status(400).json({ error: 'Já existe um provedor com esse nome. Escolha outro nome.' });
        }
        return res.status(500).json({ error: error.message });
      }
      return res.status(200).json({ success: true });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    return res.status(500).json({ error: errorMessage });
  }
} 