import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/brand';
import { Edit, Trash2, Server, Plus } from 'lucide-react';
import React, { useState } from 'react';

export interface ProviderListItem {
  id: string;
  name: string;
  provider_type: string;
  server_url: string;
  api_key: string;
  tenant_id?: string;
  tenantName?: string;
  active: boolean;
}

interface ProviderListProps {
  providers: ProviderListItem[];
  onEdit: (provider: ProviderListItem) => void;
  onDelete: (id: string) => void;
  onCreate?: () => void;
  loading?: boolean;
  isSuperAdmin?: boolean;
}

const PROVIDER_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  evolution: { label: 'Evolution', color: 'bg-green-100 text-green-800' },
  zapi: { label: 'Z-API', color: 'bg-blue-100 text-blue-800' },
};

export default function ProviderList({ providers, onEdit, onDelete, onCreate, loading, isSuperAdmin }: ProviderListProps) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [empresaFilter, setEmpresaFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  let filteredProviders = providers;
  if (typeFilter !== 'all') {
    filteredProviders = filteredProviders.filter(p => p.provider_type === typeFilter);
  }
  if (isSuperAdmin && empresaFilter !== 'all') {
    filteredProviders = filteredProviders.filter(p => p.tenant_id === empresaFilter);
  }
  if (searchTerm.trim() !== '') {
    filteredProviders = filteredProviders.filter(p => p.name.toLowerCase().includes(searchTerm.trim().toLowerCase()));
  }

  if (loading) {
    return <div>Carregando...</div>;
  }
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
      <h2 className="text-lg font-semibold mb-1">Provedores do WhatsApp</h2>
      <p className="text-gray-600 text-sm mb-6">Visualize e gerencie todos os provedores de WhatsApp do sistema</p>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-sm font-medium">Tipo:</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="evolution">Evolution</option>
            <option value="zapi">Z-API</option>
          </select>
          {isSuperAdmin && (
            <>
              <label className="text-sm font-medium ml-4">Empresa:</label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={empresaFilter}
                onChange={e => setEmpresaFilter(e.target.value)}
              >
                <option value="all">Todas</option>
                {Array.from(
                  new Map(
                    providers
                      .filter(p => p.tenant_id && p.tenantName)
                      .map(p => [p.tenant_id, p.tenantName])
                  ).entries()
                ).map(([id, name]) => (
                  <option key={id} value={id as string}>{name}</option>
                ))}
              </select>
            </>
          )}
          <input
            type="text"
            className="border rounded px-2 py-1 text-sm ml-4"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ minWidth: 180 }}
          />
        </div>
        {onCreate && (
          <Button
            variant="add"
            onClick={onCreate}
            leftIcon={<Plus className="w-4 h-4" />}
            type="button"
          >
            Novo Provedor
          </Button>
        )}
      </div>
      {filteredProviders.length === 0 ? (
        <div className="text-center text-gray-500 py-8">Nenhum provedor cadastrado.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((provider) => (
            <Card key={provider.id} className="flex flex-col p-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-brand-green-light" />
                  <span className="font-semibold">{provider.name}</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${PROVIDER_TYPE_LABELS[provider.provider_type]?.color || 'bg-gray-200 text-gray-700'}`}>{PROVIDER_TYPE_LABELS[provider.provider_type]?.label || provider.provider_type}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-2">
                {isSuperAdmin && provider.tenantName && (
                  <div>
                    <span className="font-semibold">Empresa:</span> {provider.tenantName}
                  </div>
                )}
                <div>
                  <span className="font-semibold">URL:</span> {provider.server_url}
                </div>
                <div>
                  <span className="font-semibold">API Key:</span> {'*'.repeat(provider.api_key.length)}
                </div>
              </CardContent>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => onEdit(provider)} variant="outline" size="sm" leftIcon={<Edit className="w-4 h-4" />}>Editar</Button>
                <Button onClick={() => onDelete(provider.id)} variant="destructive" size="sm" leftIcon={<Trash2 className="w-4 h-4" />}>Remover</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 