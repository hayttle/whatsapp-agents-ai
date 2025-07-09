import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthResult } from '@/lib/auth/helpers';
import { usageService } from '@/services/usageService';

async function handler(req: NextApiRequest, res: NextApiResponse, auth: AuthResult) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user } = auth;
    const { tenantId } = req.query;

    // Verificar permissões
    if (!user.role || !['user', 'super_admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }

    // Se não for super_admin, só pode ver dados do próprio tenant
    const targetTenantId = user.role === 'super_admin' && tenantId ? String(tenantId) : (user.tenant_id || '');

    // Buscar estatísticas de uso
    const usageResponse = await usageService.getUsageStats(targetTenantId);
    if (!usageResponse.success) {
      return res.status(500).json({ error: usageResponse.error || 'Erro ao buscar estatísticas de uso' });
    }

    // Buscar limites totais
    const totalLimitsResponse = await usageService.getTotalLimits(targetTenantId);
    if (!totalLimitsResponse.success) {
      return res.status(500).json({ error: totalLimitsResponse.error || 'Erro ao buscar limites totais' });
    }

    // Calcular porcentagens de uso
    const usagePercentage = await usageService.getTotalUsagePercentage(targetTenantId);

    return res.status(200).json({
      success: true,
      usage: usageResponse.usage,
      totalLimits: totalLimitsResponse.totalLimits,
      usagePercentage,
    });

  } catch (error) {
    console.error('[Usage Stats] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Erro interno: ' + errorMessage });
  }
}

export default withAuth(handler); 