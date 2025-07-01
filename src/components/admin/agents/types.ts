export interface Agent {
  id: string;
  title: string;
  prompt: string;
  fallback_message: string;
  active: boolean;
  instance_id?: string | null;
  tenant_id: string;
  personality?: string;
  custom_personality?: string;
  tone?: string;
  webhookUrl?: string | null;
  description?: string | null;
  agent_type?: 'internal' | 'external';
  buffer_time?: number;
}

export interface Instance {
  id: string;
  instanceName: string;
}

export interface AgentModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  agent?: Agent | null;
  tenantId: string;
  isSuperAdmin?: boolean;
} 