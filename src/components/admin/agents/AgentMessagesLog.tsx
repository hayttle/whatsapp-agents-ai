import React, { useEffect, useState } from 'react';
import { Input } from '@/components/brand/Input';
import { Button } from '@/components/brand/Button';

interface Message {
  id: string;
  agent_id: string;
  sender: string;
  whatsapp_number: string;
  text: string;
  created_at: string;
}

interface AgentMessagesLogProps {
  agentId: string;
}

export const AgentMessagesLog: React.FC<AgentMessagesLogProps> = ({ agentId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    whatsapp_number: '',
    from: '',
    to: '',
    text: '',
  });
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        agent_id: agentId,
        limit: String(limit),
        offset: String(page * limit),
      });
      if (filters.whatsapp_number) params.append('whatsapp_number', filters.whatsapp_number);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      if (filters.text) params.append('text', filters.text);
      const res = await fetch(`/api/messages?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao buscar mensagens');
      setMessages(data.messages);
      setTotal(data.count || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, page]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleApplyFilters = () => {
    setPage(0);
    fetchMessages();
  };

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-2">
        <Input
          name="whatsapp_number"
          placeholder="Número WhatsApp"
          value={filters.whatsapp_number}
          onChange={handleFilterChange}
        />
        <Input
          name="from"
          type="date"
          placeholder="Data inicial"
          value={filters.from}
          onChange={handleFilterChange}
        />
        <Input
          name="to"
          type="date"
          placeholder="Data final"
          value={filters.to}
          onChange={handleFilterChange}
        />
        <Input
          name="text"
          placeholder="Buscar texto"
          value={filters.text}
          onChange={handleFilterChange}
        />
        <Button onClick={handleApplyFilters} className="col-span-1 md:col-span-4 mt-2">Filtrar</Button>
      </div>
      {loading ? (
        <div>Carregando mensagens...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div>
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Data/Hora</th>
                <th className="p-2">Remetente</th>
                <th className="p-2">WhatsApp</th>
                <th className="p-2">Mensagem</th>
              </tr>
            </thead>
            <tbody>
              {messages.map(msg => (
                <tr key={msg.id} className="border-t">
                  <td className="p-2 whitespace-nowrap">{new Date(msg.created_at).toLocaleString()}</td>
                  <td className="p-2 font-semibold">{msg.sender === 'ai' ? 'Agente' : 'Usuário'}</td>
                  <td className="p-2">{msg.whatsapp_number}</td>
                  <td className="p-2">{msg.text}</td>
                </tr>
              ))}
              {messages.length === 0 && (
                <tr><td colSpan={4} className="text-center p-4">Nenhuma mensagem encontrada.</td></tr>
              )}
            </tbody>
          </table>
          <div className="flex justify-between items-center mt-4">
            <Button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Anterior</Button>
            <span>Página {page + 1} de {Math.ceil(total / limit) || 1}</span>
            <Button onClick={() => setPage(p => (p + 1 < Math.ceil(total / limit) ? p + 1 : p))} disabled={page + 1 >= Math.ceil(total / limit)}>Próxima</Button>
          </div>
        </div>
      )}
    </div>
  );
}; 