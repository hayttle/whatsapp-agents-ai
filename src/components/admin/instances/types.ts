export interface Instance {
  id: string;
  instanceName: string;
  integration: string;
  status: 'open' | 'connecting' | 'close';
  qrcode?: string | null;
  apikey?: string | null;
  tenant_id: string;
  webhookUrl?: string | null;
  webhookEvents?: string[] | null;
  webhookByEvents?: boolean;
  webhookBase64?: boolean;
  msgCall?: string | null;
  rejectCall?: boolean;
  groupsIgnore?: boolean;
  alwaysOnline?: boolean;
  readMessages?: boolean;
  readStatus?: boolean;
  syncFullHistory?: boolean;
  created_at: string;
  updated_at: string;
} 