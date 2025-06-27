import React, { useEffect, useState, useRef } from 'react';
import Modal, { ModalHeader, ModalBody } from '@/components/ui/Modal';
import { Button, Alert } from '@/components/brand';
import ProviderSettings, { ProviderType } from './ProviderSettings';
import { tenantService, Tenant } from '@/services/tenantService';
import { userService } from '@/services/userService';

export interface ProviderModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  provider?: {
    id?: string;
    name: string;
    provider_type: ProviderType;
    server_url: string;
    api_key: string;
    tenant_id?: string;
  } | null;
}

export function ProviderModal({ open, onClose, onSaved, provider }: ProviderModalProps) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [focusField, setFocusField] = useState<null | 'url' | 'api_key'>(null);
  const providerSettingsRef = useRef<{ focusUrl: () => void; focusApiKey: () => void } | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    setMsg('');
  }, [open, provider]);

  useEffect(() => {
    async function fetchUserAndTenants() {
      const user = await userService.getCurrentUser();
      setIsSuperAdmin(user.role === 'super_admin');
      if (user.role === 'super_admin') {
        const data = await tenantService.listTenants();
        setTenants(data.tenants);
      }
    }
    if (open) fetchUserAndTenants();
  }, [open]);

  const handleSubmit = async (data: { name: string; provider_type: ProviderType; server_url: string; api_key: string; tenant_id?: string }) => {
    setLoading(true);
    setMsg('');
    setFocusField(null);
    try {
      const url = '/api/providers/create';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(provider?.id ? { ...data, id: provider.id } : data),
      });
      const result = await res.json();
      if (!res.ok) {
        setMsg('Erro ao salvar provedor.');
        if (result.error && result.error.toLowerCase().includes('url')) {
          setFocusField('url');
        } else if (result.error && result.error.toLowerCase().includes('api key')) {
          setFocusField('api_key');
        }
        return;
      } else {
        setMsg('Provedor salvo com sucesso!');
        setTimeout(() => {
          setMsg('');
          onSaved();
        }, 1200);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (focusField === 'url') {
      setTimeout(() => providerSettingsRef.current?.focusUrl(), 0);
      setFocusField(null);
    } else if (focusField === 'api_key') {
      setTimeout(() => providerSettingsRef.current?.focusApiKey(), 0);
      setFocusField(null);
    }
  }, [focusField]);

  return (
    <Modal isOpen={open} onClose={onClose} className="w-full max-w-lg">
      <ModalHeader>{provider ? 'Editar Provedor' : 'Novo Provedor'}</ModalHeader>
      <ModalBody>
        {msg && <Alert variant="success" title="Sucesso">{msg}</Alert>}
        <ProviderSettings
          ref={providerSettingsRef}
          initialData={provider || undefined}
          onSubmit={handleSubmit}
          isLoading={loading}
          tenants={tenants}
          isSuperAdmin={isSuperAdmin}
          renderFooter={() => (
            <div className="flex flex-row-reverse gap-2 w-full mt-6">
              <Button type="submit" loading={loading} disabled={loading}>
                Salvar
              </Button>
              <Button type="button" onClick={onClose} variant="outline" disabled={loading}>
                Cancelar
              </Button>
            </div>
          )}
        />
      </ModalBody>
    </Modal>
  );
} 