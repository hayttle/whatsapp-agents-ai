'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Alert } from '@/components/brand';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { ProviderModal } from '@/components/admin/providers/ProviderModal';
import { ProviderType } from '@/components/admin/providers/ProviderSettings';
import ProviderList, { ProviderListItem } from '@/components/admin/providers/ProviderList';
import { userService } from '@/services/userService';
import { Server } from 'lucide-react';
import { tenantService } from '@/services/tenantService';

interface Provider {
  id: string;
  name: string;
  provider_type: ProviderType;
  server_url: string;
  api_key: string;
  tenant_id?: string;
}

export default function WhatsappApiPage() {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [empresas, setEmpresas] = useState<Record<string, string>>({});
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [selectedProviderType, setSelectedProviderType] = useState<string>('');

  const fetchProvider = async () => {
    setLoading(true);
    try {
      const data = await (await fetch('/api/providers/list')).json();
      if (data.providers && data.providers.length > 0) {
        setProviders(data.providers);
      } else {
        setProviders([]);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchUserAndEmpresas() {
      const user = await userService.getCurrentUser();
      setIsSuperAdmin(user.role === 'super_admin');
      if (user.role === 'super_admin') {
        const data = await tenantService.listTenants();
        const map: Record<string, string> = {};
        data.tenants.forEach(t => { map[t.id] = t.name; });
        setEmpresas(map);
      }
    }
    fetchUserAndEmpresas();
  }, []);

  useEffect(() => {
    fetchProvider();
  }, []);

  const handleDelete = async (id: string) => {
    setFormLoading(true);
    try {
      await fetch('/api/providers/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setSuccess('Provedor removido com sucesso!');
      fetchProvider();
      setTimeout(() => setSuccess(null), 2000);
    } catch {} finally {
      setFormLoading(false);
      setDeleteId(null);
    }
  };

  const filteredProviders = providers.filter(p => {
    if (isSuperAdmin && selectedTenant && p.tenant_id !== selectedTenant) return false;
    if (selectedProviderType && p.provider_type !== selectedProviderType) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto mt-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-brand-green-light rounded-lg flex items-center justify-center">
            <Server className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-brand-gray-dark">
              {isSuperAdmin ? 'Gerenciar Provedores' : 'Meus Provedores'}
            </h1>
            <p className="text-gray-600">
              {isSuperAdmin
                ? 'Gerencie todos os provedores de API WhatsApp do sistema'
                : 'Gerencie seus provedores de API WhatsApp'}
            </p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          {isSuperAdmin && (
            <select
              className="w-full md:w-60 border rounded px-3 py-2 text-sm"
              value={selectedTenant}
              onChange={e => setSelectedTenant(e.target.value)}
            >
              <option value="">Todas as empresas</option>
              {Object.entries(empresas).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          )}
          <select
            className="w-full md:w-60 border rounded px-3 py-2 text-sm"
            value={selectedProviderType}
            onChange={e => setSelectedProviderType(e.target.value)}
          >
            <option value="">Todos os tipos</option>
            <option value="evolution">Evolution</option>
            <option value="zapi">Z-API</option>
          </select>
          <Button
            className="px-4 py-2 text-sm font-semibold text-white bg-brand-gray-dark rounded-md hover:bg-brand-gray-deep transition-colors flex items-center gap-2 whitespace-nowrap md:ml-auto"
            onClick={() => { setProvider(null); setShowModal(true); }}
          >
            <span className="text-lg">+</span> Novo Provedor
          </Button>
        </div>
      </div>
      <Card>
        <CardContent>
          {loading ? (
            <div>Carregando...</div>
          ) : !editMode ? (
            <ProviderList
              providers={filteredProviders.map(p => ({ ...p, tenantName: isSuperAdmin ? empresas[p.tenant_id || ''] : undefined }))}
              onEdit={(prov: ProviderListItem) => { setEditMode(true); setProvider({ ...prov, provider_type: prov.provider_type as ProviderType }); setShowModal(true); }}
              onDelete={(id: string) => setDeleteId(id)}
              loading={loading}
              isSuperAdmin={isSuperAdmin}
            />
          ) : null}
          {success && <Alert variant="success" className="mt-4">{success}</Alert>}
          <ConfirmationModal
            isOpen={!!deleteId}
            onClose={() => setDeleteId(null)}
            onConfirm={() => deleteId && handleDelete(deleteId)}
            title="Remover configuração do servidor?"
            confirmText="Remover"
            cancelText="Cancelar"
            isLoading={formLoading}
          >
            Tem certeza que deseja remover a configuração do servidor WhatsApp API? Esta ação não poderá ser desfeita.
          </ConfirmationModal>
        </CardContent>
      </Card>
      <ProviderModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditMode(false); setProvider(null); }}
        onSaved={() => { setShowModal(false); setEditMode(false); setProvider(null); fetchProvider(); }}
        provider={provider}
      />
    </div>
  );
} 