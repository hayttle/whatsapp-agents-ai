import { useEffect, useState, useCallback } from 'react';

interface Message {
  id: string;
  sender: 'client' | 'ai';
  text: string;
  created_at: string;
}

export function useAgentMessages(agentId: string, whatsappNumber: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(() => {
    if (!agentId || !whatsappNumber) return;
    setLoading(true);
    setError(null);
    fetch(`/api/messages/${encodeURIComponent(whatsappNumber)}?agent_id=${agentId}`)
      .then(res => res.json())
      .then(data => {
        // Transformar os dados para o formato esperado
        const transformedMessages = (data.messages || []).map((msg: { id: string; sender: string; text?: string; content?: string; created_at?: string; timestamp?: string }) => ({
          id: msg.id,
          sender: msg.sender === 'user' ? 'client' : 'ai',
          text: msg.text || msg.content,
          created_at: msg.created_at || msg.timestamp
        }));
        setMessages(transformedMessages);
      })
      .catch(err => setError(err.message || 'Erro ao buscar mensagens'))
      .finally(() => setLoading(false));
  }, [agentId, whatsappNumber]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return { messages, loading, error, refetch: fetchMessages };
} 