import React from 'react';
import { Switch } from '@/components/brand';

interface WebhookSettingsProps {
  webhookEvents: string[];
  handleEventChange: (event: string) => void;
  EVENT_OPTIONS: string[];
  webhookByEvents: boolean;
  setWebhookByEvents: (value: boolean) => void;
  webhookBase64: boolean;
  setWebhookBase64: (value: boolean) => void;
}

const WebhookSettings: React.FC<WebhookSettingsProps> = ({
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
        <Switch checked={webhookByEvents} onCheckedChange={setWebhookByEvents} id="webhookByEvents">Webhook por eventos</Switch>
        <Switch checked={webhookBase64} onCheckedChange={setWebhookBase64} id="webhookBase64">Webhook Base64</Switch>
      </div>
    </div>
  );
};

export default WebhookSettings; 