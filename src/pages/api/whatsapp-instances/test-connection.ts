import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apikey = process.env.EVOLUTION_API_KEY;
  if (!apikey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const { instanceName } = req.query;
  if (!instanceName || typeof instanceName !== 'string') {
    return res.status(400).json({ error: 'instanceName é obrigatório' });
  }

  try {
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