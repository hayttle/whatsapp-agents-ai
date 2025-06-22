import React from 'react';
import { Input } from '@/components/brand';

interface WebhookSettingsProps {
  webhookUrl: string;
  setWebhookUrl: (value: string) => void;
  webhookEvents: string[];
  handleEventChange: (event: string) => void;
  EVENT_OPTIONS: string[];
  webhookByEvents: boolean;
  setWebhookByEvents: (value: boolean) => void;
  webhookBase64: boolean;
  setWebhookBase64: (value: boolean) => void;
}

const WebhookSettings: React.FC<WebhookSettingsProps> = ({
  webhookUrl,
  setWebhookUrl,
  webhookEvents,
  handleEventChange,
  EVENT_OPTIONS,
  webhookByEvents,
  setWebhookByEvents,
  webhookBase64,
  setWebhookBase64,
}) => {
  return (
    <div className="space-y-4">
      <Input
        label="Webhook URL"
        type="text"
        placeholder="https://exemplo.com/webhook"
        value={webhookUrl}
        onChange={e => setWebhookUrl(e.target.value)}
      />
      
      <div>
        <label className="block font-semibold mb-2 text-sm">Eventos do Webhook:</label>
        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-3 bg-gray-50">
          {EVENT_OPTIONS.map(ev => (
            <label key={ev} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-100 p-1 rounded">
              <input
                type="checkbox"
                checked={webhookEvents.includes(ev)}
                onChange={() => handleEventChange(ev)}
                className="rounded"
              />
              <span className="truncate">{ev}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input 
            type="checkbox" 
            checked={webhookByEvents} 
            onChange={e => setWebhookByEvents(e.target.checked)}
            className="rounded"
          />
          <span>Webhook por eventos</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input 
            type="checkbox" 
            checked={webhookBase64} 
            onChange={e => setWebhookBase64(e.target.checked)}
            className="rounded"
          />
          <span>Webhook Base64</span>
        </label>
      </div>
    </div>
  );
};

export default WebhookSettings; 