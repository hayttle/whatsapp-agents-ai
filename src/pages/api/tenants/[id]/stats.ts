import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser, createApiClient } from '@/lib/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Autenticar usuário via cookies
    const auth = await authenticateUser(req, res);
    
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
    }

    const { userData } = auth;
    const supabase = createApiClient(req, res);

    // Apenas super_admin pode ver estatísticas de tenants
    if (userData.role !== 'super_admin') {
      return res.status(403).json({ error: 'Insufficient permissions - Only super_admin can view tenant stats' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Verificar se o tenant existe
    const { data: existingTenant, error: fetchError } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('id', id)
      .single();

    if (fetchError || !existingTenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Buscar estatísticas em paralelo (apenas para tabelas que existem)
    const [
      { data: users, error: usersError },
      { data: instances, error: instancesError },
      { data: agents, error: agentsError },
      { data: subscriptions, error: subscriptionsError }
    ] = await Promise.all([
      supabase.from('users').select('id').eq('tenant_id', id),
      supabase.from('whatsapp_instances').select('id').eq('tenant_id', id),
      supabase.from('agents').select('id').eq('tenant_id', id),
      supabase.from('subscriptions').select('id').eq('tenant_id', id)
    ]);

    // prompt_models não tem tenant_id, então não precisa contar
    const promptModels = { data: [], error: null };

    // Verificar erros
    if (usersError || instancesError || agentsError || subscriptionsError) {
      return res.status(500).json({ error: 'Error fetching tenant statistics' });
    }

    const stats = {
      users: users?.length || 0,
      instances: instances?.length || 0,
      agents: agents?.length || 0,
      subscriptions: subscriptions?.length || 0,
      promptModels: 0, // prompt_models não tem tenant_id
    };

    return res.status(200).json({ 
      success: true, 
      stats,
      tenant: {
        id: existingTenant.id,
        name: existingTenant.name
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 