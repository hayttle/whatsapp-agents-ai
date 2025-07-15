export interface Agent {
  id: string;
  title: string;
  prompt?: string;
  fallback_message?: string;
  status: "active" | "inactive";
  instance_id?: string | null;
  tenant_id: string;
  personality?: string;
  custom_personality?: string;
  tone?: string;
  webhookUrl?: string | null;
  description?: string | null;
  agent_type?: 'internal' | 'external';
  buffer_time?: number;
  agent_model_id?: string | null;
}

export interface Instance {
  id: string;
  instanceName: string;
}

export interface AgentModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (agentId: string) => void;
  agent?: Agent | null;
  tenantId: string;
  isSuperAdmin?: boolean;
} 