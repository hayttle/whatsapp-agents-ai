export interface Instance {
  id: string;
  instanceName: string;
  integration?: string;
  status: 'open' | 'close';
  qrcode?: string | null;
  apikey?: string | null;
  tenant_id?: string;
  webhookUrl?: string;
  webhookEvents?: string[];
  webhookByEvents?: boolean;
  webhookBase64?: boolean;
  msgCall?: string;
  rejectCall?: boolean;
  groupsIgnore?: boolean;
  alwaysOnline?: boolean;
  readMessages?: boolean;
  readStatus?: boolean;
  syncFullHistory?: boolean;
  created_at?: string;
  updated_at?: string;
} 