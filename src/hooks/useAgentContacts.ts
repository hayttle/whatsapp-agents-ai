import { useEffect, useState, useCallback } from 'react';

interface Contact {
  whatsapp_number: string;
  last_message?: string;
  last_message_at?: string;
  instance_id?: string;
}

export function useAgentContacts(agentId: string) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(() => {
    if (!agentId) return;
    
    setLoading(true);
    setError(null);
    
    fetch(`/api/messages?agent_id=${agentId}`)
      .then(res => res.json())
      .then(data => {
        setContacts(data.contacts || []);
      })
      .catch(err => {
        setError(err.message || 'Erro ao buscar contatos');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [agentId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return { contacts, loading, error, refetch: fetchContacts };
} 