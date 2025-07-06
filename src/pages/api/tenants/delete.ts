import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser, createApiClient } from '@/lib/supabase/api';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
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
    const adminClient = createAdminClient();

    // Apenas super_admin pode deletar tenants
    if (userData.role !== 'super_admin') {
      return res.status(403).json({ error: 'Insufficient permissions - Only super_admin can delete tenants' });
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

    // Buscar todos os usuários vinculados a este tenant
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('tenant_id', id);

    if (usersError) {
      return res.status(500).json({ error: 'Error fetching tenant users: ' + usersError.message });
    }

    // Buscar estatísticas dos dados que serão deletados (apenas para tabelas que existem)
    const { data: instances, error: instancesError } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('tenant_id', id);

    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id')
      .eq('tenant_id', id);

    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('tenant_id', id);

    // prompt_models não tem tenant_id, então não precisa contar
    const promptModels = { data: [], error: null };

    // Preparar estatísticas para resposta
    const stats = {
      users: users?.length || 0,
      instances: instances?.length || 0,
      agents: agents?.length || 0,
      subscriptions: subscriptions?.length || 0,
      promptModels: 0, // prompt_models não tem tenant_id
    };

    // 1. Deletar usuários do Supabase Auth primeiro
    if (users && users.length > 0) {
      for (const user of users) {
        try {
          const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(user.id);
          // Se falhar, apenas continua
        } catch (error) {
          // Se falhar, apenas continua
        }
      }
    }

    // 2. Deletar o tenant (isso vai disparar o cascade delete no banco)
    const { error: deleteError } = await supabase
      .from('tenants')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(500).json({ error: 'Error deleting tenant: ' + deleteError.message });
    }

    // 3. Registrar log de auditoria (opcional, já que o trigger faz isso)
    return res.status(200).json({ 
      success: true, 
      message: `Tenant "${existingTenant.name}" deleted successfully with cascade delete`,
      deletedTenant: {
        id: existingTenant.id,
        name: existingTenant.name,
      },
      cascadeDeleteStats: stats
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 