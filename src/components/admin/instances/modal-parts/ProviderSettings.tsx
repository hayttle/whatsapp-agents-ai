import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Select, Alert } from '@/components/brand';
import { Eye, EyeOff } from 'lucide-react';

export type ProviderType = 'evolution' | 'zapi';

export interface ProviderSettingsProps {
  initialData?: {
    name: string;
    provider_type: ProviderType;
    server_url: string;
    api_key: string;
  };
  onSubmit: (data: {
    name: string;
    provider_type: ProviderType;
    server_url: string;
    api_key: string;
  }) => Promise<void | { error?: string }>;
  isLoading?: boolean;
  error?: string | null;
}

const PROVIDER_OPTIONS = [
  { value: 'evolution', label: 'Evolution API' },
  { value: 'zapi', label: 'Z-API' },
];

export default function ProviderSettings({ initialData, onSubmit, isLoading, error }: ProviderSettingsProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [providerType, setProviderType] = useState<ProviderType>(initialData?.provider_type || 'evolution');
  const [serverUrl, setServerUrl] = useState(initialData?.server_url || '');
  const [apiKey, setApiKey] = useState(initialData?.api_key || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [httpsWarning, setHttpsWarning] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const apiKeyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormError(error || null);
  }, [error]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setProviderType(initialData.provider_type);
      setServerUrl(initialData.server_url);
      setApiKey(initialData.api_key);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setHttpsWarning(false);
    if (!name || !providerType || !serverUrl || !apiKey) {
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
      provider_type: providerType,
      server_url: serverUrl,
      api_key: apiKey,
    });
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      if (result.error.toLowerCase().includes('url')) {
        urlInputRef.current?.focus();
      } else if (result.error.toLowerCase().includes('api key')) {
        apiKeyInputRef.current?.focus();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nome do Servidor *</label>
        <Input value={name} onChange={e => setName(e.target.value)} required disabled={isLoading} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Tipo de Provedor *</label>
        <Select value={providerType} onChange={e => setProviderType(e.target.value as ProviderType)} disabled={isLoading}>
          {PROVIDER_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
      </div>
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
            {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {formError ? (
        <Alert variant="error" title="Erro" className="mt-2">{formError}</Alert>
      ) : error ? (
        <Alert variant="error" title="Erro" className="mt-2">{error}</Alert>
      ) : null}
      <Button type="submit" loading={isLoading} className="w-full mt-2">Salvar</Button>
    </form>
  );
} 