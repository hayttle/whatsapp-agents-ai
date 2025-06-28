import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Input, Select, Alert } from '@/components/brand';
import { Eye, EyeOff } from 'lucide-react';
import { Tooltip } from '@/components/ui';

export type ProviderType = 'evolution';

export interface ProviderSettingsProps {
  initialData?: {
    name: string;
    provider_type: ProviderType;
    server_url: string;
    api_key: string;
    tenant_id?: string;
  };
  onSubmit: (data: {
    name: string;
    provider_type: ProviderType;
    server_url: string;
    api_key: string;
    tenant_id?: string;
  }) => Promise<void | { error?: string }>;
  isLoading?: boolean;
  error?: string | null;
  renderFooter?: () => React.ReactNode;
  tenants?: { id: string; name: string }[];
  isSuperAdmin?: boolean;
}

const ProviderSettings = forwardRef(function ProviderSettings({ initialData, onSubmit, isLoading, error, renderFooter, tenants = [], isSuperAdmin = false }: ProviderSettingsProps, ref) {
  const [name, setName] = useState(initialData?.name || '');
  const [serverUrl, setServerUrl] = useState(initialData?.server_url || '');
  const [apiKey, setApiKey] = useState(initialData?.api_key || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [httpsWarning, setHttpsWarning] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const apiKeyInputRef = useRef<HTMLInputElement>(null);
  const [tenantId, setTenantId] = useState(initialData?.tenant_id || (tenants[0]?.id || ''));

  useEffect(() => {
    setFormError(error || null);
  }, [error]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setServerUrl(initialData.server_url);
      setApiKey(initialData.api_key);
      setTenantId(initialData.tenant_id || (tenants[0]?.id || ''));
    }
  }, [initialData, tenants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setHttpsWarning(false);
    if (!name || !serverUrl || !apiKey || (isSuperAdmin && !tenantId)) {
      setFormError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (!serverUrl.startsWith('https://')) {
      setHttpsWarning(true);
      setFormError('A URL do servidor deve começar com https://');
      urlInputRef.current?.focus();
      return;
    }
    const result = await onSubmit({
      name,
      provider_type: 'evolution',
      server_url: serverUrl,
      api_key: apiKey,
      ...(isSuperAdmin ? { tenant_id: tenantId } : {}),
    });
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      if (result.error.toLowerCase().includes('url')) {
        urlInputRef.current?.focus();
      } else if (result.error.toLowerCase().includes('api key')) {
        apiKeyInputRef.current?.focus();
      }
    }
  };

  useImperativeHandle(ref, () => ({
    focusUrl: () => urlInputRef.current?.focus(),
    focusApiKey: () => apiKeyInputRef.current?.focus(),
  }));

  return (
    <form id="provider-form" onSubmit={handleSubmit} className="space-y-4">
      {formError && !formError.toLowerCase().includes('https://') && (
        <Alert variant="error" title="Erro" className="mb-2">{formError}</Alert>
      )}
      {error && !error.toLowerCase().includes('https://') && (
        <Alert variant="error" title="Erro" className="mb-2">{error}</Alert>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">Nome do Servidor *</label>
        <Input value={name} onChange={e => setName(e.target.value)} required disabled={isLoading} />
      </div>
      {isSuperAdmin && (
        <div>
          <label className="block text-sm font-medium mb-1">Empresa *</label>
          <Select value={tenantId} onChange={e => setTenantId(e.target.value)} required disabled={isLoading}>
            <option value="">Selecione a empresa</option>
            {tenants.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">URL do Servidor *</label>
        <Input ref={urlInputRef} value={serverUrl} onChange={e => setServerUrl(e.target.value)} required disabled={isLoading} placeholder="https://exemplo.com" />
        {httpsWarning && (
          <div className="text-xs text-yellow-600 mt-1">O servidor deve usar <b>HTTPS</b> por questões de segurança.</div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">API Key *</label>
        <div className="relative flex items-center">
          <Input
            ref={apiKeyInputRef}
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            required
            disabled={isLoading}
            className="pr-10"
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={() => setShowApiKey(v => !v)}
            aria-label={showApiKey ? 'Ocultar API Key' : 'Exibir API Key'}
          >
            <Tooltip content={showApiKey ? 'Ocultar API Key' : 'Exibir API Key'}>
              {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </Tooltip>
          </button>
        </div>
      </div>
      {renderFooter && renderFooter()}
    </form>
  );
});

export default ProviderSettings; 