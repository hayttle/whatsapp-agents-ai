"use client";
import React, { useReducer, useState, useEffect } from "react";
import { toast } from "sonner";
import TenantModal from "./TenantModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import ActionButton from "@/components/ui/ActionButton";
import { useActions } from "@/hooks/useActions";
import { tenantService, Tenant } from "@/services/tenantService";
import { Building2, Plus, Edit, Trash2, Mail, Phone, FileText } from "lucide-react";

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
  
  const { actionLoading, handleAction } = useActions();

  // Buscar tenants
  const fetchTenants = async () => {
    try {
      setLoading(true);
      const data = await tenantService.listTenants();
      setTenants(data.tenants || []);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar empresas');
      console.error('Error fetching tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar tenants quando o componente montar ou refreshKey mudar
  useEffect(() => {
    fetchTenants();
  }, [refreshKey]);

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
    <div className="overflow-x-auto">
      {isSuperAdmin && (
        <div className="mb-4 flex justify-end">
          <button 
            className="px-4 py-2 text-sm font-semibold text-white bg-brand-gray-dark rounded-md hover:bg-brand-gray-deep transition-colors flex items-center gap-2"
            onClick={() => dispatchModal({ type: 'OPEN_CREATE' })}
          >
            <Plus className="w-4 h-4" />
            Nova Empresa
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
                <th className="px-4 py-3 border text-left">CPF/CNPJ</th>
                <th className="px-4 py-3 border text-left">Telefone</th>
                {isSuperAdmin && <th className="px-4 py-3 border text-left">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {tenants.length > 0 ? (
                tenants.map((tenant) => {
                  const isLoading = actionLoading === tenant.id;
                  return (
                    <tr key={tenant.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 border font-medium">{tenant.name}</td>
                      <td className="px-4 py-3 border">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{tenant.email || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 border">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span>{tenant.cpf_cnpj || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 border">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{tenant.phone || '-'}</span>
                        </div>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-4 py-3 border">
                          <div className="flex gap-2 items-center">
                            <ActionButton
                              icon={Edit}
                              onClick={() => dispatchModal({ type: 'OPEN_EDIT', payload: tenant })}
                              variant="primary"
                              disabled={isLoading}
                              title="Editar"
                            />
                            <ActionButton
                              icon={Trash2}
                              onClick={() => dispatchModal({ type: 'OPEN_DELETE', payload: tenant })}
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
                  <td colSpan={isSuperAdmin ? 5 : 4} className="text-center py-8 text-gray-500">
                    <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium">Nenhuma empresa encontrada</p>
                    <p className="text-sm">Use o botão &quot;Nova Empresa&quot; para criar a primeira.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Modal de criação/edição */}
          <TenantModal
            isOpen={modalState.type === 'CREATE' || modalState.type === 'EDIT'}
            onClose={closeModal}
            onSave={handleSave}
            tenant={modalState.type === 'EDIT' ? modalState.payload : undefined}
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
              Tem certeza que deseja excluir a empresa <span className="font-semibold">&quot;{modalState.type === 'DELETE' ? modalState.payload.name : ''}&quot;</span>? 
              Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
            </p>
          </ConfirmationModal>
        </>
      )}
    </div>
  );
} 