import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser } from '@/lib/supabase/api';
import { createServerClient } from '@supabase/ssr';

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

    const { name, provider_type, server_url, api_key, tenant_id } = req.body;
    if (!name || !provider_type || !server_url || !api_key) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos.' });
    }
    const isSuperAdmin = userData.role === 'super_admin';

    // Validação: checar se a URL base responde
    try {
      const urlCheck = await fetch(server_url, { method: 'GET' });
      if (!urlCheck.ok) {
        return res.status(400).json({ error: 'URL do servidor inválida ou inacessível.' });
      }
    } catch {
      return res.status(400).json({ error: 'Não foi possível conectar ao servidor informado. Verifique se a URL está correta e acessível via HTTPS.' });
    }

    // Validação: checar se a API Key é válida
    let fetchInstancesUrl = server_url;
    if (!fetchInstancesUrl.endsWith('/')) fetchInstancesUrl += '/';
    fetchInstancesUrl += 'instance/fetchInstances';
    const apiCheck = await fetch(fetchInstancesUrl, {
      method: 'GET',
      headers: { 'apikey': api_key },
    });
    if (apiCheck.status === 401) {
      return res.status(400).json({ error: 'API Key inválida para o servidor informado.' });
    }
    if (!apiCheck.ok) {
      return res.status(400).json({ error: 'Erro ao validar API Key no servidor.' });
    }

    // Se id for enviado, fazer update; senão, insert
    if (req.body.id) {
      const { id, ...updateData } = req.body;
      let query = supabase
        .from('whatsapp_providers')
        .update({ ...updateData, updated_at: new Date().toISOString() })
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
          provider_type,
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