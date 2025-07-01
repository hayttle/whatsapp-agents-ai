"use client";
import { useReducer, useState, useMemo } from "react";
import { toast } from "sonner";
import { Instance } from "./types";
import InstanceModal from "./InstanceModal";
import { ConnectionModal } from "./QRCodeComponents";
import { ConfirmationModal } from "@/components/ui";
import { useInstanceActions } from "@/hooks/useInstanceActions";
import { useInstances } from "@/hooks/useInstances";
import { instanceService } from "@/services/instanceService";
import { Plus, Filter, X } from "lucide-react";
import { useAgents } from '@/hooks/useAgents';
import { InstanceCard } from "./InstanceCard";
import { InstanceDetailsModal } from "./InstanceDetailsModal";

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
  | { type: 'CONNECT', payload: { qr: string | null; code: string | null; instanceName: string } }
  | { type: 'DETAILS', payload: Instance };

type ModalAction = 
  | { type: 'OPEN_CREATE' }
  | { type: 'OPEN_DELETE', payload: Instance }
  | { type: 'OPEN_DISCONNECT', payload: Instance }
  | { type: 'OPEN_CONNECT', payload: { qr: string | null; code: string | null; instanceName: string } }
  | { type: 'OPEN_DETAILS', payload: Instance }
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
    case 'OPEN_DETAILS':
      return { type: 'DETAILS', payload: action.payload };
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

  const handleViewDetails = (instance: Instance) => {
    dispatchModal({ type: 'OPEN_DETAILS', payload: instance });
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
        setRefreshKey(k => k + 1);
      } else {
        toast.error(data.error || 'Erro ao atualizar status');
      }
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Erro ao atualizar status');
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
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green-light mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando instâncias...</p>
        </div>
      ) : (
        <>
          {filteredInstances.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredInstances.map((inst) => {
                const isLoading = actionLoading === inst.instanceName;
                const empresaName = isSuperAdmin && inst.tenant_id ? empresas[inst.tenant_id] : undefined;
                const agenteVinculado = (agentes as import('@/services/agentService').Agent[]).find((a: import('@/services/agentService').Agent) => a.id === inst.agent_id);
                
                return (
                  <InstanceCard
                    key={inst.id}
                    instance={inst}
                    onViewDetails={handleViewDetails}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                    isLoading={isLoading}
                    empresaName={empresaName}
                    agentName={agenteVinculado ? agenteVinculado.title : undefined}
                    onRequestDelete={() => dispatchModal({ type: 'OPEN_DELETE', payload: inst })}
                  />
                );
              })}
            </div>
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

      <InstanceDetailsModal
        instance={modalState.type === 'DETAILS' ? modalState.payload : null}
        isOpen={modalState.type === 'DETAILS'}
        onClose={closeModal}
        onRefresh={() => setRefreshKey(k => k + 1)}
        empresaName={modalState.type === 'DETAILS' && modalState.payload.tenant_id ? empresas[modalState.payload.tenant_id] : undefined}
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

    </div>
  );
} 