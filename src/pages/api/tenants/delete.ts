import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser, createApiClient } from '@/lib/supabase/api';

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

    // Verificar se há usuários vinculados a este tenant
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', id);

    if (usersError) {
      return res.status(500).json({ error: 'Error checking tenant dependencies' });
    }

    if (users && users.length > 0) {
      return res.status(400).json({ 
        error: `Cannot delete tenant "${existingTenant.name}" - It has ${users.length} user(s) associated with it. Please remove or reassign all users first.`
      });
    }

    // Verificar se há instâncias vinculadas a este tenant
    const { data: instances, error: instancesError } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('tenant_id', id);

    if (instancesError) {
      return res.status(500).json({ error: 'Error checking tenant dependencies' });
    }

    if (instances && instances.length > 0) {
      return res.status(400).json({ 
        error: `Cannot delete tenant "${existingTenant.name}" - It has ${instances.length} WhatsApp instance(s) associated with it. Please remove all instances first.`
      });
    }

    // Verificar se há agentes vinculados a este tenant
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id')
      .eq('tenant_id', id);

    if (agentsError) {
      return res.status(500).json({ error: 'Error checking tenant dependencies' });
    }

    if (agents && agents.length > 0) {
      return res.status(400).json({ 
        error: `Cannot delete tenant "${existingTenant.name}" - It has ${agents.length} agent(s) associated with it. Please remove all agents first.`
      });
    }

    // Deletar tenant
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Error deleting tenant: ' + error.message });
    }

    return res.status(200).json({ success: true, message: `Tenant "${existingTenant.name}" deleted successfully` });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 