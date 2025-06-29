import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Modal, { ModalHeader, ModalBody } from '@/components/ui/Modal';
import { Button, Alert } from '@/components/brand';
import ProviderSettings from './ProviderSettings';
import { tenantService, Tenant } from '@/services/tenantService';
import { userService } from '@/services/userService';
import { Save } from 'lucide-react';

export interface ProviderModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  provider?: {
    id?: string;
    name: string;
    provider_type: 'evolution';
    server_url: string;
    api_key: string;
    tenant_id?: string;
  } | null;
}

export function ProviderModal({ open, onClose, onSaved, provider }: ProviderModalProps) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');
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

  const handleSubmit = async (data: { name: string; provider_type: 'evolution'; server_url: string; api_key: string; tenant_id?: string }) => {
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
        setMsg(result.error || 'Erro ao salvar provedor.');
        setMsgType('error');
        if (result.error && result.error.toLowerCase().includes('url')) {
          setFocusField('url');
        } else if (result.error && result.error.toLowerCase().includes('api key')) {
          setFocusField('api_key');
        }
        setLoading(false);
        return;
      } else {
        setMsg('Provedor salvo com sucesso!');
        setMsgType('success');
        setTimeout(() => {
          setMsg('');
          onSaved();
        }, 1200);
      }
    } catch {
      setMsg('Erro ao salvar provedor.');
      setMsgType('error');
    }
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
      <ModalHeader>
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="bg-brand-gray-dark rounded-lg p-3 flex items-center justify-center">
            <Image src="/evolution-ai-logo.png" alt="Evolution API" width={32} height={32} className="h-8 w-auto" />
          </div>
          <span className="text-lg font-semibold mt-1">{provider ? 'Editar Servidor Evolution' : 'Novo Servidor Evolution'}</span>
        </div>
      </ModalHeader>
      <ModalBody>
        {msg && <Alert variant={msgType} title={msgType === 'success' ? 'Sucesso' : 'Erro'}>{msg}</Alert>}
        <ProviderSettings
          ref={providerSettingsRef}
          initialData={provider || undefined}
          onSubmit={handleSubmit}
          isLoading={loading}
          tenants={tenants}
          isSuperAdmin={isSuperAdmin}
          renderFooter={() => (
            <div className="flex flex-row-reverse gap-2 w-full mt-6">
              <Button type="submit" loading={loading} disabled={loading} leftIcon={<Save className="w-4 h-4" />}>
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