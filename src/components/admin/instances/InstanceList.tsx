"use client";
import { useReducer, useState, useMemo } from "react";
import { toast } from "sonner";
import { Instance } from "./types";
import InstanceModal from "./InstanceModal";
import { ConnectionModal } from "./QRCodeComponents";
import { ConfirmationModal } from "@/components/ui";
import { useInstanceActions } from "@/hooks/useInstanceActions";
import { useInstances } from "@/hooks/useInstances";
import { useTenants } from "@/hooks/useTenants";
import { instanceService } from "@/services/instanceService";
import { Plus, Filter, X } from "lucide-react";
import { Button } from "@/components/brand";
import { useAgents } from '@/hooks/useAgents';
import { InstanceCard } from "./InstanceCard";
import { InstanceDetailsModal } from "./InstanceDetailsModal";
import { AdminListLayout } from '@/components/layout/AdminListLayout';

interface InstanceListProps {
  isSuperAdmin: boolean;
  tenantId?: string;
}

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

  const { data: instances, loading } = useInstances({
    isSuperAdmin,
    tenantId,
    refreshKey,
  });

  const { data: empresas } = useTenants(isSuperAdmin);

  const { data: agentes } = useAgents({ isSuperAdmin, tenantId });

  // Converter array de empresas para objeto para manter compatibilidade
  const empresasMap = useMemo(() => {
    return empresas.reduce((acc, tenant) => {
      acc[tenant.id] = tenant.name;
      return acc;
    }, {} as Record<string, string>);
  }, [empresas]);

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
    <AdminListLayout
      icon={<Plus className="w-5 h-5 text-white" />}
      pageTitle={isSuperAdmin ? 'Gerenciar Instâncias' : 'Minhas Instâncias'}
      pageDescription={isSuperAdmin ? 'Gerencie todas as instâncias do sistema' : 'Gerencie suas instâncias'}
      cardTitle={isSuperAdmin ? 'Instâncias WhatsApp' : 'Minhas Instâncias'}
      cardDescription={isSuperAdmin ? 'Gerencie e monitore todas as instâncias conectadas ao WhatsApp' : 'Gerencie e monitore suas instâncias conectadas ao WhatsApp'}
      actionButton={
        (isSuperAdmin || tenantId) && (
          <Button
            variant="add"
            onClick={() => dispatchModal({ type: 'OPEN_CREATE' })}
          >
            <Plus className="w-4 h-4" />
            Nova Instância
          </Button>
        )
      }
      filtersOpen={showFilters}
      onToggleFilters={() => setShowFilters(!showFilters)}
    >
      <AdminListLayout.Filters>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
              <select
                value={filterEmpresa}
                onChange={(e) => setFilterEmpresa(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green-light focus:border-transparent"
              >
                <option value="">Todas as empresas</option>
                {Object.entries(empresasMap).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar por nome ou descrição</label>
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Digite o nome ou descrição..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green-light focus:border-transparent"
            />
          </div>
        </div>
        {hasActiveFilters && (
          <div className="mt-4 mb-2">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-2 text-sm text-blue-800">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filtros ativos:</span>
              {filterStatus && (
                <span className="px-2 py-1 bg-blue-100 rounded text-xs">Status: {filterStatus === 'open' ? 'Conectado' : 'Desconectado'}</span>
              )}
              {filterEmpresa && (
                <span className="px-2 py-1 bg-blue-100 rounded text-xs">Empresa: {empresasMap[filterEmpresa]}</span>
              )}
              {filterSearch && (
                <span className="px-2 py-1 bg-blue-100 rounded text-xs">Busca: "{filterSearch}"</span>
              )}
              <span className="text-blue-600">({filteredInstances.length} de {instances.length} instâncias)</span>
            </div>
          </div>
        )}
        {hasActiveFilters && (
          <div className="flex gap-2 mb-4">
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green-light"></div>
          </div>
        ) : filteredInstances.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredInstances.map((instance: Instance) => {
              const isLoading = actionLoading === instance.instanceName;
              const empresaName = isSuperAdmin && instance.tenant_id ? empresasMap[instance.tenant_id] : undefined;
              const agenteVinculado = (agentes as unknown as Array<{ id: string; title: string }>).find((a) => a.id === instance.agent_id);
              return (
                <InstanceCard
                  key={instance.id}
                  instance={instance}
                  onViewDetails={handleViewDetails}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                  isLoading={isLoading}
                  empresaName={empresaName}
                  agentName={agenteVinculado ? agenteVinculado.title : undefined}
                  onRequestDelete={() => dispatchModal({ type: 'OPEN_DELETE', payload: instance })}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="w-12 h-12 mx-auto mb-4 text-gray-300">
              <Plus className="w-12 h-12" />
            </div>
            <p className="font-medium">
              {hasActiveFilters ? 'Nenhuma instância encontrada com os filtros aplicados' : 'Nenhuma instância encontrada'}
            </p>
            <p className="text-sm">
              {hasActiveFilters
                ? 'Tente ajustar os filtros ou use o botão "Limpar" para remover os filtros.'
                : ''
              }
            </p>
          </div>
        )}
        <InstanceModal
          isOpen={modalState.type === 'CREATE'}
          onClose={closeModal}
          onSave={handleSave}
          tenants={Object.entries(empresasMap).map(([id, name]) => ({ id, name }))}
          tenantId={tenantId}
          isSuperAdmin={isSuperAdmin}
        />
        {modalState.type === 'DETAILS' && (
          <InstanceDetailsModal
            instance={modalState.payload}
            isOpen={modalState.type === 'DETAILS'}
            onClose={closeModal}
            onRefresh={() => setRefreshKey(k => k + 1)}
            empresaName={modalState.payload.tenant_id ? empresasMap[modalState.payload.tenant_id] : ''}
          />
        )}
        {modalState.type === 'CONNECT' && (
          <ConnectionModal
            qr={modalState.payload.qr}
            code={modalState.payload.code}
            onClose={closeModal}
            instanceName={modalState.payload.instanceName}
          />
        )}
        {modalState.type === 'DISCONNECT' && (
          <ConfirmationModal
            isOpen={modalState.type === 'DISCONNECT'}
            onClose={closeModal}
            onConfirm={() => handleDisconnect(modalState.payload.instanceName)}
            title="Desconectar Instância"
            confirmText="Desconectar"
            cancelText="Cancelar"
            isLoading={actionLoading === modalState.payload.instanceName}
          >
            <p>Tem certeza que deseja desconectar a instância <span className="font-semibold">{modalState.payload.instanceName}</span>?</p>
          </ConfirmationModal>
        )}
        {modalState.type === 'DELETE' && (
          <ConfirmationModal
            isOpen={modalState.type === 'DELETE'}
            onClose={closeModal}
            onConfirm={() => handleDelete(modalState.payload.instanceName)}
            title="Deletar Instância"
            confirmText="Deletar"
            cancelText="Cancelar"
            isLoading={actionLoading === modalState.payload.instanceName}
          >
            <p>Tem certeza que deseja deletar a instância <span className="font-semibold">{modalState.payload.instanceName}</span>? Esta ação não pode ser desfeita.</p>
          </ConfirmationModal>
        )}
      </AdminListLayout.List>
    </AdminListLayout>
  );
}

// Padrão: Este componente utiliza o layout padrão de listas administrativas (AdminListLayout) para garantir consistência visual e estrutural em todo o painel.
// ... existing code ... 