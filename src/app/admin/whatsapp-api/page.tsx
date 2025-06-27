'use client';
import { useEffect, useState } from 'react';
import ProviderSettings, { ProviderType } from '@/components/admin/instances/modal-parts/ProviderSettings';
import { Card, CardHeader, CardTitle, CardContent, Button, Alert } from '@/components/brand';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface Provider {
  name: string;
  provider_type: ProviderType;
  server_url: string;
  api_key: string;
}

export default function WhatsappApiPage() {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchProvider = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/providers/list');
      const data = await res.json();
      if (res.ok && data.providers && data.providers.length > 0) {
        setProvider(data.providers[0]);
      } else {
        setProvider(null);
      }
    } catch (err) {
      setError('Erro ao buscar provedor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProvider();
  }, []);

  const handleSubmit = async (data: Provider) => {
    setFormLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/providers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || 'Erro ao salvar provedor.');
      } else {
        setSuccess('Provedor salvo com sucesso!');
        fetchProvider();
      }
    } catch (err) {
      setError('Erro ao salvar provedor.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!provider) return;
    setFormLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/providers/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider_type: provider.provider_type }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || 'Erro ao deletar provedor.');
      } else {
        setSuccess('Provedor removido com sucesso!');
        setProvider(null);
      }
    } catch (err) {
      setError('Erro ao deletar provedor.');
    } finally {
      setFormLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Configuração do Provedor WhatsApp API</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Carregando...</div>
          ) : provider && !editMode ? (
            <div className="space-y-4">
              <div>
                <div className="font-semibold">Nome:</div>
                <div>{provider.name}</div>
              </div>
              <div>
                <div className="font-semibold">Tipo:</div>
                <div>{provider.provider_type}</div>
              </div>
              <div>
                <div className="font-semibold">URL:</div>
                <div>{provider.server_url}</div>
              </div>
              <div>
                <div className="font-semibold">API Key:</div>
                <div className="truncate max-w-xs">{'*'.repeat(provider.api_key.length)}</div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => setEditMode(true)} variant="outline">Editar</Button>
                <Button onClick={() => setShowDeleteModal(true)} variant="destructive" loading={formLoading}>Remover</Button>
              </div>
            </div>
          ) : (
            <ProviderSettings
              initialData={provider || undefined}
              onSubmit={async (data) => {
                const result = await fetch('/api/providers/create', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                });
                const resJson = await result.json();
                if (!result.ok) {
                  setError(resJson.error || 'Erro ao salvar provedor.');
                  return { error: resJson.error || 'Erro ao salvar provedor.' };
                } else {
                  setSuccess('Provedor salvo com sucesso!');
                  fetchProvider();
                  setEditMode(false);
                  return;
                }
              }}
              isLoading={formLoading}
              error={error}
            />
          )}
          {success && <Alert variant="success" className="mt-4">{success}</Alert>}
          <ConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDelete}
            title="Remover configuração do servidor?"
            confirmText="Remover"
            cancelText="Cancelar"
            isLoading={formLoading}
          >
            Tem certeza que deseja remover a configuração do servidor WhatsApp API? Esta ação não poderá ser desfeita.
          </ConfirmationModal>
        </CardContent>
      </Card>
    </div>
  );
} 