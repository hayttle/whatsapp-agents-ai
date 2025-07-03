import { Button } from '@/components/brand';
import { Edit, Trash2, Server, Plus, Filter, X } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { AdminListLayout } from '@/components/layout/AdminListLayout';

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

export default function ProviderList({ providers, onEdit, onDelete, onCreate, loading, isSuperAdmin }: ProviderListProps) {
  // Estados dos filtros
  const [filterEmpresa, setFilterEmpresa] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Filtrar provedores
  const filteredProviders = useMemo(() => {
    return providers.filter(provider => {
      const matchesEmpresa = !filterEmpresa || provider.tenant_id === filterEmpresa;
      const matchesSearch = !filterSearch || provider.name.toLowerCase().includes(filterSearch.toLowerCase());
      return matchesEmpresa && matchesSearch;
    });
  }, [providers, filterEmpresa, filterSearch]);

  // Limpar filtros
  const clearFilters = () => {
    setFilterEmpresa('');
    setFilterSearch('');
  };

  // Verificar se há filtros ativos
  const hasActiveFilters = filterEmpresa || filterSearch;

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <AdminListLayout
      icon={<Server className="w-6 h-6 text-white" />}
      pageTitle="Provedores de API"
      pageDescription="Gerencie os provedores de API conectados à plataforma."
      cardTitle="Lista de Provedores"
      cardDescription="Visualize, filtre, crie e edite provedores de API."
      actionButton={onCreate && (
        <Button
          variant="add"
          onClick={onCreate}
          type="button"
        >
          <Plus className="w-4 h-4" />
          Novo Provedor
        </Button>
      )}
      filtersOpen={showFilters}
      onToggleFilters={() => setShowFilters(!showFilters)}
    >
      <AdminListLayout.Filters>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isSuperAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
              <select
                value={filterEmpresa}
                onChange={(e) => setFilterEmpresa(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green-light focus:border-transparent"
              >
                <option value="">Todas as empresas</option>
                {Array.from(
                  new Map(
                    providers
                      .filter(p => p.tenant_id && p.tenantName)
                      .map(p => [p.tenant_id, p.tenantName])
                  ).entries()
                ).map(([id, name]) => (
                  <option key={id} value={id as string}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar por nome</label>
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Digite o nome do provedor..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green-light focus:border-transparent"
            />
          </div>
        </div>
        {hasActiveFilters && (
          <div className="mt-4 mb-2">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-2 text-sm text-blue-800">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filtros ativos:</span>
              {filterEmpresa && (
                <span className="px-2 py-1 bg-blue-100 rounded text-xs">
                  Empresa: {providers.find(p => p.tenant_id === filterEmpresa)?.tenantName || filterEmpresa}
                </span>
              )}
              {filterSearch && (
                <span className="px-2 py-1 bg-blue-100 rounded text-xs">
                  Busca: "{filterSearch}"
                </span>
              )}
              <span className="text-blue-600">
                ({filteredProviders.length} de {providers.length} provedores)
              </span>
            </div>
          </div>
        )}
        {hasActiveFilters && (
          <div className="flex gap-2 mb-4">
            <Button
              variant="secondary"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Limpar
            </Button>
          </div>
        )}
      </AdminListLayout.Filters>
      <AdminListLayout.List>
        {/* Lista ou grid de provedores */}
        {filteredProviders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="w-12 h-12 mx-auto mb-4 text-gray-300">
              <Server className="w-12 h-12" />
            </div>
            <p className="font-medium">
              {hasActiveFilters ? 'Nenhum provedor encontrado com os filtros aplicados' : 'Nenhum provedor cadastrado'}
            </p>
            <p className="text-sm">
              {hasActiveFilters
                ? 'Tente ajustar os filtros ou use o botão "Limpar" para remover os filtros.'
                : 'Use o botão "Novo Provedor" para criar o primeiro.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProviders.map((provider) => (
              <div key={provider.id} className="flex flex-col p-6 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                {/* Header do card com badge alinhado */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Server className="w-6 h-6 text-brand-green-light" />
                    <h3 className="font-semibold text-lg text-gray-900">{provider.name}</h3>
                  </div>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                    Evolution API
                  </span>
                </div>

                {/* Informações do provedor */}
                <div className="space-y-3 mb-6">
                  {isSuperAdmin && provider.tenantName && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-gray-600 min-w-[60px]">Empresa:</span>
                      <span className="text-sm text-gray-900">{provider.tenantName}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-gray-600 min-w-[60px]">URL:</span>
                    <span className="text-sm text-gray-900 break-all">{provider.server_url}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-gray-600 min-w-[60px]">API Key:</span>
                    <span className="text-sm text-gray-900 font-mono">
                      {provider.api_key.length > 20
                        ? `${'*'.repeat(8)}...${'*'.repeat(8)}`
                        : '*'.repeat(provider.api_key.length)
                      }
                    </span>
                  </div>
                </div>

                {/* Separador visual */}
                <div className="border-t border-gray-200 mb-4"></div>

                {/* Botões de ação */}
                <div className="flex gap-3 mt-auto">
                  <Button
                    onClick={() => onEdit(provider)}
                    variant="outline"
                    size="sm"
                    leftIcon={<Edit className="w-4 h-4" />}
                    className="flex-1"
                  >
                    Editar
                  </Button>
                  <Button
                    onClick={() => onDelete(provider.id)}
                    variant="destructive"
                    size="sm"
                    leftIcon={<Trash2 className="w-4 h-4" />}
                    className="flex-1"
                  >
                    Remover
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminListLayout.List>
    </AdminListLayout>
  );
} 