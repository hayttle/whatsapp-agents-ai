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

  const { agent_id, whatsapp_number, from, to, limit = 20, offset = 0, text } = req.query;

  if (!agent_id || typeof agent_id !== 'string') {
    return res.status(400).json({ error: 'agent_id é obrigatório' });
  }

  let query = supabase
    .from('messages')
    .select('*')
    .eq('agent_id', agent_id);

  if (whatsapp_number && typeof whatsapp_number === 'string') {
    query = query.eq('whatsapp_number', whatsapp_number);
  }
  if (from && typeof from === 'string') {
    query = query.gte('created_at', from);
  }
  if (to && typeof to === 'string') {
    query = query.lte('created_at', to);
  }
  if (text && typeof text === 'string') {
    query = query.ilike('text', `%${text}%`);
  }

  query = query.order('created_at', { ascending: false }).range(Number(offset), Number(offset) + Number(limit) - 1);

  const { data, error, count } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ messages: data, count });
} 