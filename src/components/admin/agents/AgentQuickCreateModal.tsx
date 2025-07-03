import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Input, Button, Select } from '@/components/brand';
import { agentService } from '@/services/agentService';
import { FiSave, FiX } from 'react-icons/fi';
import { useTenants } from '@/hooks/useTenants';

interface AgentQuickCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (agentId: string) => void;
  tenantId: string;
}

export default function AgentQuickCreateModal({ open, onClose, onCreated, tenantId }: AgentQuickCreateModalProps) {
  const isSuperAdmin = !tenantId;
  const { data: tenants, loading: tenantsLoading } = useTenants(isSuperAdmin);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [agentType, setAgentType] = useState<'internal' | 'external'>('internal');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (agentType === 'external' && !webhookUrl.trim()) return;
    setLoading(true);
    try {
      const response = await agentService.createAgent({
        title,
        description,
        agent_type: agentType,
        tenant_id: tenantId || selectedTenant,
        active: true,
        ...(agentType === 'external' ? { webhookUrl } : {}),
      });
      const agentId = response.agent?.id;
      if (agentId) {
        onCreated(agentId);
        setTitle('');
        setDescription('');
        setAgentType('internal');
        setWebhookUrl('');
        setSelectedTenant('');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} className="w-full max-w-md">
      <form onSubmit={handleCreate} className="space-y-4">
        <h2 className="text-xl font-bold mb-2">Criar novo agente</h2>
        {isSuperAdmin && (
          <Select
            label="Empresa *"
            value={selectedTenant}
            onChange={e => setSelectedTenant(e.target.value)}
            required
            disabled={tenantsLoading}
          >
            <option value="">Selecione a empresa</option>
            {tenants.map((tenant: any) => (
              <option key={tenant.id} value={tenant.id}>{tenant.name || tenant.id}</option>
            ))}
          </Select>
        )}
        <Input
          label="Nome do agente *"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          placeholder="Ex: Bot de Atendimento"
        />
        <Input
          label="Descrição"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Descreva a finalidade ou detalhes do agente (opcional)"
        />
        <Select
          label="Tipo de agente"
          value={agentType}
          onChange={e => setAgentType(e.target.value as 'internal' | 'external')}
        >
          <option value="internal">Nativo (IA)</option>
          <option value="external">Externo (Webhook/n8n)</option>
        </Select>
        {agentType === 'external' && (
          <Input
            label="URL do Webhook n8n *"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            required
            placeholder="https://seu-n8n.com/webhook/abc123"
          />
        )}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={onClose} type="button" leftIcon={<FiX />}>Cancelar</Button>
          <Button
            variant="primary"
            type="submit"
            loading={loading}
            disabled={
              !title.trim() ||
              (isSuperAdmin && !selectedTenant) ||
              (agentType === 'external' && !webhookUrl.trim())
            }
            leftIcon={<FiSave />}
          >
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
} 