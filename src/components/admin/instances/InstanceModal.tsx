"use client";
import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui';
import { Button } from '@/components/brand/Button';
import { Alert } from '@/components/brand/Alert';
import { Instance } from './types';
import GeneralSettings from './modal-parts/GeneralSettings';
import { useAgents } from '@/hooks/useAgents';
import { Agent } from '@/services/agentService';
import { Save } from 'lucide-react';
import { instanceService, CreateInstanceData } from "@/services/instanceService";

type EmpresaDropdown = { id: string; name: string };

interface ProviderOption {
  id: string;
  name: string;
  provider_type: string;
}

interface InstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (instance: Instance) => void;
  tenants: EmpresaDropdown[];
  tenantId?: string;
  isSuperAdmin?: boolean;
}

const InstanceModal: React.FC<InstanceModalProps> = ({ isOpen, onClose, onSave, tenants, tenantId, isSuperAdmin = false }) => {
  const [instanceName, setInstanceName] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("");
  const [providerType, setProviderType] = useState<'nativo' | 'externo'>('nativo');
  const [providerId, setProviderId] = useState<string>("");
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [agentId, setAgentId] = useState<string>("");
  const [description, setDescription] = useState("");
  const { agentes, loading: loadingAgents } = useAgents({ isSuperAdmin: !!isSuperAdmin, tenantId: isSuperAdmin ? selectedTenant : tenantId });

  useEffect(() => {
    setInstanceName("");
    setSelectedTenant(tenantId || "");
    setProviderType('nativo');
    setProviderId("");
    setAgentId("");
    setMsg("");
    setError("");
    setDescription("");
  }, [isOpen, tenantId]);

  useEffect(() => {
    if (providerType === 'externo') {
      fetch('/api/providers/list')
        .then(res => res.json())
        .then(data => setProviders(data.providers || []));
    }
  }, [providerType]);

  const handleInstanceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = value.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    setInstanceName(formattedValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setError("");

    if (!instanceName) {
      setError('Nome da instância é obrigatório.');
      setLoading(false);
      return;
    }
    if (isSuperAdmin && tenants.length > 0 && !selectedTenant) {
      setError('Selecione a empresa.');
      setLoading(false);
      return;
    }
    if (providerType === 'externo' && !providerId) {
      setError('Selecione o servidor WhatsApp externo.');
      setLoading(false);
      return;
    }

    const payload: Record<string, unknown> = {
      instanceName,
      description,
      integration: "WHATSAPP-BAILEYS",
      webhookEvents: ["MESSAGES_UPSERT"],
      webhookByEvents: false,
      webhookBase64: true,
      msgCall: "",
      rejectCall: false,
      groupsIgnore: true,
      alwaysOnline: false,
      readMessages: false,
      readStatus: false,
      syncFullHistory: false,
      tenantId: isSuperAdmin && tenants.length > 0 ? selectedTenant : tenantId,
      provider_type: providerType,
    };
    if (providerType === 'externo') {
      payload.provider_id = providerId;
      if (agentId) payload.agent_id = agentId;
    }

    try {
      const data = await instanceService.createInstance(payload as unknown as CreateInstanceData);
      setMsg("Instância criada com sucesso!");
      setTimeout(() => {
        setMsg("");
        setError("");
        onSave(data.instance || data);
        onClose();
      }, 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-2xl">
      <ModalHeader>Nova Instância de WhatsApp</ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-6">
          {msg && (
            <Alert variant="success" title="Sucesso">
              {msg}
            </Alert>
          )}
          {error && (
            <Alert variant="error" title="Erro">
              {error}
            </Alert>
          )}
          <GeneralSettings
            instanceName={instanceName}
            handleInstanceNameChange={handleInstanceNameChange}
            tenants={tenants}
            selectedTenant={selectedTenant}
            setSelectedTenant={setSelectedTenant}
            isSuperAdmin={isSuperAdmin}
          />
          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <textarea
              className="w-full border rounded px-3 py-2 text-sm resize-none min-h-[60px]"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={255}
              placeholder="Descreva a finalidade ou detalhes da instância (opcional)"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Provedor *</label>
            <select
              className="w-full border rounded px-3 py-2 text-sm"
              value={providerType}
              onChange={e => setProviderType(e.target.value as 'nativo' | 'externo')}
              required
            >
              <option value="nativo">Nativo</option>
              <option value="externo">Externo</option>
            </select>
          </div>
          {providerType === 'externo' && (
            <div>
              <label className="block text-sm font-medium mb-1">Servidor Evolution API*</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={providerId}
                onChange={e => setProviderId(e.target.value)}
                required
              >
                <option value="">Selecione o servidor</option>
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Evolution API)</option>
                ))}
              </select>
            </div>
          )}
          {providerType === 'externo' && (
            <div>
              <label className="block text-sm font-medium mb-1">Agente IA</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={agentId}
                onChange={e => setAgentId(e.target.value)}
                disabled={loadingAgents}
              >
                <option value="">Selecione o agente</option>
                {agentes.map((a: Agent) => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Criar Instância
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default InstanceModal; 