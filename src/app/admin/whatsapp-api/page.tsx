'use client';
import { useEffect, useState } from 'react';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { ProviderModal } from '@/components/admin/providers/ProviderModal';
import ProviderList, { ProviderListItem } from '@/components/admin/providers/ProviderList';
import { userService } from '@/services/userService';
import { tenantService } from '@/services/tenantService';
import { toast } from 'sonner';

interface Provider {
  id: string;
  name: string;
  provider_type: 'evolution';
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
      const response = await fetch('/api/providers/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao remover provedor');
      }

      setSuccess('Provedor removido com sucesso!');
      fetchProvider();
      setTimeout(() => setSuccess(null), 2000);
    } catch {
      toast.error('Erro ao deletar provedor');
    } finally {
      setFormLoading(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {loading ? (
        <div>Carregando...</div>
      ) : !editMode ? (
        <ProviderList
          providers={providers.map(p => ({ ...p, tenantName: isSuperAdmin ? empresas[p.tenant_id || ''] : undefined, active: false }))}
          onEdit={(prov: ProviderListItem) => { setEditMode(true); setProvider({ ...prov, provider_type: 'evolution' }); setShowModal(true); }}
          onDelete={(id: string) => setDeleteId(id)}
          loading={loading}
          isSuperAdmin={isSuperAdmin}
          onCreate={() => { setProvider(null); setShowModal(true); }}
        />
      ) : null}
      {success && <div className="mt-4 text-green-600">{success}</div>}
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
      <ProviderModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditMode(false); setProvider(null); }}
        onSaved={() => { setShowModal(false); setEditMode(false); setProvider(null); fetchProvider(); }}
        provider={provider}
      />
    </div>
  );
} 