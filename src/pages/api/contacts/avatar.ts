import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { number, instance } = req.body;
  
  if (!number || !instance) {
    return res.status(400).json({ error: 'number e instance são obrigatórios' });
  }

  try {
    const evolutionUrl = `${process.env.EVOLUTION_API_URL}/chat/fetchProfilePictureUrl/${instance}`;
    const requestBody = JSON.stringify({ number });
    
    const response = await fetch(evolutionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.EVOLUTION_API_KEY!,
      },
      body: requestBody,
    });
    
    const data = await response.json();
    
    if (!data.profilePictureUrl) {
      return res.status(404).json({ error: 'Avatar não encontrado' });
    }
    
    return res.status(200).json({ avatar: data.profilePictureUrl });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar avatar' });
  }
} 