"use client";
import { useReducer, useState } from "react";
import { toast } from "sonner";
import { Instance } from "./types";
import InstanceModal from "./InstanceModal";
import { ConnectionModal } from "./QRCodeComponents";
import { ConfirmationModal, ActionButton } from "@/components/ui";
import { useInstanceActions } from "@/hooks/useInstanceActions";
import { useInstances } from "@/hooks/useInstances";
import { instanceService } from "@/services/instanceService";
import { Power, Edit, Trash2, Plus, Bug, RefreshCw } from "lucide-react";

interface InstanceListProps {
  isSuperAdmin: boolean;
  isAdmin: boolean;
  tenantId?: string;
}

const statusDisplay: { [key: string]: string } = {
  open: 'Conectado',
  connecting: 'Conectando',
  close: 'Desconectado',
};

// --- Step 4: Update State, Action, and Reducer ---
type ModalState = 
  | { type: 'NONE' }
  | { type: 'CREATE' }
  | { type: 'EDIT', payload: Instance }
  | { type: 'DELETE', payload: Instance }
  | { type: 'DISCONNECT', payload: Instance }
  | { type: 'CONNECT', payload: { qr: string | null; code: string | null } };

type ModalAction = 
  | { type: 'OPEN_CREATE' }
  | { type: 'OPEN_EDIT', payload: Instance }
  | { type: 'OPEN_DELETE', payload: Instance }
  | { type: 'OPEN_DISCONNECT', payload: Instance }
  | { type: 'OPEN_CONNECT', payload: { qr: string | null; code: string | null } }
  | { type: 'CLOSE' };

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
  switch (action.type) {
    case 'OPEN_CREATE':
      return { type: 'CREATE' };
    case 'OPEN_EDIT':
      return { type: 'EDIT', payload: action.payload };
    case 'OPEN_DELETE':
      return { type: 'DELETE', payload: action.payload };
    case 'OPEN_DISCONNECT':
      return { type: 'DISCONNECT', payload: action.payload };
    case 'OPEN_CONNECT':
      return { type: 'CONNECT', payload: action.payload };
    case 'CLOSE':
      return { type: 'NONE' };
    default:
      return state;
  }
};
// --- End of Step 4 ---

export function InstanceList({ isSuperAdmin, isAdmin, tenantId }: InstanceListProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalState, dispatchModal] = useReducer(modalReducer, { type: 'NONE' });
  const { actionLoading, handleAction } = useInstanceActions();
  
  const { instances, empresas, loading } = useInstances({
    isSuperAdmin,
    tenantId,
    refreshKey,
  });

  const handleConnect = (instanceName: string, forceRegenerate = false) => handleAction(async () => {
    const data = await instanceService.connectInstance(instanceName, forceRegenerate);
    
    if (data && (data.base64 || data.pairingCode)) {
      dispatchModal({ type: 'OPEN_CONNECT', payload: { qr: data.base64 || null, code: data.pairingCode || null } });
    } else {
      toast.error('Não foi possível obter os dados de conexão.');
    }
    setRefreshKey(k => k + 1);
  }, instanceName);

  const handleTestConnection = async (instanceName: string) => {
    try {
      const response = await fetch(`/api/whatsapp-instances/test-connection?instanceName=${encodeURIComponent(instanceName)}`);
      const data = await response.json();
      
      if (data.success) {
        toast.success('Teste de conexão realizado com sucesso. Verifique os logs do console.');
      } else {
        toast.error(`Erro no teste: ${data.error}`);
      }
    } catch {
      toast.error('Erro ao realizar teste de conexão');
    }
  };

  const handleDisconnect = (instanceName: string) => handleAction(async () => {
    await instanceService.disconnectInstance(instanceName);
    toast.success('Instância desconectada com sucesso.');
    setRefreshKey(k => k + 1);
    dispatchModal({ type: 'CLOSE' });
  }, instanceName);

  const handleDelete = (instanceName: string) => handleAction(async () => {
    await instanceService.deleteInstance(instanceName);
    toast.success("Instância deletada com sucesso!");
    setRefreshKey(k => k + 1);
    dispatchModal({ type: 'CLOSE' });
  }, instanceName);

  const closeModal = () => {
    dispatchModal({ type: 'CLOSE' });
  };
  
  const handleSave = () => {
    closeModal();
    setRefreshKey(k => k + 1);
  };

  // Função para atualizar status da instância na Evolution e no banco
  const handleUpdateStatus = async (instanceName: string) => {
    try {
      const response = await fetch(`/api/whatsapp-instances/status?instanceName=${encodeURIComponent(instanceName)}`);
      const data = await response.json();
      if (response.ok) {
        toast.success(`Status atualizado: ${data.status}`);
        setRefreshKey(k => k + 1);
      } else {
        toast.error(data.error || 'Erro ao atualizar status');
      }
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Erro ao atualizar status');
    }
  };

  return (
    <div className="overflow-x-auto">
      {(isSuperAdmin || isAdmin) && (
        <div className="mb-4 flex justify-end">
          <button 
            className="px-4 py-2 text-sm font-semibold text-white bg-brand-gray-dark rounded-md hover:bg-brand-gray-deep transition-colors flex items-center gap-2"
            onClick={() => dispatchModal({ type: 'OPEN_CREATE' })}
          >
            <Plus className="w-4 h-4" />
            Nova Instância
          </button>
        </div>
      )}
      {loading ? (
        <div>Carregando instâncias...</div>
      ) : (
        <>
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 border">Nome</th>
                <th className="px-2 py-1 border">Integração</th>
                <th className="px-2 py-1 border">Status</th>
                <th className="px-2 py-1 border">QR Code</th>
                {isSuperAdmin && <th className="px-2 py-1 border">Empresa</th>}
                {(isSuperAdmin || isAdmin) && <th className="px-2 py-1 border">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {instances.length > 0 ? (
                instances.map((inst) => {
                  const isLoading = actionLoading === inst.instanceName;
                  return (
                    <tr key={inst.id} className="border-t">
                      <td className="px-2 py-1 border">{inst.instanceName}</td>
                      <td className="px-2 py-1 border">{inst.integration || '-'}</td>
                      <td className="px-2 py-1 border">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          inst.status === 'open' ? 'bg-green-100 text-brand-green-dark' :
                          inst.status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {statusDisplay[inst.status] || inst.status}
                        </span>
                      </td>
                      <td className="px-2 py-1 border">
                        {inst.status === 'connecting' && <span className="text-gray-500 italic">Aguardando...</span>}
                        {inst.status !== 'connecting' && <span className="text-gray-400">-</span>}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-2 py-1 border">{inst.tenant_id ? empresas[inst.tenant_id] || inst.tenant_id : '-'}</td>
                      )}
                      {(isSuperAdmin || isAdmin) && (
                        <td className="px-2 py-1 border flex gap-2 items-center">
                          {inst.status === 'open' && (
                            <ActionButton
                              icon={Power}
                              onClick={() => dispatchModal({ type: 'OPEN_DISCONNECT', payload: inst })}
                              variant="secondary"
                              disabled={isLoading}
                              loading={isLoading}
                              title="Desconectar"
                            />
                          )}
                          {inst.status === 'close' && (
                            <ActionButton
                              icon={Power}
                              onClick={() => handleConnect(inst.instanceName)}
                              variant="primary"
                              disabled={isLoading}
                              loading={isLoading}
                              title="Conectar"
                            />
                          )}
                          {inst.status === 'connecting' && (
                            <ActionButton
                              icon={RefreshCw}
                              onClick={() => handleConnect(inst.instanceName, true)}
                              variant="secondary"
                              disabled={isLoading}
                              loading={isLoading}
                              title="Forçar Regeneração"
                            />
                          )}
                          <ActionButton
                            icon={RefreshCw}
                            onClick={() => handleUpdateStatus(inst.instanceName)}
                            variant="secondary"
                            title="Atualizar Status"
                          />
                          <ActionButton
                            icon={Edit}
                            onClick={() => dispatchModal({ type: 'OPEN_EDIT', payload: inst })}
                            variant="primary"
                            disabled={isLoading}
                            title="Editar"
                          />
                          <ActionButton
                            icon={Bug}
                            onClick={() => handleTestConnection(inst.instanceName)}
                            variant="secondary"
                            disabled={isLoading}
                            title="Testar Conexão"
                          />
                          <ActionButton
                            icon={Trash2}
                            onClick={() => dispatchModal({ type: 'OPEN_DELETE', payload: inst })}
                            variant="destructive"
                            disabled={isLoading}
                            loading={isLoading}
                            title="Deletar"
                          />
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isSuperAdmin ? 6 : (isAdmin ? 5 : 4)} className="text-center py-2">Nenhuma instância encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>

          <InstanceModal
            isOpen={modalState.type === 'CREATE' || modalState.type === 'EDIT'}
            onClose={closeModal}
            onSave={handleSave}
            instance={modalState.type === 'EDIT' ? modalState.payload : undefined}
            tenants={isSuperAdmin ? Object.entries(empresas).map(([id, name]) => ({ id, name })) : []}
            tenantId={tenantId}
          />

          {modalState.type === 'CONNECT' && (
            <ConnectionModal
              qr={modalState.payload.qr}
              code={modalState.payload.code}
              onClose={closeModal}
            />
          )}

          {modalState.type === 'DELETE' && (
            <ConfirmationModal
              isOpen={true}
              onClose={closeModal}
              onConfirm={() => handleDelete(modalState.payload.instanceName)}
              title="Confirmar exclusão"
              confirmText="Deletar"
              isLoading={actionLoading === modalState.payload.instanceName}
            >
              Tem certeza que deseja deletar a instância <span className="font-semibold">&quot;{modalState.payload.instanceName}&quot;</span>? Essa ação não pode ser desfeita.
            </ConfirmationModal>
          )}

          {modalState.type === 'DISCONNECT' && (
            <ConfirmationModal
              isOpen={true}
              onClose={closeModal}
              onConfirm={() => handleDisconnect(modalState.payload.instanceName)}
              title="Confirmar Desconexão"
              confirmText="Desconectar"
              isLoading={actionLoading === modalState.payload.instanceName}
            >
              Tem certeza que deseja desconectar a instância <span className="font-semibold">&quot;{modalState.payload.instanceName}&quot;</span>?
            </ConfirmationModal>
          )}
        </>
      )}
    </div>
  );
} 