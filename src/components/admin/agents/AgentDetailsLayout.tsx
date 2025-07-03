import { ReactNode, useEffect, useState } from 'react';
import { agentService, Agent } from '@/services/agentService';
import { AgentTabs } from './AgentTabs';

interface AgentDetailsLayoutProps {
  agentId: string;
  children: ReactNode;
}

export function AgentDetailsLayout({ agentId, children }: AgentDetailsLayoutProps) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    agentService.getAgentById(agentId)
      .then(setAgent)
      .catch(() => setError('Erro ao buscar agente'))
      .finally(() => setLoading(false));
  }, [agentId]);

  return (
    <div className="w-full">
      <AgentTabs agentId={agentId} />
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-green-light"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 py-8">{error}</div>
      ) : agent ? (
        <>{children}</>
      ) : null}
    </div>
  );
} 