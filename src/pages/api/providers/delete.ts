import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser } from '@/lib/supabase/api';
import { createServerClient } from '@supabase/ssr';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
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

    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'ID do provedor não informado.' });
    }

    // Verificar se o provedor existe e se o usuário tem permissão para deletá-lo
    let query = supabase.from('whatsapp_providers').select('id, tenant_id').eq('id', id);
    
    // Se não for super_admin, filtrar apenas provedores do próprio tenant
    if (userData.role !== 'super_admin') {
      query = query.eq('tenant_id', userData.tenant_id);
    }
    
    const { data: provider, error: fetchError } = await query.single();

    if (fetchError || !provider) {
      return res.status(404).json({ error: 'Provedor não encontrado ou sem permissão para deletar.' });
    }

    // Deletar o provedor
    const { error } = await supabase
      .from('whatsapp_providers')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Error deleting provider: ' + error.message });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 