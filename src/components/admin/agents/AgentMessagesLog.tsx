import React, { useState } from 'react';
import { AgentChatView } from './AgentChatView';

// Novo componente para a sidebar de contatos
const mockContacts = [
  {
    id: '1',
    name: 'Sarah Miller',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    lastMessage: 'Quero agendar um horário.',
    lastMessageAt: '11:33',
  },
  {
    id: '2',
    name: '+60 165439083',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    lastMessage: 'Oi, tudo bem?',
    lastMessageAt: '10:12',
  },
  {
    id: '3',
    name: 'João Silva',
    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
    lastMessage: 'Obrigado!',
    lastMessageAt: '09:50',
  },
];

const mockMessages: { [key: string]: { id: string; sender: string; text: string; created_at: string }[] } = {
  '1': [
    { id: '1', sender: 'client', text: 'Oi, tudo bem?', created_at: '2024-06-01T11:31:00' },
    { id: '2', sender: 'ai', text: 'Olá! Como posso ajudar?', created_at: '2024-06-01T11:32:00' },
    { id: '3', sender: 'client', text: 'Quero agendar um horário.', created_at: '2024-06-01T11:33:00' },
    { id: '4', sender: 'ai', text: 'Claro! Clique no link para agendar: https://exemplo.com/agendar', created_at: '2024-06-01T11:34:00' },
  ],
  '2': [
    { id: '1', sender: 'client', text: 'Oi, tudo bem?', created_at: '2024-06-01T10:12:00' },
    { id: '2', sender: 'ai', text: 'Tudo ótimo! Como posso ajudar?', created_at: '2024-06-01T10:13:00' },
  ],
  '3': [
    { id: '1', sender: 'client', text: 'Obrigado!', created_at: '2024-06-01T09:50:00' },
    { id: '2', sender: 'ai', text: 'De nada! Qualquer dúvida, estou à disposição.', created_at: '2024-06-01T09:51:00' },
  ],
};

function AgentContactsSidebar({ contacts, selectedId, onSelect }: {
  contacts: typeof mockContacts;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="w-80 border-r bg-white h-[70vh] flex flex-col">
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="Buscar contato..."
          className="w-full px-3 py-2 rounded bg-gray-50 border text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {contacts.map(contact => (
          <button
            key={contact.id}
            onClick={() => onSelect(contact.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 border-b text-left transition-colors
              ${selectedId === contact.id ? 'bg-brand-green/10' : 'hover:bg-gray-50'}`}
          >
            <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate text-gray-900">{contact.name}</div>
              <div className="text-xs text-gray-500 truncate">{contact.lastMessage}</div>
            </div>
            <div className="text-xs text-gray-400 ml-2 whitespace-nowrap">{contact.lastMessageAt}</div>
          </button>
        ))}
      </div>
    </aside>
  );
}

export const AgentMessagesLog: React.FC<{ agentId: string }> = () => {
  const [selectedId, setSelectedId] = useState(mockContacts[0].id);
  const contact = mockContacts.find(c => c.id === selectedId)!;
  const messages = mockMessages[selectedId] || [];

  return (
    <div className="flex bg-gray-50 rounded-lg border shadow-sm overflow-hidden">
      <AgentContactsSidebar
        contacts={mockContacts}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <div className="flex-1">
        <AgentChatView contact={contact} messages={messages} />
      </div>
    </div>
  );
}; 