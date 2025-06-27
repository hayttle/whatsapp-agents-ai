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

  const { hash } = req.query;
  if (!hash || typeof hash !== 'string') {
    return res.status(400).json({ error: 'Hash inválida' });
  }

  // Buscar instância pela hash
  const { data: instance, error } = await supabase
    .from('whatsapp_instances')
    .select('instanceName, status')
    .eq('public_hash', hash)
    .single();

  if (error || !instance) {
    return res.status(404).json({ error: 'Link invalido!' });
  }

  if (instance.status !== 'close') {
    return res.status(400).json({ error: 'Link invalido!' });
  }

  // Montar baseUrl absoluta
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  // Buscar QR Code da instância (reutilizando endpoint interno)
  const response = await fetch(`${baseUrl}/api/whatsapp-instances/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instanceName: instance.instanceName, forceRegenerate: true }),
  });
  const data = await response.json();
  if (!response.ok || !data.base64) {
    return res.status(500).json({ error: 'Não foi possível gerar o QR Code.' });
  }

  return res.status(200).json({ qrcode: data.base64 });
} 