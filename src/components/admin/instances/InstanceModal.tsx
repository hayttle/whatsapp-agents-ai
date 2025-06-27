"use client";
import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui';
import { Button } from '@/components/brand/Button';
import { Alert } from '@/components/brand/Alert';
import { Instance } from './types';
import GeneralSettings from './modal-parts/GeneralSettings';

type EmpresaDropdown = { id: string; name: string };

interface InstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (instance: Instance) => void;
  instance?: Instance | null;
  tenants: EmpresaDropdown[];
  tenantId?: string;
  isSuperAdmin?: boolean;
}

const InstanceModal: React.FC<InstanceModalProps> = ({ isOpen, onClose, onSave, instance, tenants, tenantId, isSuperAdmin = false }) => {
  const [instanceName, setInstanceName] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (instance) {
      setInstanceName(instance.instanceName || "");
      setSelectedTenant(instance.tenant_id || "");
    } else {
      setInstanceName("");
      setSelectedTenant(tenantId || "");
    }
  }, [instance, isOpen, tenantId]);

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
            instance={instance}
            tenants={tenants}
            selectedTenant={selectedTenant}
            setSelectedTenant={setSelectedTenant}
            isSuperAdmin={isSuperAdmin}
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