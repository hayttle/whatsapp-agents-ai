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
  byEvents?: boolean;
  base64?: boolean;
  msgCall?: string;
  rejectCall?: boolean;
  groupIgnore?: boolean;
  alwaysOnline?: boolean;
  readMessages?: boolean;
  readStatus?: boolean;
  syncFullHistory?: boolean;
  created_at?: string;
  updated_at?: string;
  public_hash?: string;
  phone_number?: string | null;
  agent_id?: string | null;
  description?: string | null;
  provider_type?: 'nativo' | 'externo';
  provider_id?: string | null;
} 