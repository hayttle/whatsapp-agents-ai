import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser, createApiClient } from '@/lib/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
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

    const { id, ...updateData } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'ID da instância é obrigatório' });
    }

    // Buscar instância existente
    const { data: existingInstance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('tenant_id, provider_type, agent_id, instanceName')
      .eq('id', id)
      .single();
    if (fetchError || !existingInstance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    if (userData.role !== 'super_admin' && existingInstance.tenant_id !== userData.tenant_id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Se está atualizando o agent_id, verificar se o agente existe e é do tipo correto
    if (updateData.agent_id !== undefined) {
      if (updateData.agent_id) {
        const { data: agent, error: agentError } = await supabase
          .from('agents')
          .select('agent_type, instance_id')
          .eq('id', updateData.agent_id)
          .single();

        if (agentError || !agent) {
          return res.status(404).json({ error: 'Agent not found' });
        }

        // Verificar se o agente já está vinculado a outra instância
        if (agent.instance_id && agent.instance_id !== id) {
          return res.status(400).json({ error: 'Agent is already linked to another instance' });
        }

        // Verificar compatibilidade de tipos
        if (existingInstance.provider_type === 'nativo' && agent.agent_type !== 'internal') {
          return res.status(400).json({ error: 'Native instances can only be linked to internal agents' });
        }
        if (existingInstance.provider_type === 'externo' && agent.agent_type !== 'external') {
          return res.status(400).json({ error: 'External instances can only be linked to external agents' });
        }
      }
    }

    // Atualizar instância
    const { data: updated, error: updateError } = await supabase
      .from('whatsapp_instances')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (updateError) {
      return res.status(500).json({ error: 'Erro ao atualizar instância: ' + updateError.message });
    }

    // Se está vinculando um agente, atualizar o instance_id do agente
    if (updateData.agent_id) {
      const { error: agentUpdateError } = await supabase
        .from('agents')
        .update({ instance_id: id })
        .eq('id', updateData.agent_id);
      
      if (agentUpdateError) {
        return res.status(500).json({ error: 'Erro ao vincular agente: ' + agentUpdateError.message });
      }
    }

    // Se está desvinculando um agente (agent_id mudou de um valor para null)
    if (existingInstance.agent_id && !updateData.agent_id) {
      const { error: agentUpdateError } = await supabase
        .from('agents')
        .update({ instance_id: null })
        .eq('id', existingInstance.agent_id);
      
      if (agentUpdateError) {
        return res.status(500).json({ error: 'Erro ao desvincular agente: ' + agentUpdateError.message });
      }
    }

    return res.status(200).json({ success: true, instance: updated });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 