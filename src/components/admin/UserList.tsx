"use client";
import React, { useReducer, useState, useEffect } from "react";
import { toast } from "sonner";
import { UserForm } from "@/components/admin/UserForm";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import ActionButton from "@/components/ui/ActionButton";
import { useActions } from "@/hooks/useActions";
import { tenantService } from "@/services/tenantService";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Users, Plus, Edit, Trash2, Mail, User, Shield, Building } from "lucide-react";

interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
  tenant_id?: string;
  tenant_name?: string;
}

interface UserListProps {
  isSuperAdmin: boolean;
  tenantId?: string;
}

type ModalState = 
  | { type: 'NONE' }
  | { type: 'CREATE' }
  | { type: 'EDIT', payload: User }
  | { type: 'DELETE', payload: User };

type ModalAction = 
  | { type: 'OPEN_CREATE' }
  | { type: 'OPEN_EDIT', payload: User }
  | { type: 'OPEN_DELETE', payload: User }
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
  const [users, setUsers] = useState<User[]>([]);
  const [empresas, setEmpresas] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { actionLoading, handleAction } = useActions();
  const supabase = createClientComponentClient();

  // Buscar usuários e empresas
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar usuários diretamente do Supabase
      let query = supabase.from('users').select('id, email, nome, role, tenant_id');
      
      if (!isSuperAdmin && tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      
      const { data: usersData, error: usersError } = await query;
      
      if (usersError) {
        throw usersError;
      }
      
      setUsers(usersData || []);
      
      // Buscar empresas se for super admin
      if (isSuperAdmin) {
        try {
          const tenantsData = await tenantService.listTenants();
          const empresasMap: {[key: string]: string} = {};
          (tenantsData.tenants || []).forEach((tenant: any) => {
            empresasMap[tenant.id] = tenant.nome;
          });
          setEmpresas(empresasMap);
        } catch (empresasError) {
          console.error('Error fetching empresas:', empresasError);
          // Não falhar se não conseguir buscar empresas
        }
      }
      
      setError(null);
    } catch (err: any) {
      setError('Erro ao carregar usuários: ' + (err.message || 'Erro desconhecido'));
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados quando o componente montar ou refreshKey mudar
  useEffect(() => {
    fetchData();
  }, [refreshKey, isSuperAdmin, tenantId]);

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
    } catch (apiError: any) {
      throw new Error('Erro ao deletar usuário: ' + apiError.message);
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
  const filteredUsers = isSuperAdmin ? users : users.filter(user => user.tenant_id === tenantId);

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
                          <span>{user.nome || '-'}</span>
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
                            <span>{user.tenant_id ? empresas[user.tenant_id] || user.tenant_id : '-'}</span>
                          </div>
                        </td>
                      )}
                      {(isSuperAdmin || tenantId) && (
                        <td className="px-4 py-3 border">
                          <div className="flex gap-2 items-center">
                            <ActionButton
                              icon={Edit}
                              onClick={() => dispatchModal({ type: 'OPEN_EDIT', payload: user })}
                              variant="primary"
                              disabled={isLoading}
                              title="Editar"
                            />
                            <ActionButton
                              icon={Trash2}
                              onClick={() => dispatchModal({ type: 'OPEN_DELETE', payload: user })}
                              variant="danger"
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
                  <td colSpan={isSuperAdmin ? 5 : (tenantId ? 4 : 3)} className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium">Nenhum usuário encontrado</p>
                    <p className="text-sm">Use o botão "Novo Usuário" para criar o primeiro</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Modal de criação/edição */}
          {(modalState.type === 'CREATE' || modalState.type === 'EDIT') && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    {modalState.type === 'CREATE' ? 'Novo Usuário' : 'Editar Usuário'}
                  </h2>
                  <UserForm 
                    user={modalState.type === 'EDIT' ? modalState.payload : undefined}
                    isSuperAdmin={isSuperAdmin}
                    tenantId={tenantId}
                    empresas={isSuperAdmin ? Object.entries(empresas).map(([id, nome]) => ({ id, nome })) : []}
                    onSuccess={handleSave}
                    onCancel={closeModal}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal de confirmação de exclusão */}
          {modalState.type === 'DELETE' && (
            <ConfirmationModal
              isOpen={true}
              onClose={closeModal}
              onConfirm={() => handleDelete(modalState.payload.id)}
              title="Confirmar exclusão"
              confirmText="Deletar"
              isLoading={actionLoading === modalState.payload.id}
            >
              Tem certeza que deseja deletar o usuário <span className="font-semibold">&quot;{modalState.payload.nome || modalState.payload.email}&quot;</span>? 
              Essa ação não pode ser desfeita.
            </ConfirmationModal>
          )}
        </>
      )}
    </div>
  );
} 