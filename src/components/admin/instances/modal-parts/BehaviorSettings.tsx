import React from 'react';
import { Input } from '@/components/brand';

interface BehaviorSettingsProps {
  msgCall: string;
  setMsgCall: (value: string) => void;
  rejectCall: boolean;
  setRejectCall: (value: boolean) => void;
  groupsIgnore: boolean;
  setGroupsIgnore: (value: boolean) => void;
  alwaysOnline: boolean;
  setAlwaysOnline: (value: boolean) => void;
  readMessages: boolean;
  setReadMessages: (value: boolean) => void;
  readStatus: boolean;
  setReadStatus: (value: boolean) => void;
  syncFullHistory: boolean;
  setSyncFullHistory: (value: boolean) => void;
}

const BehaviorSettings: React.FC<BehaviorSettingsProps> = ({
  msgCall, setMsgCall,
  rejectCall, setRejectCall,
  groupsIgnore, setGroupsIgnore,
  alwaysOnline, setAlwaysOnline,
  readMessages, setReadMessages,
  readStatus, setReadStatus,
  syncFullHistory, setSyncFullHistory,
}) => {
  return (
    <div className="space-y-4">
      <Input
        label="Mensagem para Chamadas"
        type="text"
        placeholder="Mensagem para chamadas (msgCall)"
        value={msgCall}
        onChange={e => setMsgCall(e.target.value)}
      />
      
      <div>
        <label className="block font-semibold mb-2 text-sm">Comportamentos:</label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded hover:bg-gray-50">
            <input 
              type="checkbox" 
              checked={rejectCall} 
              onChange={e => setRejectCall(e.target.checked)}
              className="rounded"
            />
            <span>Rejeitar chamadas</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded hover:bg-gray-50">
            <input 
              type="checkbox" 
              checked={groupsIgnore} 
              onChange={e => setGroupsIgnore(e.target.checked)}
              className="rounded"
            />
            <span>Ignorar grupos</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded hover:bg-gray-50">
            <input 
              type="checkbox" 
              checked={alwaysOnline} 
              onChange={e => setAlwaysOnline(e.target.checked)}
              className="rounded"
            />
            <span>Sempre online</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded hover:bg-gray-50">
            <input 
              type="checkbox" 
              checked={readMessages} 
              onChange={e => setReadMessages(e.target.checked)}
              className="rounded"
            />
            <span>Ler mensagens</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded hover:bg-gray-50">
            <input 
              type="checkbox" 
              checked={readStatus} 
              onChange={e => setReadStatus(e.target.checked)}
              className="rounded"
            />
            <span>Ler status</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded hover:bg-gray-50">
            <input 
              type="checkbox" 
              checked={syncFullHistory} 
              onChange={e => setSyncFullHistory(e.target.checked)}
              className="rounded"
            />
            <span>Sincronizar histórico</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default BehaviorSettings; 