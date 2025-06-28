import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/brand';
import { Edit, Trash2, Server, Plus, Filter, X } from 'lucide-react';
import React, { useState, useMemo } from 'react';

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
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
      <h2 className="text-lg font-semibold mb-1">Provedores do WhatsApp</h2>
      <p className="text-gray-600 text-sm mb-6">Visualize e gerencie todos os provedores de WhatsApp do sistema</p>
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button 
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
              showFilters 
                ? 'bg-brand-green-light text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                {[filterEmpresa, filterSearch].filter(Boolean).length}
              </span>
            )}
          </button>
          
          {hasActiveFilters && (
            <button 
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
              onClick={clearFilters}
            >
              <X className="w-4 h-4" />
              Limpar
            </button>
          )}
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

      {/* Filtros */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isSuperAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empresa
                </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar por nome
              </label>
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Digite o nome do provedor..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green-light focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Resumo dos filtros */}
      {hasActiveFilters && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filtros ativos:</span>
            {filterEmpresa && (
              <span className="px-2 py-1 bg-blue-100 rounded text-xs">
                Empresa: {providers.find(p => p.tenant_id === filterEmpresa)?.tenantName || filterEmpresa}
              </span>
            )}
            {filterSearch && (
              <span className="px-2 py-1 bg-blue-100 rounded text-xs">
                Busca: &quot;{filterSearch}&quot;
              </span>
            )}
            <span className="text-blue-600">
              ({filteredProviders.length} de {providers.length} provedores)
            </span>
          </div>
        </div>
      )}

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((provider) => (
            <Card key={provider.id} className="flex flex-col p-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-brand-green-light" />
                  <span className="font-semibold">{provider.name}</span>
                  <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800">Evolution API</span>
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