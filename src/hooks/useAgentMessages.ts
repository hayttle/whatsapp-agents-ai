import { useEffect, useState } from 'react';

export function useAgentMessages(agentId: string, whatsappNumber: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId || !whatsappNumber) return;
    setLoading(true);
    setError(null);
    fetch(`/api/messages/${encodeURIComponent(whatsappNumber)}?agent_id=${agentId}`)
      .then(res => res.json())
      .then(data => {
        setMessages(data.messages || []);
      })
      .catch(err => setError(err.message || 'Erro ao buscar mensagens'))
      .finally(() => setLoading(false));
  }, [agentId, whatsappNumber]);

  return { messages, loading, error };
} 