import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Autenticação
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore
            }
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const { tenantId } = req.query;
    if (!tenantId || typeof tenantId !== 'string') {
      return res.status(400).json({ error: 'ID do tenant é obrigatório' });
    }

    // Buscar dados do usuário para verificar permissões
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar permissões: apenas super_admin pode ver dados de outros tenants
    if (userData.role !== 'super_admin' && userData.tenant_id !== tenantId) {
      return res.status(403).json({ error: 'Sem permissão para acessar dados deste tenant' });
    }

    // Usar a função do banco para obter estatísticas
    const { data: stats, error: statsError } = await supabase
      .rpc('get_tenant_usage_stats', { p_tenant_id: tenantId });

    if (statsError) {
      return res.status(500).json({ error: 'Erro ao buscar estatísticas.' });
    }

    if (!stats || stats.length === 0) {
      return res.status(404).json({ error: 'Tenant não encontrado ou sem dados de uso' });
    }

    const usageStats = stats[0];

    return res.status(200).json({
      success: true,
      stats: {
        tenant_id: usageStats.tenant_id,
        tenant_name: usageStats.tenant_name,
        current_plan: usageStats.current_plan,
        plan_quantity: usageStats.plan_quantity,
        allowed_instances: usageStats.allowed_instances,
        current_instances: parseInt(usageStats.current_instances) || 0,
        remaining_instances: usageStats.remaining_instances,
        subscription_status: usageStats.subscription_status,
        next_due_date: usageStats.next_due_date,
        monthly_price: parseFloat(usageStats.monthly_price) || 0,
      }
    });

  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar estatísticas de uso.' });
  }
} 