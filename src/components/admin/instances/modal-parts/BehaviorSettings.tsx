import React from 'react';
import { Input, Switch } from '@/components/brand';

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
          <Switch checked={rejectCall} onCheckedChange={setRejectCall} id="rejectCall">Rejeitar chamadas</Switch>
          <Switch checked={groupsIgnore} onCheckedChange={setGroupsIgnore} id="groupsIgnore">Ignorar grupos</Switch>
          <Switch checked={alwaysOnline} onCheckedChange={setAlwaysOnline} id="alwaysOnline">Sempre online</Switch>
          <Switch checked={readMessages} onCheckedChange={setReadMessages} id="readMessages">Ler mensagens</Switch>
          <Switch checked={readStatus} onCheckedChange={setReadStatus} id="readStatus">Ler status</Switch>
          <Switch checked={syncFullHistory} onCheckedChange={setSyncFullHistory} id="syncFullHistory">Sincronizar histórico</Switch>
        </div>
      </div>
    </div>
  );
};

export default BehaviorSettings; 