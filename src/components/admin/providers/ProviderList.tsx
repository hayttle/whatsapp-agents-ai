import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/brand';
import { Edit, Trash2, Server } from 'lucide-react';
import React from 'react';

export interface ProviderListItem {
  id: string;
  name: string;
  provider_type: string;
  server_url: string;
  api_key: string;
  tenant_id?: string;
  tenantName?: string;
}

interface ProviderListProps {
  providers: ProviderListItem[];
  onEdit: (provider: ProviderListItem) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
  isSuperAdmin?: boolean;
}

const PROVIDER_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  evolution: { label: 'Evolution', color: 'bg-green-100 text-green-800' },
  zapi: { label: 'Z-API', color: 'bg-blue-100 text-blue-800' },
};

export default function ProviderList({ providers, onEdit, onDelete, loading, isSuperAdmin }: ProviderListProps) {
  if (loading) {
    return <div>Carregando...</div>;
  }
  if (!providers.length) {
    return <div className="text-center text-gray-500 py-8">Nenhum provedor cadastrado.</div>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {providers.map((provider) => (
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
  );
} 