"use client";
import React, { useReducer, useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { UserModal } from "./UserModal";
import { ConfirmationModal } from "@/components/ui";
import { ActionButton } from "@/components/ui";
import { useActions } from "@/hooks/useActions";
import { tenantService } from "@/services/tenantService";
import { Users, Plus, Edit, Trash2, Mail, User, Shield, Building, Filter, X } from "lucide-react";
import { userService } from "@/services/userService";
import { User as UserType, Empresa } from "./types";

interface UserListProps {
  isSuperAdmin: boolean;
  tenantId?: string;
}

type ModalState = 
  | { type: 'NONE' }
  | { type: 'CREATE' }
  | { type: 'EDIT', payload: UserType }
  | { type: 'DELETE', payload: UserType };

type ModalAction = 
  | { type: 'OPEN_CREATE' }
  | { type: 'OPEN_EDIT', payload: UserType }
  | { type: 'OPEN_DELETE', payload: UserType }
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

const roleDisplay: { [key: string]: string } = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  user: 'Usuário',
};

export function UserList({ isSuperAdmin, tenantId }: UserListProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalState, dispatchModal] = useReducer(modalReducer, { type: 'NONE' });
  const [users, setUsers] = useState<UserType[]>([]);
  const [empresas, setEmpresas] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados dos filtros
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterEmpresa, setFilterEmpresa] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  const { actionLoading, handleAction } = useActions();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userService.listUsers();
      const usersWithTenants = response.users.map((user) => ({
        ...user,
        nome: user.name,
        created_at: user.created_at || new Date().toISOString()
      }));
      setUsers(usersWithTenants);
      
      // Buscar empresas para super admin
      try {
        const tenantsData = await tenantService.listTenants();
        const empresasMap: {[key: string]: string} = {};
        (tenantsData.tenants || []).forEach((tenant) => {
          empresasMap[tenant.id] = tenant.name;
        });
        setEmpresas(empresasMap);
      } catch {
        // Não falhar se não conseguir buscar empresas
      }
      
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [refreshKey, fetchData]);

  // Filtrar usuários
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesRole = !filterRole || user.role === filterRole;
      const matchesEmpresa = !filterEmpresa || user.tenant_id === filterEmpresa;
      return matchesRole && matchesEmpresa;
    });
  }, [users, filterRole, filterEmpresa]);

  // Limpar filtros
  const clearFilters = () => {
    setFilterRole('');
    setFilterEmpresa('');
  };

  // Verificar se há filtros ativos
  const hasActiveFilters = filterRole || filterEmpresa;

  const handleDelete = (userId: string) => handleAction(async () => {
    // Deletar usuário usando a API
    try {
      const response = await fetch('/api/users/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar usuário');
      }
    } catch (apiError) {
      const errorMessage = apiError instanceof Error ? apiError.message : 'Erro desconhecido';
      throw new Error('Erro ao deletar usuário: ' + errorMessage);
    }
    
    toast.success("Usuário deletado com sucesso!");
    setRefreshKey(k => k + 1);
    dispatchModal({ type: 'CLOSE' });
  }, userId);

  const closeModal = () => {
    dispatchModal({ type: 'CLOSE' });
  };

  const handleSave = () => {
    closeModal();
    setRefreshKey(k => k + 1);
  };

  // Converter empresas para o formato esperado pelo UserModal
  const empresasForModal: Empresa[] = Object.entries(empresas).map(([id, name]) => ({
    id,
    name
  }));

  return (
    <div className="overflow-x-auto">
      <div className="mb-4 flex justify-between items-center">
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
                {[filterRole, filterEmpresa].filter(Boolean).length}
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
        
        <button 
          className="px-4 py-2 text-sm font-semibold text-white bg-brand-gray-dark rounded-md hover:bg-brand-gray-deep transition-colors flex items-center gap-2"
          onClick={() => dispatchModal({ type: 'OPEN_CREATE' })}
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Papel
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green-light focus:border-transparent"
              >
                <option value="">Todos os papéis</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="user">Usuário</option>
              </select>
            </div>
            
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
                {Object.entries(empresas).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      
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
                {filterRole && (
                  <span className="px-2 py-1 bg-blue-100 rounded text-xs">
                    Papel: {roleDisplay[filterRole]}
                  </span>
                )}
                {filterEmpresa && (
                  <span className="px-2 py-1 bg-blue-100 rounded text-xs">
                    Empresa: {empresas[filterEmpresa]}
                  </span>
                )}
                <span className="text-blue-600">
                  ({filteredUsers.length} de {users.length} usuários)
                </span>
              </div>
            </div>
          )}

          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 border text-left">Nome</th>
                <th className="px-4 py-3 border text-left">E-mail</th>
                <th className="px-4 py-3 border text-left">Papel</th>
                <th className="px-4 py-3 border text-left">Empresa</th>
                <th className="px-4 py-3 border text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isLoading = actionLoading === user.id;
                  return (
                    <tr key={user.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 border font-medium">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{user.name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 border">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{user.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 border">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-gray-400" />
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            (user.role as string) === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                            (user.role as string) === 'admin' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {roleDisplay[user.role] || user.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 border">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span>{empresas[user.tenant_id || ''] || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 border">
                        <div className="flex gap-2 items-center">
                          <ActionButton
                            icon={Edit}
                            onClick={() => dispatchModal({ type: 'OPEN_EDIT', payload: user })}
                            variant="secondary"
                            disabled={isLoading}
                            title="Editar"
                          />
                          <ActionButton
                            icon={Trash2}
                            onClick={() => dispatchModal({ type: 'OPEN_DELETE', payload: user })}
                            variant="destructive"
                            disabled={isLoading}
                            loading={isLoading}
                            title="Deletar"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium">
                      {hasActiveFilters ? 'Nenhum usuário encontrado com os filtros aplicados' : 'Nenhum usuário encontrado'}
                    </p>
                    <p className="text-sm">
                      {hasActiveFilters 
                        ? 'Tente ajustar os filtros ou use o botão "Limpar" para remover os filtros.'
                        : 'Use o botão "Novo Usuário" para criar o primeiro.'
                      }
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Modal de criação/edição */}
          <UserModal
            isOpen={modalState.type === 'CREATE' || modalState.type === 'EDIT'}
            onClose={closeModal}
            onSave={handleSave}
            user={modalState.type === 'EDIT' ? modalState.payload : undefined}
            isSuperAdmin={isSuperAdmin}
            tenantId={tenantId}
            empresas={empresasForModal}
          />

          {/* Modal de confirmação de exclusão */}
          <ConfirmationModal
            isOpen={modalState.type === 'DELETE'}
            onClose={closeModal}
            onConfirm={() => handleDelete(modalState.type === 'DELETE' ? modalState.payload.id : '')}
            title="Confirmar Exclusão"
            confirmText="Excluir"
            cancelText="Cancelar"
            isLoading={actionLoading === (modalState.type === 'DELETE' ? modalState.payload.id : '')}
          >
            <p>
              Tem certeza que deseja excluir o usuário <span className="font-semibold">&quot;{modalState.type === 'DELETE' ? modalState.payload.name : ''}&quot;</span>? 
              Esta ação não pode ser desfeita.
            </p>
          </ConfirmationModal>
        </>
      )}
    </div>
  );
} 