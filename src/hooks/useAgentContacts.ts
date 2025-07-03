import { useEffect, useState } from 'react';

export function useAgentContacts(agentId: string) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/messages?agent_id=${agentId}`)
      .then(res => res.json())
      .then(data => {
        setContacts(data.contacts || []);
      })
      .catch(err => setError(err.message || 'Erro ao buscar contatos'))
      .finally(() => setLoading(false));
  }, [agentId]);

  return { contacts, loading, error };
} 