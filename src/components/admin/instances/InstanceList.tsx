"use client";
import { useReducer, useState, useMemo } from "react";
import { toast } from "sonner";
import { Instance } from "./types";
import InstanceModal from "./InstanceModal";
import { ConnectionModal } from "./QRCodeComponents";
import { ConfirmationModal } from "@/components/ui";
import { Button } from '@/components/brand';
import { useInstanceActions } from "@/hooks/useInstanceActions";
import { useInstances } from "@/hooks/useInstances";
import { instanceService } from "@/services/instanceService";
import { Power, Trash2, Plus, RefreshCw, PowerOff, Clipboard, Filter, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/brand';
import { useAgents } from '@/hooks/useAgents';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui';
import { agentService } from "@/services/agentService";
import type { Agent } from '@/services/agentService';

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
  const [selectAgentModal, setSelectAgentModal] = useState<{ open: boolean; instanceId: string }>({ open: false, instanceId: "" });
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [savingAgent, setSavingAgent] = useState(false);
  
  // Estados dos filtros
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterEmpresa, setFilterEmpresa] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

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

  const handleOpenSelectAgent = (instanceId: string) => {
    setSelectAgentModal({ open: true, instanceId });
    setSelectedAgentId("");
  };

  const handleCloseSelectAgent = () => {
    setSelectAgentModal({ open: false, instanceId: "" });
    setSelectedAgentId("");
  };

  const handleSaveAgent = async () => {
    if (!selectAgentModal.instanceId || !selectedAgentId) return;
    setSavingAgent(true);
    try {
      // Buscar instância atual
      const inst = instances.find(i => i.id === selectAgentModal.instanceId);
      if (!inst) throw new Error('Instância não encontrada');
      // Desvincular agente anterior, se houver
      const prevAgentId = inst.agent_id;
      if (prevAgentId) {
        await agentService.updateAgent(prevAgentId, { instance_id: null });
      }
      // Atualizar agent_id da instância
      await instanceService.updateInstance(inst.id, { agent_id: selectedAgentId });
      // Vincular novo agente
      await agentService.updateAgent(selectedAgentId, { instance_id: inst.id });
      toast.success('Agente vinculado com sucesso!');
      setRefreshKey(k => k + 1);
      handleCloseSelectAgent();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        toast.error('Erro ao vincular agente: ' + (err as { message: string }).message);
      } else if (typeof err === 'string') {
        toast.error('Erro ao vincular agente: ' + err);
      } else {
      toast.error('Erro ao vincular agente.');
      }
    } finally {
      setSavingAgent(false);
    }
  };

  const handleUnlinkAgent = async (inst: Instance, agenteVinculado: Agent) => {
    setSavingAgent(true);
    try {
      await instanceService.updateInstance(inst.id, { agent_id: null });
      await agentService.updateAgent(agenteVinculado.id, { instance_id: null });
      toast.success('Agente desvinculado com sucesso!');
      setRefreshKey(k => k + 1);
    } catch {
      toast.error('Erro ao desvincular agente.');
    } finally {
      setSavingAgent(false);
    }
  };

  // Filtrar instâncias
  const filteredInstances = useMemo(() => {
    return instances.filter(inst => {
      const matchesStatus = !filterStatus || normalizeStatus(inst.status) === filterStatus;
      const matchesEmpresa = !filterEmpresa || inst.tenant_id === filterEmpresa;
      const matchesSearch = !filterSearch || 
        inst.instanceName.toLowerCase().includes(filterSearch.toLowerCase()) ||
        (inst.description && inst.description.toLowerCase().includes(filterSearch.toLowerCase()));
      return matchesStatus && matchesEmpresa && matchesSearch;
    });
  }, [instances, filterStatus, filterEmpresa, filterSearch]);

  // Limpar filtros
  const clearFilters = () => {
    setFilterStatus('');
    setFilterEmpresa('');
    setFilterSearch('');
  };

  // Verificar se há filtros ativos
  const hasActiveFilters = filterStatus || filterEmpresa || filterSearch;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
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
                {[filterStatus, filterEmpresa, filterSearch].filter(Boolean).length}
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
          className="px-4 py-2 text-sm font-semibold text-white bg-brand-gray-dark rounded-md hover:bg-brand-gray-deep transition-colors flex items-center gap-2 whitespace-nowrap"
          onClick={() => dispatchModal({ type: 'OPEN_CREATE' })}
        >
          <Plus className="w-4 h-4" />
          Nova Instância
        </button>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green-light focus:border-transparent"
              >
                <option value="">Todos os status</option>
                <option value="open">Conectado</option>
                <option value="close">Desconectado</option>
              </select>
            </div>
            
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
                  {Object.entries(empresas).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar por nome ou descrição
              </label>
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Digite o nome da instância ou descrição..."
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
            {filterStatus && (
              <span className="px-2 py-1 bg-blue-100 rounded text-xs">
                Status: {statusDisplay[filterStatus]}
              </span>
            )}
            {filterEmpresa && (
              <span className="px-2 py-1 bg-blue-100 rounded text-xs">
                Empresa: {empresas[filterEmpresa]}
              </span>
            )}
            {filterSearch && (
              <span className="px-2 py-1 bg-blue-100 rounded text-xs">
                Busca: &quot;{filterSearch}&quot;
              </span>
            )}
            <span className="text-blue-600">
              ({filteredInstances.length} de {instances.length} instâncias)
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div>Carregando instâncias...</div>
      ) : (
        <>
          {filteredInstances.length > 0 ? (
            filteredInstances.map((inst) => {
              const isLoading = actionLoading === inst.instanceName;
              const agenteVinculado = agentes.find(a => a.id === inst.agent_id);
              return (
                <Card key={inst.id} className="">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <CardTitle className="text-base font-semibold">Status da Conexão: <span className={normalizeStatus(inst.status) === 'open' ? 'text-green-600' : 'text-red-600'}>{statusDisplay[normalizeStatus(inst.status)]}</span></CardTitle>
                      <div className="flex items-center gap-2">
                        {inst.provider_type && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            inst.provider_type === 'nativo' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {inst.provider_type === 'nativo' ? 'Nativa' : 'Externa'}
                          </span>
                        )}
                      </div>
                    </div>
                    <CardDescription className="mt-1">
                      <span className="font-semibold">Agente vinculado: </span>
                      {agenteVinculado ? (
                        <>
                          {agenteVinculado.title}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2"
                            onClick={() => handleUnlinkAgent(inst, agenteVinculado)}
                            disabled={savingAgent}
                          >
                            Desvincular
                          </Button>
                        </>
                      ) : (
                        <span className="text-gray-500">Nenhum agente vinculado</span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-3"
                        onClick={() => handleOpenSelectAgent(inst.id)}
                      >
                        {agenteVinculado ? 'Alterar' : 'Selecionar'}
                      </Button>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <span className="text-gray-500 mt-0.5"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a10 10 0 0 1 13 0"/></svg></span>
                      <div className="flex-1">
                        <div className="font-semibold mb-1">Nome</div>
                        <div className="text-gray-600 text-sm">{inst.instanceName}</div>
                        {isSuperAdmin && inst.tenant_id && empresas[inst.tenant_id] && (
                          <div className="text-xs text-gray-500 mt-1">Empresa: {empresas[inst.tenant_id]}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <span className="text-gray-500 mt-0.5"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/></svg></span>
                      <div className="flex-1">
                        <div className="font-semibold mb-1">Número WhatsApp vinculado</div>
                        <div className="text-gray-600 text-sm">
                          {inst.phone_number ? inst.phone_number : 'Não disponível'}
                        </div>
                      </div>
                    </div>
                    {inst.description && (
                      <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md md:col-span-2">
                        <span className="text-gray-500 mt-0.5"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg></span>
                        <div className="flex-1">
                          <div className="font-semibold mb-1">Descrição</div>
                          <div className="text-gray-600 text-sm">{inst.description}</div>
                        </div>
                      </div>
                    )}
                  {normalizeStatus(inst.status) === 'close' && inst.public_hash && (
                      <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md md:col-span-2">
                        <span className="text-gray-500 mt-0.5"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>
                        <div className="flex-1">
                          <div className="font-semibold mb-1">URL pública para conectar instância</div>
                          <div className="text-gray-600 text-sm mb-2">Envie essa url para o seu cliente escanear o QRCode</div>
                          <div className="flex items-center gap-2 w-full">
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
                      </div>
                    )}
                    </CardContent>
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
                      variant="secondary"
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
                      Remover
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="w-12 h-12 mx-auto mb-4 text-gray-300">
                <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M22 16.92V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2.08a2 2 0 0 1 1.09-1.79l7-3.11a2 2 0 0 1 1.82 0l7 3.11A2 2 0 0 1 22 16.92z"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <p className="font-medium">
                {hasActiveFilters ? 'Nenhuma instância encontrada com os filtros aplicados' : 'Nenhuma instância encontrada'}
              </p>
              <p className="text-sm">
                {hasActiveFilters 
                  ? 'Tente ajustar os filtros ou use o botão "Limpar" para remover os filtros.'
                  : 'Use o botão "Nova Instância" para criar a primeira.'
                }
              </p>
            </div>
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
        <ConfirmationModal
        isOpen={modalState.type === 'DELETE'}
          onClose={closeModal}
        onConfirm={() => handleDelete(modalState.type === 'DELETE' ? modalState.payload.instanceName : '')}
        title="Remover instância"
        confirmText="Remover"
        cancelText="Cancelar"
        isLoading={actionLoading === (modalState.type === 'DELETE' ? modalState.payload.instanceName : '')}
        >
        <p>
          Tem certeza que deseja remover a instância <span className="font-semibold">&quot;{modalState.type === 'DELETE' ? modalState.payload.instanceName : ''}&quot;</span>? Esta ação não pode ser desfeita.
        </p>
        </ConfirmationModal>
        <ConfirmationModal
        isOpen={modalState.type === 'DISCONNECT'}
          onClose={closeModal}
        onConfirm={() => handleDisconnect(modalState.type === 'DISCONNECT' ? modalState.payload.instanceName : '')}
          title="Confirmar Desconexão"
          confirmText="Desconectar"
        cancelText="Cancelar"
        isLoading={actionLoading === (modalState.type === 'DISCONNECT' ? modalState.payload.instanceName : '')}
        >
        <p>
          Tem certeza que deseja desconectar a instância <span className="font-semibold">&quot;{modalState.type === 'DISCONNECT' ? modalState.payload.instanceName : ''}&quot;</span>?
        </p>
        </ConfirmationModal>
      <Modal
        isOpen={selectAgentModal.open}
        onClose={handleCloseSelectAgent}
      >
        <ModalHeader>Selecionar Agente</ModalHeader>
        <ModalBody>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecione um agente para vincular:
            </label>
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Regra de vínculo:</strong><br />
                • Instâncias <strong>Nativas</strong> só aceitam agentes <strong>Internos</strong><br />
                • Instâncias <strong>Externas</strong> só aceitam agentes <strong>Externos</strong>
              </p>
            </div>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green-light focus:border-transparent"
            >
              <option value="">Selecione um agente...</option>
              {agentes
                .filter(agent => {
                  const currentInstance = instances.find(inst => inst.id === selectAgentModal.instanceId);
                  if (!currentInstance) return false;
                  
                  // Instância nativa só aceita agentes internos
                  if (currentInstance.provider_type === 'nativo') {
                    return agent.agent_type === 'internal' || !agent.agent_type;
                  }
                  
                  // Instância externa só aceita agentes externos
                  if (currentInstance.provider_type === 'externo') {
                    return agent.agent_type === 'external';
                  }
                  
                  return true; // Fallback
                })
                .map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.title} ({agent.agent_type === 'external' ? 'Externo' : 'Interno'})
                  </option>
                ))}
            </select>
            {agentes.filter(agent => {
              const currentInstance = instances.find(inst => inst.id === selectAgentModal.instanceId);
              if (!currentInstance) return false;
              
              if (currentInstance.provider_type === 'nativo') {
                return agent.agent_type === 'internal' || !agent.agent_type;
              }
              
              if (currentInstance.provider_type === 'externo') {
                return agent.agent_type === 'external';
              }
              
              return true;
            }).length === 0 && (
              <p className="mt-2 text-sm text-red-600">
                Nenhum agente compatível encontrado para este tipo de instância.
              </p>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            onClick={handleCloseSelectAgent}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveAgent}
            disabled={!selectedAgentId || savingAgent}
            loading={savingAgent}
          >
            Vincular
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
} 