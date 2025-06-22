import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const apikey = process.env.EVOLUTION_API_KEY;

// Helper para sincronizar o status de uma única instância
const syncInstanceStatus = async (instance: any) => {
  if (!apikey) {
    console.error("API key não configurada para sincronização de status.");
    return instance;
  }

  try {
    const response = await fetch(`https://evolution.hayttle.dev/instance/connectionState/${encodeURIComponent(instance.name)}`, {
      method: 'GET',
      headers: { 'apikey': apikey },
    });

    if (response.ok) {
      const data = await response.json();
      const newStatus = data.instance?.state;

      if (newStatus && newStatus !== instance.status) {
        // O status mudou, atualiza nosso banco
        const { data: updatedInstance, error } = await supabase
          .from('whatsapp_instances')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', instance.id)
          .select('*')
          .single();
        
        if (error) {
          console.error(`Erro ao atualizar status para ${instance.name}:`, error);
          return instance; // Retorna o original em caso de erro
        }
        return updatedInstance; // Retorna a instância atualizada
      }
    } else if (response.status === 404) {
        // Se a instância não existe na API externa, marcamos como 'close'
        if (instance.status !== 'close') {
            const { data: updatedInstance, error } = await supabase
                .from('whatsapp_instances')
                .update({ status: 'close', updated_at: new Date().toISOString() })
                .eq('id', instance.id)
                .select('*')
                .single();
            if (error) console.error(`Erro ao fechar instância ${instance.name}:`, error);
            return updatedInstance || instance;
        }
    }
  } catch (e) {
    console.error(`Exceção durante a sincronização de status para ${instance.name}:`, e);
  }
  return instance; // Retorna a instância original se nada mudar ou em caso de falha
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tenantId } = req.query;

  try {
    // 1. Busca os dados do nosso banco
    let query = supabase.from('whatsapp_instances').select('*');
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    const { data: instances, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // 2. Sincroniza o status de TODAS as instâncias para garantir consistência
    const syncPromises = instances.map(instance => syncInstanceStatus(instance));

    const syncedInstances = await Promise.all(syncPromises);

    // 3. Retorna a lista atualizada
    return res.status(200).json({ instances: syncedInstances });
    
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro inesperado' });
  }
} 