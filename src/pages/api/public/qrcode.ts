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

  // Buscar status real na Evolution API
  const apikey = process.env.EVOLUTION_API_KEY;
  const statusUrl = `${process.env.EVOLUTION_API_URL}/instance/connectionState/${encodeURIComponent(instance.instanceName)}`;
  const statusRes = await fetch(statusUrl, { headers: { apikey: apikey || '' } });
  const statusData = await statusRes.json();
  let realStatus = statusData.status || statusData.state || (statusData.instance && (statusData.instance.status || statusData.instance.state)) || 'close';

  // Normalizar status
  realStatus = realStatus === 'open' ? 'open' : 'close';

  // Atualizar status no banco local
  await supabase
    .from('whatsapp_instances')
    .update({ status: realStatus, updated_at: new Date().toISOString() })
    .eq('public_hash', hash);

  // Agora use realStatus para decidir se pode gerar QR Code
  if (realStatus !== 'close') {
    return res.status(200).json({ instanceName: instance.instanceName, status: realStatus });
  }

  // Buscar QR Code diretamente na Evolution API
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