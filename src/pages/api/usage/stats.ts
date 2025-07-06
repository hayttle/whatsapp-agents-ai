import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser } from '@/lib/auth/helpers';
import { usageService } from '@/services/usageService';

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

    const { user } = auth;

    // Buscar estatísticas de uso
    const usageResponse = await usageService.getUsageStats(user.tenant_id ?? '');

    if (!usageResponse.success) {
      return res.status(500).json({ 
        error: usageResponse.error || 'Erro ao buscar estatísticas de uso' 
      });
    }

    return res.status(200).json({
      success: true,
      usage: usageResponse.usage,
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas de uso:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
} 