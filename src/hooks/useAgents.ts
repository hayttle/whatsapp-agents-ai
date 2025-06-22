import { useEffect, useState } from 'react';
import { Agent } from '@/services/agentService';
import { agentService } from '@/services/agentService';
import { tenantService } from '@/services/tenantService';

interface UseAgentsProps {
  isSuperAdmin: boolean;
  tenantId?: string;
  refreshKey: number;
}

export const useAgents = ({ isSuperAdmin, tenantId, refreshKey }: UseAgentsProps) => {
  const [agentes, setAgentes] = useState<Agent[]>([]);
  const [empresas, setEmpresas] = useState<Record<string, string>>({});
  const [instancias, setInstancias] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgentes = async () => {
    if (!loading) setLoading(true);
    setError(null);
    
    try {
      const data = await agentService.listAgents(isSuperAdmin ? undefined : tenantId);
      setAgentes(data.agents || []);
      
      // Buscar nomes das empresas (para super_admin)
      if (isSuperAdmin && data.agents) {
        const tenantIds = Array.from(new Set(data.agents.map((a: Agent) => a.tenant_id).filter(Boolean)));
        if (tenantIds.length > 0) {
          const dataEmp = await tenantService.listTenants();
          const empresaMap: Record<string, string> = {};
          (dataEmp.tenants || []).forEach((t: any) => { empresaMap[t.id] = t.nome; });
          setEmpresas(empresaMap);
        }
      }
      
      // Buscar nomes das instâncias
      const instanceIds = Array.from(new Set((data.agents || []).map((a: Agent) => a.instance_id).filter(Boolean)));
      if (instanceIds.length > 0) {
        // TODO: Criar instanceService.listInstancesByIds quando necessário
        // Por enquanto, vamos manter a lógica atual
        const { data: insts } = await fetch('/api/whatsapp-instances/list').then(res => res.json());
        const instMap: Record<string, string> = {};
        (insts?.instances || []).forEach((i: any) => { instMap[i.id] = i.name; });
        setInstancias(instMap);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentes();
  }, [isSuperAdmin, tenantId, refreshKey]);

  return {
    agentes,
    empresas,
    instancias,
    loading,
    error,
    refetch: fetchAgentes,
  };
}; 