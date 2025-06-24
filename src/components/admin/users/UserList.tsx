"use client";
import React, { useReducer, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { UserModal } from "./UserModal";
import { ConfirmationModal } from "@/components/ui";
import { ActionButton } from "@/components/ui";
import { useActions } from "@/hooks/useActions";
import { tenantService } from "@/services/tenantService";
import { Users, Plus, Edit, Trash2, Mail, User, Shield, Building } from "lucide-react";
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
  
  const { actionLoading, handleAction } = useActions();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userService.listUsers(tenantId);
      const usersWithTenants = response.users.map((user) => ({
        ...user,
        nome: user.name,
        created_at: user.created_at || new Date().toISOString()
      }));
      setUsers(usersWithTenants);
      
      // Buscar empresas se for super admin
      if (isSuperAdmin) {
        try {
          const tenantsData = await tenantService.listTenants();
          const empresasMap: {[key: string]: string} = {};
          (tenantsData.tenants || []).forEach((tenant) => {
            empresasMap[tenant.id] = tenant.name;
          });
          setEmpresas(empresasMap);
        } catch (empresasError) {
          console.error('Error fetching empresas:', empresasError);
          // Não falhar se não conseguir buscar empresas
        }
      }
      
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, [tenantId, isSuperAdmin]);

  useEffect(() => {
    fetchData();
  }, [refreshKey, isSuperAdmin, tenantId, fetchData]);

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

  // Filtrar usuários por tenant se não for super admin
  const filteredUsers = isSuperAdmin ? users : users.filter((u) => u.tenant_id === tenantId);

  // Converter empresas para o formato esperado pelo UserModal
  const empresasForModal: Empresa[] = Object.entries(empresas).map(([id, name]) => ({
    id,
    name
  }));

  return (
    <div className="overflow-x-auto">
      {(isSuperAdmin || tenantId) && (
        <div className="mb-4 flex justify-end">
          <button 
            className="px-4 py-2 text-sm font-semibold text-white bg-brand-gray-dark rounded-md hover:bg-brand-gray-deep transition-colors flex items-center gap-2"
            onClick={() => dispatchModal({ type: 'OPEN_CREATE' })}
          >
            <Plus className="w-4 h-4" />
            Novo Usuário
          </button>
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
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 border text-left">Nome</th>
                <th className="px-4 py-3 border text-left">E-mail</th>
                <th className="px-4 py-3 border text-left">Papel</th>
                {isSuperAdmin && <th className="px-4 py-3 border text-left">Empresa</th>}
                {(isSuperAdmin || tenantId) && <th className="px-4 py-3 border text-left">Ações</th>}
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
                            user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {roleDisplay[user.role] || user.role}
                          </span>
                        </div>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-4 py-3 border">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-gray-400" />
                            <span>{empresas[user.tenant_id || ''] || '-'}</span>
                          </div>
                        </td>
                      )}
                      {(isSuperAdmin || tenantId) && (
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
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={(isSuperAdmin || tenantId) ? (isSuperAdmin ? 5 : 4) : 3} className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium">Nenhum usuário encontrado</p>
                    <p className="text-sm">Use o botão &quot;Novo Usuário&quot; para criar o primeiro.</p>
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