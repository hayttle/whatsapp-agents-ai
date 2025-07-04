"use client";
import { useState, useMemo } from "react";
import { useAgents } from "@/hooks/useAgents";
import { useTenants } from "@/hooks/useTenants";
import { useInstances } from "@/hooks/useInstances";
import { useActions } from "@/hooks/useActions";
import { Agent } from "./types";
import { ConfirmationModal } from "@/components/ui";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Alert, Switch } from "@/components/brand";
import { Bot, Plus, Trash2, Filter, X, AlertTriangle, Building } from "lucide-react";
import { Tooltip } from '@/components/ui';
import { toast } from "sonner";
import Image from 'next/image';
import Link from 'next/link';
import { AdminListLayout } from '@/components/layout/AdminListLayout';
import { FiSettings } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import AgentQuickCreateModal from './AgentQuickCreateModal';

interface AgentListProps {
  isSuperAdmin: boolean;
  tenantId?: string;
}

export function AgentList({ isSuperAdmin, tenantId }: AgentListProps) {
  const [deleteAgent, setDeleteAgent] = useState<Agent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  // Estados dos filtros
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterEmpresa, setFilterEmpresa] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const {
    data: agentes,
    loading,
    error,
    refetch,
    toggleAgentStatus,
    deleteAgent: deleteAgentFromHook
  } = useAgents({
    isSuperAdmin,
    tenantId,
  });

  const { data: empresas } = useTenants(isSuperAdmin);
  const { data: instancias } = useInstances({ isSuperAdmin, tenantId });

  interface Empresa { id: string; name: string; }
  const empresasMap: Record<string, string> = useMemo(() => {
    if (!Array.isArray(empresas)) return {};
    return (empresas as Empresa[]).reduce((acc: Record<string, string>, tenant: Empresa) => {
      acc[tenant.id] = tenant.name;
      return acc;
    }, {});
  }, [empresas]);

  const instanciasMap = useMemo<Record<string, { instanceName: string; status: string }>>(() => {
    return instancias.reduce((acc, instance) => {
      acc[instance.id] = { instanceName: instance.instanceName, status: instance.status };
      return acc;
    }, {} as Record<string, { instanceName: string; status: string }>);
  }, [instancias]);

  const { actionLoading, handleAction } = useActions();

  // Filtrar agentes
  const filteredAgents = useMemo(() => {
    return agentes.filter((agente: Agent) => {
      const matchesStatus = !filterStatus ||
        (filterStatus === 'active' && agente.active) ||
        (filterStatus === 'inactive' && !agente.active);
      const matchesEmpresa = !filterEmpresa || agente.tenant_id === filterEmpresa;
      const matchesSearch = !filterSearch ||
        agente.title.toLowerCase().includes(filterSearch.toLowerCase()) ||
        (agente.description && agente.description.toLowerCase().includes(filterSearch.toLowerCase()));
      const matchesType = !filterType || agente.agent_type === filterType;
      return matchesStatus && matchesEmpresa && matchesSearch && matchesType;
    });
  }, [agentes, filterStatus, filterEmpresa, filterSearch, filterType]);

  // Limpar filtros
  const clearFilters = () => {
    setFilterStatus('');
    setFilterEmpresa('');
    setFilterSearch('');
    setFilterType('');
  };

  // Verificar se há filtros ativos
  const hasActiveFilters = filterStatus || filterEmpresa || filterSearch || filterType;

  const handleToggleActive = (agente: Agent) => handleAction(
    async () => {
      await toggleAgentStatus(agente.id, !agente.active);
      toast.success(`Agente ${agente.active ? 'desativado' : 'ativado'} com sucesso!`);
    },
    `toggle-${agente.id}`
  );

  const handleDelete = () => handleAction(
    async () => {
      if (!deleteAgent) return;
      await deleteAgentFromHook(deleteAgent.id);
      toast.success('Agente removido com sucesso!');
      setDeleteAgent(null);
    },
    `delete-${deleteAgent?.id}`
  );

  const handleCreated = (agentId: string) => {
    setModalOpen(false);
    router.push(`/admin/agentes/${agentId}/configuracao`);
  };

  return (
    <AdminListLayout
      icon={<Bot className="w-5 h-5 text-white" />}
      pageTitle={isSuperAdmin ? 'Gerenciar Agentes' : 'Meus Agentes'}
      pageDescription={isSuperAdmin ? 'Gerencie todos os agentes de IA do sistema' : 'Gerencie seus agentes de IA'}
      cardTitle={isSuperAdmin ? 'Agentes de IA' : 'Meus Agentes'}
      cardDescription={isSuperAdmin ? 'Visualize e gerencie todos os agentes de inteligência artificial do sistema' : 'Visualize e gerencie seus agentes de inteligência artificial'}
      actionButton={
        (isSuperAdmin || tenantId) && (
          <>
            <Button
              variant="add"
              onClick={() => setModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Novo Agente
            </Button>
            <AgentQuickCreateModal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              onCreated={handleCreated}
              tenantId={tenantId || ''}
            />
          </>
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
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green-light focus:border-transparent"
            >
              <option value="">Todos os tipos</option>
              <option value="internal">Interno (IA)</option>
              <option value="external">Externo (n8n)</option>
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
          <div className="md:col-span-3">
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
                <span className="px-2 py-1 bg-blue-100 rounded text-xs">Status: {filterStatus === 'active' ? 'Ativos' : 'Inativos'}</span>
              )}
              {filterType && (
                <span className="px-2 py-1 bg-blue-100 rounded text-xs">Tipo: {filterType === 'internal' ? 'Interno (IA)' : 'Externo (n8n)'}</span>
              )}
              {filterEmpresa && (
                <span className="px-2 py-1 bg-blue-100 rounded text-xs">Empresa: {empresasMap[filterEmpresa]}</span>
              )}
              {filterSearch && (
                <span className="px-2 py-1 bg-blue-100 rounded text-xs">Busca: &quot;{filterSearch}&quot;</span>
              )}
              <span className="text-blue-600">({filteredAgents.length} de {agentes.length} agentes)</span>
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
        ) : error ? (
          <Alert variant="error" title="Erro ao carregar agentes">
            {error}
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                disabled={loading}
              >
                Tentar novamente
              </Button>
            </div>
          </Alert>
        ) : filteredAgents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-4">
            {filteredAgents.map((agente: Agent) => {
              const isLoading = actionLoading?.startsWith(`toggle-${agente.id}`) || actionLoading?.startsWith(`delete-${agente.id}`);
              const instanceObj = agente.instance_id && instanciasMap[agente.instance_id]
                ? instanciasMap[agente.instance_id]
                : null;
              const instanceName = instanceObj ? instanceObj.instanceName : "Nenhuma instância vinculada";
              const instanceStatus = instanceObj ? instanceObj.status : null;
              return (
                <Card key={agente.id} className="flex flex-col p-4">
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <Link href={`/admin/agentes/${agente.id}/configuracao`} className="flex items-center gap-2 hover:text-brand-green-light transition-colors">
                        <Bot className="w-5 h-5 text-brand-green-light" />
                        {agente.title}
                      </Link>
                      <Switch
                        checked={agente.active}
                        onCheckedChange={() => handleToggleActive(agente)}
                        disabled={isLoading}
                        aria-label={agente.active ? 'Desativar agente' : 'Ativar agente'}
                      />
                    </CardTitle>
                    <CardDescription>
                      <span><span className="font-bold">Instância:</span> {instanceName}
                        {instanceObj && instanceStatus !== 'open' && (
                          <Tooltip content="Instância não conectada">
                            <AlertTriangle className="inline w-4 h-4 text-yellow-500 ml-1 align-text-bottom" />
                          </Tooltip>
                        )}
                      </span>
                      <span className="flex items-center gap-1 text-xs mt-1">
                        {agente.agent_type === 'external' ? (
                          <Image src="/n8n-logo.png" alt="n8n" width={20} height={20} className="w-5 h-5" />
                        ) : (
                          <Bot className="w-5 h-5 text-green-600" />
                        )}
                      </span>
                      {isSuperAdmin && empresasMap[agente.tenant_id] && (
                        <span className="flex items-center gap-1 text-xs mt-1">
                          <Building className="w-3 h-3" />
                          {empresasMap[agente.tenant_id]}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    {agente.description && (
                      <div className="text-sm text-gray-600 mb-2">
                        {agente.description}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-wrap items-center justify-end gap-2 pt-2 pb-2 px-0 bg-transparent">
                    <Tooltip content="Ver detalhes e acessar conversas do agente">
                      <Link href={`/admin/agentes/${agente.id}/configuracao`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          leftIcon={<FiSettings className="w-4 h-4" />}
                          aria-label="Detalhes"
                        >
                          Configurar
                        </Button>
                      </Link>
                    </Tooltip>
                    <Tooltip content="Deletar">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => setDeleteAgent(agente)}
                        disabled={isLoading}
                        leftIcon={<Trash2 className="w-4 h-4" />}
                        aria-label="Deletar"
                      >
                        Remover
                      </Button>
                    </Tooltip>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="w-12 h-12 mx-auto mb-4 text-gray-300">
              <Bot className="w-12 h-12" />
            </div>
            <p className="font-medium">
              {hasActiveFilters ? 'Nenhum agente encontrado com os filtros aplicados' : 'Nenhum agente encontrado'}
            </p>
            <p className="text-sm">
              {hasActiveFilters
                ? 'Tente ajustar os filtros ou use o botão "Limpar" para remover os filtros.'
                : ''
              }
            </p>
          </div>
        )}
        <ConfirmationModal
          isOpen={!!deleteAgent}
          onClose={() => setDeleteAgent(null)}
          onConfirm={handleDelete}
          title="Remover agente"
          confirmText="Remover"
          cancelText="Cancelar"
          isLoading={actionLoading?.startsWith(`delete-${deleteAgent?.id}`)}
        >
          <p>
            Tem certeza que deseja remover o agente <span className="font-semibold">&quot;{deleteAgent?.title}&quot;</span>? Esta ação não pode ser desfeita.
          </p>
        </ConfirmationModal>
      </AdminListLayout.List>
    </AdminListLayout>
  );
}

// Padrão: Este componente utiliza o layout padrão de listas administrativas (AdminListLayout) para garantir consistência visual e estrutural em todo o painel.
// ... existing code ... 