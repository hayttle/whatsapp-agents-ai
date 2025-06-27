import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser } from '@/lib/supabase/api';
import { createServerClient } from '@supabase/ssr';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    // Buscar provedores do tenant
    const { data, error } = await supabase
      .from('whatsapp_providers')
      .select('*')
      .eq('tenant_id', userData.tenant_id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ providers: data || [] });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    return res.status(500).json({ error: errorMessage });
  }
} 