import React from 'react';

interface Contact {
  name: string;
  avatar: string;
}

interface Message {
  id: string;
  sender: 'client' | 'ai';
  text: string;
  created_at: string;
}

interface AgentChatViewProps {
  contact: Contact;
  messages: Message[];
}

export const AgentChatView: React.FC<AgentChatViewProps> = ({ contact, messages }) => {
  return (
    <div className="flex flex-col h-[70vh] bg-white rounded-lg border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b bg-gray-50">
        <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
        <span className="font-semibold text-lg text-gray-900">{contact.name}</span>
      </div>
      {/* Mensagens */}
      <div className="flex-1 flex flex-col gap-2 px-6 py-4 overflow-y-auto">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'ai' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[60%] px-4 py-2 rounded-lg shadow text-sm whitespace-pre-line
                ${msg.sender === 'ai'
                  ? 'bg-brand-green-light text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-900 rounded-bl-none'}`}
            >
              {msg.text}
              <div className="text-xs text-white mt-1 text-right">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 