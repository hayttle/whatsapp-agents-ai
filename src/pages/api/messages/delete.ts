import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth/helpers';

export default withAuth(async (req, res) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messageId } = req.body;

    if (!messageId) {
      return res.status(400).json({ error: 'Message ID is required' });
    }

    // TODO: Implementar lógica de exclusão de mensagem
    // Por enquanto, retornar sucesso
    return res.status(200).json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
}); 