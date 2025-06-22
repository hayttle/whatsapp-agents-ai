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

  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('id, nome, email, cpf_cnpj, telefone')
      .order('nome', { ascending: true });
      
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ tenants: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro inesperado' });
  }
} 