"use client";
import { useState, useEffect } from "react";
import { Instance } from './types';
type EmpresaDropdown = { id: string; name: string };
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { Button, Alert } from '@/components/brand';
import GeneralSettings from './modal-parts/GeneralSettings';
import WebhookSettings from './modal-parts/WebhookSettings';
import BehaviorSettings from './modal-parts/BehaviorSettings';

const EVENT_OPTIONS = [
  "APPLICATION_STARTUP", "QRCODE_UPDATED", "MESSAGES_SET", "MESSAGES_UPSERT", 
  "MESSAGES_UPDATE", "MESSAGES_DELETE", "SEND_MESSAGE", "CONTACTS_SET", 
  "CONTACTS_UPSERT", "CONTACTS_UPDATE", "PRESENCE_UPDATE", "CHATS_SET", 
  "CHATS_UPSERT", "CHATS_UPDATE", "CHATS_DELETE", "GROUPS_UPSERT", 
  "GROUP_UPDATE", "GROUP_PARTICIPANTS_UPDATE", "CONNECTION_UPDATE", "CALL", 
  "NEW_JWT_TOKEN", "TYPEBOT_START", "TYPEBOT_CHANGE_STATUS"
];

const INTEGRATION_OPTIONS = ["WHATSAPP-BAILEYS", "WHATSAPP-BUSINESS"];

interface InstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (instance: Instance) => void;
  instance?: Instance | null;
  tenants: EmpresaDropdown[];
  tenantId?: string;
}

const InstanceModal: React.FC<InstanceModalProps> = ({ isOpen, onClose, onSave, instance, tenants, tenantId }) => {
  const [instanceName, setInstanceName] = useState("");
  const [integration, setIntegration] = useState(INTEGRATION_OPTIONS[0]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>([]);
  const [webhookByEvents, setWebhookByEvents] = useState(false);
  const [webhookBase64, setWebhookBase64] = useState(true);
  const [msgCall, setMsgCall] = useState("");
  const [rejectCall, setRejectCall] = useState(false);
  const [groupsIgnore, setGroupsIgnore] = useState(true);
  const [alwaysOnline, setAlwaysOnline] = useState(false);
  const [readMessages, setReadMessages] = useState(false);
  const [readStatus, setReadStatus] = useState(false);
  const [syncFullHistory, setSyncFullHistory] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (instance) {
      setInstanceName(instance.instanceName || "");
      setIntegration(instance.integration || INTEGRATION_OPTIONS[0]);
      setWebhookUrl(instance.webhookUrl || "");
      setWebhookEvents(instance.webhookEvents || []);
      setWebhookByEvents(instance.webhookByEvents ?? false);
      setWebhookBase64(instance.webhookBase64 ?? true);
      setMsgCall(instance.msgCall || "");
      setRejectCall(instance.rejectCall ?? false);
      setGroupsIgnore(instance.groupsIgnore ?? true);
      setAlwaysOnline(instance.alwaysOnline ?? false);
      setReadMessages(instance.readMessages ?? false);
      setReadStatus(instance.readStatus ?? false);
      setSyncFullHistory(instance.syncFullHistory ?? false);
      setSelectedTenant(instance.tenant_id || "");
    } else {
      setInstanceName("");
      setIntegration(INTEGRATION_OPTIONS[0]);
      setWebhookUrl("");
      setWebhookEvents([]);
      setWebhookByEvents(false);
      setWebhookBase64(true);
      setMsgCall("");
      setRejectCall(false);
      setGroupsIgnore(true);
      setAlwaysOnline(false);
      setReadMessages(false);
      setReadStatus(false);
      setSyncFullHistory(false);
      setSelectedTenant(tenantId || "");
    }
  }, [instance, isOpen, tenantId]);

  const handleEventChange = (event: string) => {
    setWebhookEvents(prev => prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]);
  };

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

    const payload = {
      instanceName,
      integration,
      webhookUrl,
      webhookEvents,
      webhookByEvents,
      webhookBase64,
      msgCall,
      rejectCall,
      groupsIgnore,
      alwaysOnline,
      readMessages,
      readStatus,
      syncFullHistory,
      tenantId: tenants.length > 0 ? selectedTenant : tenantId,
      webhook: {
        url: webhookUrl,
        byEvents: webhookByEvents,
        base64: webhookBase64,
        events: webhookEvents,
      },
      ...(instance && { id: instance.id })
    };

    const url = instance ? "/api/whatsapp-instances/update" : "/api/whatsapp-instances/create";
    const method = instance ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ocorreu um erro.");
      } else {
        setMsg(`Instância ${instance ? 'atualizada' : 'criada'} com sucesso!`);
        setTimeout(() => {
          setMsg("");
          setError("");
          onSave(data.instance || data);
          onClose();
        }, 800);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-2xl">
      <ModalHeader>{instance ? 'Editar Instância' : 'Nova Instância de WhatsApp'}</ModalHeader>
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
            integration={integration}
            setIntegration={setIntegration}
            INTEGRATION_OPTIONS={INTEGRATION_OPTIONS}
            instance={instance}
            tenants={tenants}
            selectedTenant={selectedTenant}
            setSelectedTenant={setSelectedTenant}
          />
          <WebhookSettings
            webhookUrl={webhookUrl}
            setWebhookUrl={setWebhookUrl}
            webhookEvents={webhookEvents}
            handleEventChange={handleEventChange}
            EVENT_OPTIONS={EVENT_OPTIONS}
            webhookByEvents={webhookByEvents}
            setWebhookByEvents={setWebhookByEvents}
            webhookBase64={webhookBase64}
            setWebhookBase64={setWebhookBase64}
          />
          <BehaviorSettings
            msgCall={msgCall} setMsgCall={setMsgCall}
            rejectCall={rejectCall} setRejectCall={setRejectCall}
            groupsIgnore={groupsIgnore} setGroupsIgnore={setGroupsIgnore}
            alwaysOnline={alwaysOnline} setAlwaysOnline={setAlwaysOnline}
            readMessages={readMessages} setReadMessages={setReadMessages}
            readStatus={readStatus} setReadStatus={setReadStatus}
            syncFullHistory={syncFullHistory} setSyncFullHistory={setSyncFullHistory}
          />
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
          >
            {instance ? 'Salvar Alterações' : 'Criar Instância'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default InstanceModal; 