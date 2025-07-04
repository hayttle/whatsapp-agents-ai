import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AgentChatView } from './AgentChatView';
import { useAgentContacts } from '@/hooks/useAgentContacts';
import { useAgentMessages } from '@/hooks/useAgentMessages';
import { User, RefreshCw } from 'lucide-react';
import { useInstances } from '@/hooks/useInstances';

interface Contact {
  whatsapp_number: string;
  last_message?: string;
  last_message_at?: string;
  instance_id?: string;
}

function AgentContactsSidebar({ contacts, selectedId, onSelect, loading, onRefresh, refreshing, getAvatarUrl, searchTerm, onSearchChange }: {
  contacts: Contact[];
  selectedId: string;
  onSelect: (id: string) => void;
  loading: boolean;
  onRefresh: () => void;
  refreshing: boolean;
  getAvatarUrl: (contact: Contact) => string;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}) {

  return (
    <aside className="w-96 border-r bg-white h-[70vh] flex flex-col">
      {/* Header com título e botão de atualizar */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Conversas</h3>
          <button
            className={`p-2 rounded-full hover:bg-gray-100 transition ${refreshing ? 'animate-spin' : ''}`}
            title="Atualizar conversas"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {/* Input de filtro */}
        <input
          type="text"
          placeholder="Buscar contato..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 rounded bg-gray-50 border text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
        />
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
            {getAvatarUrl(contact) ? (
              <img src={getAvatarUrl(contact)} alt={contact.whatsapp_number} className="w-10 h-10 rounded-full object-cover" />
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
  const { contacts, loading: loadingContacts, refetch: refetchContacts } = useAgentContacts(agentId);
  const [selectedNumber, setSelectedNumber] = useState<string>('');
  const selected = selectedNumber || (contacts[0]?.whatsapp_number ?? '');
  const { messages, loading: loadingMessages, refetch: refetchMessages } = useAgentMessages(agentId, selected);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filtrar contatos baseado no termo de busca
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact =>
      contact.whatsapp_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.last_message && contact.last_message.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [contacts, searchTerm]);

  // Avatar cache: { [key: string]: string }
  const [avatarCache, setAvatarCache] = useState<{ [key: string]: string }>({});
  const loadingAvatars = useRef<{ [key: string]: boolean }>({});

  // Supondo que o tenantId está disponível no contexto ou props, ajuste conforme necessário
  const isSuperAdmin = false; // ou obtenha do contexto/props
  const tenantId = undefined; // ou obtenha do contexto/props
  const { data: instancias } = useInstances({ isSuperAdmin, tenantId });

  // Mapeamento de instance_id para instanceName
  const instanceMap = useMemo(() => {
    return instancias.reduce((acc: Record<string, string>, inst: { id: string; instanceName: string }) => {
      acc[inst.id] = inst.instanceName;
      return acc;
    }, {});
  }, [instancias]);

  // Função para buscar avatar dinamicamente
  const fetchAvatar = async (number: string, instance_id: string) => {
    const instanceName = instanceMap[instance_id];
    if (!instanceName) return;

    const key = `${number}|${instanceName}`;
    if (avatarCache[key] || loadingAvatars.current[key]) return;

    loadingAvatars.current[key] = true;

    try {
      const res = await fetch('/api/contacts/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, instance: instanceName }),
      });

      const data = await res.json();

      if (data.avatar) {
        setAvatarCache(prev => ({ ...prev, [key]: data.avatar }));
      }
    } catch {
      // Silenciosamente ignora erros de avatar
    } finally {
      loadingAvatars.current[key] = false;
    }
  };

  // Buscar avatar para todos os contatos ao carregar
  useEffect(() => {
    contacts.forEach(contact => {
      if (contact.whatsapp_number && contact.instance_id) {
        fetchAvatar(contact.whatsapp_number, contact.instance_id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacts, instanceMap]);

  // Função utilitária para obter avatar do cache
  const getAvatarUrl = (contact: Contact) => {
    if (!contact.whatsapp_number || !contact.instance_id) return '';
    const instanceName = instanceMap[contact.instance_id];
    if (!instanceName) return '';
    return avatarCache[`${contact.whatsapp_number}|${instanceName}`] || '';
  };

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

  // Limpar busca quando não há resultados
  useEffect(() => {
    if (searchTerm && filteredContacts.length === 0 && contacts.length > 0) {
      // Opcional: limpar busca automaticamente após 3 segundos se não houver resultados
      const timer = setTimeout(() => {
        setSearchTerm('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, filteredContacts.length, contacts.length]);

  return (
    <div className="flex bg-gray-50 rounded-lg border shadow-sm overflow-hidden relative">
      <AgentContactsSidebar
        contacts={filteredContacts}
        selectedId={selected}
        onSelect={setSelectedNumber}
        loading={loadingContacts}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        getAvatarUrl={getAvatarUrl}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      {searchTerm && filteredContacts.length === 0 && contacts.length > 0 && (
        <div className="absolute top-20 left-4 bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800 z-10">
          Nenhum contato encontrado para "{searchTerm}".
        </div>
      )}
      <div className="flex-1">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full text-gray-400">Carregando mensagens...</div>
        ) : (
          <AgentChatView
            contact={{
              name: selected,
              avatar: getAvatarUrl(contacts.find(c => c.whatsapp_number === selected) || { whatsapp_number: '', last_message: '', last_message_at: '', instance_id: '' })
            }}
            messages={messages}
          />
        )}
      </div>
    </div>
  );
}; 