"use client";
import React, { useReducer, useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import TenantModal from "./TenantModal";
import { ConfirmationModal } from "@/components/ui";
import { ActionButton } from "@/components/ui";
import { useActions } from "@/hooks/useActions";
import { tenantService, Tenant } from "@/services/tenantService";
import { Building2, Plus, Edit, Trash2, Filter, X } from "lucide-react";
import { Button } from "@/components/brand";
import { AdminListLayout } from '@/components/layout/AdminListLayout';
import { COMPANY_TYPE_LABELS, COMPANY_TYPE_OPTIONS } from './constants';

interface TenantListProps {
  isSuperAdmin: boolean;
}

type ModalState =
  | { type: 'NONE' }
  | { type: 'CREATE' }
  | { type: 'EDIT', payload: Tenant }
  | { type: 'DELETE', payload: Tenant };

type ModalAction =
  | { type: 'OPEN_CREATE' }
  | { type: 'OPEN_EDIT', payload: Tenant }
  | { type: 'OPEN_DELETE', payload: Tenant }
  | { type: 'CLOSE' };

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
  switch (action.type) {
    case 'OPEN_CREATE':
      return { type: 'CREATE' };
    case 'OPEN_EDIT':
      return { type: 'EDIT', payload: action.payload };
    case 'OPEN_DELETE':
      return { type: 'DELETE', payload: action.payload };
    case 'CLOSE':
      return { type: 'NONE' };
    default:
      return state;
  }
};

export function TenantList({ isSuperAdmin }: TenantListProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalState, dispatchModal] = useReducer(modalReducer, { type: 'NONE' });
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados dos filtros
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const { actionLoading, handleAction } = useActions();

  // Buscar tenants
  const fetchTenants = async () => {
    try {
      setLoading(true);
      const data = await tenantService.listTenants();
      setTenants(data.tenants || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };

  // Carregar tenants quando o componente montar ou refreshKey mudar
  useEffect(() => {
    fetchTenants();
  }, [refreshKey]);

  // Filtrar tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter(tenant => {
      const matchesStatus = !filterStatus || tenant.status === filterStatus;
      const matchesType = !filterType || tenant.type === filterType;
      const matchesSearch = !filterSearch ||
        tenant.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
        tenant.email?.toLowerCase().includes(filterSearch.toLowerCase()) ||
        tenant.cpf_cnpj?.toLowerCase().includes(filterSearch.toLowerCase());
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [tenants, filterStatus, filterType, filterSearch]);

  // Limpar filtros
  const clearFilters = () => {
    setFilterStatus('');
    setFilterType('');
    setFilterSearch('');
  };

  // Verificar se há filtros ativos
  const hasActiveFilters = filterStatus || filterType || filterSearch;

  const handleDelete = (tenantId: string) => handleAction(async () => {
    try {
      await tenantService.deleteTenant(tenantId);
      toast.success("Empresa deletada com sucesso!");
      setRefreshKey(k => k + 1);
      dispatchModal({ type: 'CLOSE' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(errorMessage);
      throw err;
    }
  }, tenantId);

  const closeModal = () => {
    dispatchModal({ type: 'CLOSE' });
  };

  const handleSave = () => {
    closeModal();
    setRefreshKey(k => k + 1);
  };

  return (
    <>
      <AdminListLayout
        icon={<Building2 className="w-6 h-6 text-white" />}
        pageTitle="Empresas"
        pageDescription="Gerencie as empresas (tenants) cadastradas na plataforma."
        cardTitle="Lista de Empresas"
        cardDescription="Visualize, filtre, crie e edite empresas."
        actionButton={isSuperAdmin && (
          <Button
            variant="add"
            onClick={() => {
              dispatchModal({ type: 'OPEN_CREATE' });
            }}
          >
            <Plus className="w-4 h-4" />
            Nova Empresa
          </Button>
        )}
        filtersOpen={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
      >
        <AdminListLayout.Filters>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green-light focus:border-transparent"
              >
                <option value="">Todos os tipos</option>
                {COMPANY_TYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Busca
              </label>
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Nome, e-mail ou CPF/CNPJ"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green-light focus:border-transparent"
              />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-4 flex gap-2">
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
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green-light"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">{error}</div>
          ) : (
            <>
              {/* Resumo dos filtros */}
              {hasActiveFilters && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <Filter className="w-4 h-4" />
                    <span className="font-medium">Filtros ativos:</span>
                    {filterStatus && (
                      <span className="px-2 py-1 bg-blue-100 rounded text-xs">
                        Status: {filterStatus === 'active' ? 'Ativa' : 'Inativa'}
                      </span>
                    )}
                    {filterType && (
                      <span className="px-2 py-1 bg-blue-100 rounded text-xs">
                        Tipo: {COMPANY_TYPE_LABELS[filterType as keyof typeof COMPANY_TYPE_LABELS]}
                      </span>
                    )}
                    {filterSearch && (
                      <span className="px-2 py-1 bg-blue-100 rounded text-xs">
                        Busca: {filterSearch}
                      </span>
                    )}
                    <span className="text-blue-600">
                      ({filteredTenants.length} de {tenants.length} empresas)
                    </span>
                  </div>
                </div>
              )}
              <table className="min-w-full text-sm border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 border text-left">Nome</th>
                    <th className="px-4 py-3 border text-left">E-mail</th>
                    <th className="px-4 py-3 border text-left">CPF/CNPJ</th>
                    <th className="px-4 py-3 border text-left">Telefone</th>
                    <th className="px-4 py-3 border text-left">Tipo</th>
                    <th className="px-4 py-3 border text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.length > 0 ? (
                    filteredTenants.map((tenant) => {
                      const isLoading = actionLoading === tenant.id;
                      return (
                        <tr key={tenant.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3 border font-medium">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span>{tenant.name || '-'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 border">{tenant.email || '-'}</td>
                          <td className="px-4 py-3 border">{tenant.cpf_cnpj || '-'}</td>
                          <td className="px-4 py-3 border">{tenant.phone || '-'}</td>
                          <td className="px-4 py-3 border">{COMPANY_TYPE_LABELS[tenant.type as keyof typeof COMPANY_TYPE_LABELS] || tenant.type}</td>
                          <td className="px-4 py-3 border">
                            <div className="flex gap-2 items-center">
                              <ActionButton
                                icon={Edit}
                                onClick={() => dispatchModal({ type: 'OPEN_EDIT', payload: tenant })}
                                variant="ghost"
                                disabled={isLoading}
                                title="Editar"
                              />
                              <ActionButton
                                icon={Trash2}
                                onClick={() => dispatchModal({ type: 'OPEN_DELETE', payload: tenant })}
                                variant="iconDestructive"
                                disabled={isLoading}
                                loading={isLoading}
                                title="Remover"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="font-medium">
                          {hasActiveFilters ? 'Nenhuma empresa encontrada com os filtros aplicados' : 'Nenhuma empresa encontrada'}
                        </p>
                        <p className="text-sm">
                          {hasActiveFilters
                            ? 'Tente ajustar os filtros ou use o botão "Limpar" para remover os filtros.'
                            : 'Use o botão "Nova Empresa" para criar a primeira.'
                          }
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}
        </AdminListLayout.List>
      </AdminListLayout>

      {/* Modais renderizados fora do layout para evitar problemas de z-index */}
      <TenantModal
        isOpen={modalState.type === 'CREATE' || modalState.type === 'EDIT'}
        onClose={closeModal}
        onSave={handleSave}
        tenant={modalState.type === 'EDIT' ? modalState.payload : undefined}
      />
      <ConfirmationModal
        isOpen={modalState.type === 'DELETE'}
        onClose={closeModal}
        onConfirm={() => {
          if (modalState.type === 'DELETE') {
            handleDelete(modalState.payload.id);
          }
        }}
        title="Confirmar Remoção"
        confirmText="Remover"
        cancelText="Cancelar"
        isLoading={actionLoading === (modalState.type === 'DELETE' ? modalState.payload?.id : '')}
      >
        <p>
          Tem certeza que deseja remover a empresa <span className="font-semibold">&quot;{modalState.type === 'DELETE' ? modalState.payload?.name : ''}&quot;</span>?
          Esta ação não pode ser desfeita.
        </p>
      </ConfirmationModal>
    </>
  );
} 