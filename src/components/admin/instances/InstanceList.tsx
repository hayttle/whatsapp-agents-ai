"use client";
import { useReducer, useState } from "react";
import { toast } from "sonner";
import { Instance } from "./types";
import InstanceModal from "./InstanceModal";
import { ConnectionModal } from "./QRCodeComponents";
import { ConfirmationModal } from "@/components/ui";
import { Button } from '@/components/brand';
import { useInstanceActions } from "@/hooks/useInstanceActions";
import { useInstances } from "@/hooks/useInstances";
import { instanceService } from "@/services/instanceService";
import { Power, Trash2, Plus, RefreshCw, PowerOff, Clipboard } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/brand';
import { useAgents } from '@/hooks/useAgents';

interface InstanceListProps {
  isSuperAdmin: boolean;
  tenantId?: string;
}

const statusDisplay: { [key: string]: string } = {
  open: 'Conectado',
  close: 'Desconectado',
};

// Função para normalizar status - qualquer status diferente de 'open' é tratado como 'close'
const normalizeStatus = (status: string): 'open' | 'close' => {
  return status === 'open' ? 'open' : 'close';
};

// --- Step 4: Update State, Action, and Reducer ---
type ModalState = 
  | { type: 'NONE' }
  | { type: 'CREATE' }
  | { type: 'DELETE', payload: Instance }
  | { type: 'DISCONNECT', payload: Instance }
  | { type: 'CONNECT', payload: { qr: string | null; code: string | null; instanceName: string } };

type ModalAction = 
  | { type: 'OPEN_CREATE' }
  | { type: 'OPEN_DELETE', payload: Instance }
  | { type: 'OPEN_DISCONNECT', payload: Instance }
  | { type: 'OPEN_CONNECT', payload: { qr: string | null; code: string | null; instanceName: string } }
  | { type: 'CLOSE' };

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
  switch (action.type) {
    case 'OPEN_CREATE':
      return { type: 'CREATE' };
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

export function InstanceList({ isSuperAdmin, tenantId }: InstanceListProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalState, dispatchModal] = useReducer(modalReducer, { type: 'NONE' });
  const { actionLoading, handleAction } = useInstanceActions();
  
  const { instances, empresas, loading } = useInstances({
    isSuperAdmin,
    tenantId,
    refreshKey,
  });
  const { agentes } = useAgents({ isSuperAdmin, tenantId });

  const handleConnect = (instanceName: string, forceRegenerate = false) => handleAction(async () => {
    const data = await instanceService.connectInstance(instanceName, forceRegenerate);
    
    if (data && (data.base64 || data.pairingCode)) {
      dispatchModal({ type: 'OPEN_CONNECT', payload: { qr: data.base64 || null, code: data.pairingCode || null, instanceName } });
    } else {
      toast.error('Não foi possível obter os dados de conexão.');
    }
    setRefreshKey(k => k + 1);
  }, instanceName);

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
        setRefreshKey(k => k + 1);
      } else {
        toast.error(data.error || 'Erro ao atualizar status');
      }
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Erro ao atualizar status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-4 flex justify-end">
        <button
          className="px-4 py-2 text-sm font-semibold text-white bg-brand-gray-dark rounded-md hover:bg-brand-gray-deep transition-colors flex items-center gap-2 whitespace-nowrap self-end"
          onClick={() => dispatchModal({ type: 'OPEN_CREATE' })}
        >
          <Plus className="w-4 h-4" />
          Nova Instância
        </button>
      </div>
      {loading ? (
        <div>Carregando instâncias...</div>
      ) : (
        <>
          {instances.length > 0 ? (
            instances.map((inst) => {
              const isLoading = actionLoading === inst.instanceName;
              const agenteVinculado = agentes.find(a => a.instance_id === inst.id);
              return (
                <Card key={inst.id} className="">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold mb-1">Status da Conexão: <span className={normalizeStatus(inst.status) === 'open' ? 'text-green-600' : 'text-red-600'}>{statusDisplay[normalizeStatus(inst.status)]}</span></CardTitle>
                    <CardDescription className="mt-1">
                      <span className="font-semibold">Agente vinculado: </span>
                      {agenteVinculado ? agenteVinculado.title : <span className="text-gray-500">Nenhum agente vinculado</span>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <span className="text-gray-500"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2.08a2 2 0 0 1 1.09-1.79l7-3.11a2 2 0 0 1 1.82 0l7 3.11A2 2 0 0 1 22 16.92z"/><circle cx="12" cy="7" r="4"/></svg></span>
                      <div>
                        <div className="font-semibold">Número</div>
                        <div className="text-gray-600 text-sm">
                          {inst.phone_number ? inst.phone_number : 'Telefone não disponível'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <span className="text-gray-500"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a10 10 0 0 1 13 0"/></svg></span>
                      <div>
                        <div className="font-semibold">Nome</div>
                        <div className="text-gray-600 text-sm">{inst.instanceName}</div>
                        {isSuperAdmin && inst.tenant_id && empresas[inst.tenant_id] && (
                          <div className="text-xs text-gray-500 mt-1">Empresa: {empresas[inst.tenant_id]}</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  {normalizeStatus(inst.status) === 'close' && inst.public_hash && (
                    <CardContent className="mt-2">
                      <div className="bg-gray-50 p-4 border border-gray-200 rounded-md flex flex-col h-full justify-between gap-2">
                        <div>
                          <div className="font-semibold mb-1">URL pública para conectar instância</div>
                          <div className="text-gray-600 text-sm">Envie essa url para o seu cliente escanear o QRCode</div>
                        </div>
                        <div className="flex items-center gap-2 w-full mt-2">
                          <input
                            type="text"
                            readOnly
                            value={`${window.location.origin}/qrcode/${inst.public_hash}`}
                            className="text-base bg-gray-100 rounded px-2 py-2 flex-1 h-10"
                            onFocus={e => e.target.select()}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Clipboard className="w-4 h-4" />}
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/qrcode/${inst.public_hash}`);
                              toast.success('Link copiado!');
                            }}
                          >
                            Copiar link
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                  <CardFooter className="flex gap-2 justify-end">
                    {normalizeStatus(inst.status) === 'open' ? (
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={() => dispatchModal({ type: 'OPEN_DISCONNECT', payload: inst })}
                        loading={isLoading}
                        leftIcon={<PowerOff className="w-4 h-4" />}
                      >
                        Desconectar
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleConnect(inst.instanceName)}
                        loading={isLoading}
                        leftIcon={<Power className="w-4 h-4" />}
                      >
                        Conectar
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(inst.instanceName)}
                      leftIcon={<RefreshCw className="w-4 h-4" />}
                    >
                      Atualizar Status
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => dispatchModal({ type: 'OPEN_DELETE', payload: inst })}
                      loading={isLoading}
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                      Deletar
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-2">Nenhuma instância encontrada.</div>
          )}
        </>
      )}
      <InstanceModal
        isOpen={modalState.type === 'CREATE'}
        onClose={closeModal}
        onSave={handleSave}
        tenants={isSuperAdmin ? Object.entries(empresas).map(([id, name]) => ({ id, name })) : []}
        tenantId={tenantId}
        isSuperAdmin={isSuperAdmin}
      />
      {modalState.type === 'CONNECT' && (
        <ConnectionModal
          qr={modalState.payload.qr}
          code={modalState.payload.code}
          onClose={closeModal}
          onStatusUpdate={() => {
            if (modalState.payload.instanceName) {
              handleUpdateStatus(modalState.payload.instanceName);
            }
          }}
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
    </div>
  );
} 