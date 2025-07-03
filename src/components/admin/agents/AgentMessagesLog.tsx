import React, { useState } from 'react';
import { AgentChatView } from './AgentChatView';
import { useAgentContacts } from '@/hooks/useAgentContacts';
import { useAgentMessages } from '@/hooks/useAgentMessages';
import { User, RefreshCw } from 'lucide-react';

function AgentContactsSidebar({ contacts, selectedId, onSelect, loading, onRefresh, refreshing }: {
  contacts: any[];
  selectedId: string;
  onSelect: (id: string) => void;
  loading: boolean;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <aside className="w-96 border-r bg-white h-[70vh] flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <input
          type="text"
          placeholder="Buscar contato..."
          className="w-full px-3 py-2 rounded bg-gray-50 border text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
        />
        <button
          className={`ml-2 p-2 rounded hover:bg-gray-100 transition ${refreshing ? 'animate-spin' : ''}`}
          title="Atualizar conversas"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-gray-400 text-sm">Carregando contatos...</div>
        ) : contacts.length === 0 ? (
          <div className="p-4 text-gray-400 text-sm">Nenhum contato encontrado.</div>
        ) : contacts.map(contact => (
          <button
            key={contact.whatsapp_number}
            onClick={() => onSelect(contact.whatsapp_number)}
            className={`w-full flex items-center gap-3 px-4 py-3 border-b text-left transition-colors
              ${selectedId === contact.whatsapp_number ? 'bg-brand-green/10' : 'hover:bg-gray-50'}`}
          >
            {contact.avatar ? (
              <img src={contact.avatar} alt={contact.whatsapp_number} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate text-gray-900">{contact.whatsapp_number}</div>
              <div className="text-xs text-gray-500 truncate">{contact.last_message}</div>
            </div>
            <div className="text-xs text-gray-400 ml-2 whitespace-nowrap">
              {contact.last_message_at ? new Date(contact.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}

export const AgentMessagesLog: React.FC<{ agentId: string }> = ({ agentId }) => {
  const { contacts, loading: loadingContacts, error: errorContacts, refetch: refetchContacts } = useAgentContacts(agentId);
  const [selectedNumber, setSelectedNumber] = useState<string>('');
  const selected = selectedNumber || (contacts[0]?.whatsapp_number ?? '');
  const { messages, loading: loadingMessages, error: errorMessages, refetch: refetchMessages } = useAgentMessages(agentId, selected);
  const [refreshing, setRefreshing] = useState(false);

  // Fallback para selecionar o primeiro contato automaticamente
  React.useEffect(() => {
    if (!selectedNumber && contacts.length > 0) {
      setSelectedNumber(contacts[0].whatsapp_number);
    }
  }, [contacts, selectedNumber]);

  // Atualiza mensagens ao atualizar contatos
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      refetchContacts();
      refetchMessages();
      setRefreshing(false);
    }, 2000);
  };

  return (
    <div className="flex bg-gray-50 rounded-lg border shadow-sm overflow-hidden">
      <AgentContactsSidebar
        contacts={contacts}
        selectedId={selected}
        onSelect={setSelectedNumber}
        loading={loadingContacts}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
      <div className="flex-1">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full text-gray-400">Carregando mensagens...</div>
        ) : errorMessages ? (
          <div className="flex items-center justify-center h-full text-red-500">{errorMessages}</div>
        ) : (
          <AgentChatView
            contact={{
              name: selected,
              avatar: '', // Pode ser ajustado para buscar avatar real
            }}
            messages={messages}
          />
        )}
      </div>
    </div>
  );
}; 