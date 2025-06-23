export interface Agent {
  id: string;
  title: string;
  prompt: string;
  fallback_message: string;
  active: boolean;
  instance_id: string | null;
  tenant_id: string;
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