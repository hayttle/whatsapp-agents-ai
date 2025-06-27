import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { hash } = req.body;
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
    return res.status(400).json({ error: 'Link invalido ou instância já conectada!' });
  }

  const apikey = process.env.EVOLUTION_API_KEY;
  const evolutionUrl = `${process.env.EVOLUTION_API_URL}/instance/connect/${encodeURIComponent(instance.instanceName)}`;

  const response = await fetch(evolutionUrl, {
    method: 'GET',
    headers: { 'apikey': apikey || '' },
  });
  const data = await response.json();

  // Extrair QR Code
  let qrCodeData = null;
  if (data.qrcode) qrCodeData = data.qrcode;
  else if (data.qr) qrCodeData = data.qr;
  else if (data.base64) qrCodeData = data.base64;
  else if (typeof data === 'string') qrCodeData = data;
  else if (data.response && data.response.qrcode) qrCodeData = data.response.qrcode;
  else if (data.response && data.response.qr) qrCodeData = data.response.qr;

  if (!qrCodeData) {
    return res.status(500).json({ error: 'Não foi possível gerar o QR Code.' });
  }

  // Salvar o JSON completo retornado da Evolution API
  await supabase
    .from('whatsapp_instances')
    .update({
      qrcode: JSON.stringify(data),
      updated_at: new Date().toISOString(),
    })
    .eq('public_hash', hash);

  return res.status(200).json({ qrcode: qrCodeData, instanceName: instance.instanceName });
} 