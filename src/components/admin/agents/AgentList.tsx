"use client";
import { useState, useMemo } from "react";
import { AgentModal } from "./AgentModal";
import { useAgents } from "@/hooks/useAgents";
import { useActions } from "@/hooks/useActions";
import { Agent } from "./types";
import { ConfirmationModal } from "@/components/ui";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, StatusIndicator, Alert } from "@/components/brand";
import { Bot, Plus, Edit, Trash2, Power, PowerOff, Building, AlertTriangle, Filter, X } from "lucide-react";
import { Tooltip } from '@/components/ui';
import Image from 'next/image';

interface AgentListProps {
  isSuperAdmin: boolean;
  tenantId?: string;
}

export function AgentList({ isSuperAdmin, tenantId }: AgentListProps) {
  const [showModal, setShowModal] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [deleteAgent, setDeleteAgent] = useState<Agent | null>(null);
  
  // Estados dos filtros
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterEmpresa, setFilterEmpresa] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  const { 
    agentes, 
    empresas, 
    instancias, 
    loading, 
    error, 
    refetch,
    toggleAgentStatus,
    deleteAgent: deleteAgentFromHook
  } = useAgents({
    isSuperAdmin,
    tenantId,
  });
  
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
    },
    `toggle-${agente.id}`
  );

  const handleDelete = () => handleAction(
    async () => {
      if (!deleteAgent) return;
      await deleteAgentFromHook(deleteAgent.id);
      setDeleteAgent(null);
    },
    `delete-${deleteAgent?.id}`
  );

  const handleSave = () => {
    setShowModal(false);
    setEditAgent(null);
    refetch();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green-light"></div>
      </div>
    );
  }

  if (error) {
    return <Alert variant="error" title="Erro ao carregar agentes">{error}</Alert>;
  }

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
                {[filterStatus, filterEmpresa, filterSearch, filterType].filter(Boolean).length}
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
        
        {(isSuperAdmin || tenantId) && (
          <button 
            className="px-4 py-2 text-sm font-semibold text-white bg-brand-gray-dark rounded-md hover:bg-brand-gray-deep transition-colors flex items-center gap-2 whitespace-nowrap"
            onClick={() => { setEditAgent(null); setShowModal(true); }}
          >
            <Plus className="w-4 h-4" />
            Novo Agente
          </button>
        )}
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
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
                placeholder="Digite o nome ou descrição..."
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
                Status: {filterStatus === 'active' ? 'Ativos' : 'Inativos'}
              </span>
            )}
            {filterType && (
              <span className="px-2 py-1 bg-blue-100 rounded text-xs">
                Tipo: {filterType === 'internal' ? 'Interno (IA)' : 'Externo (n8n)'}
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
              ({filteredAgents.length} de {agentes.length} agentes)
            </span>
          </div>
        </div>
      )}

      {filteredAgents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agente: Agent) => {
            const isLoading = actionLoading?.startsWith(`toggle-${agente.id}`) || actionLoading?.startsWith(`delete-${agente.id}`);
            const instanceObj = agente.instance_id && instancias[agente.instance_id]
              ? instancias[agente.instance_id]
              : null;
            const instanceName = instanceObj ? instanceObj.instanceName : "Nenhuma instância vinculada";
            const instanceStatus = instanceObj ? instanceObj.status : null;
            return (
              <Card key={agente.id} className="flex flex-col p-4">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-brand-green-light" />
                      {agente.title}
                    </span>
                    <StatusIndicator status={agente.active ? 'online' : 'offline'} />
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
                    {isSuperAdmin && empresas[agente.tenant_id] && (
                      <span className="flex items-center gap-1 text-xs mt-1">
                        <Building className="w-3 h-3"/>
                        {empresas[agente.tenant_id]}
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
                  {/* Prompt removido */}
                  {''}
                </CardContent>
                <CardFooter className="flex flex-wrap items-center justify-end gap-2 pt-2 pb-2 px-0 bg-transparent">
                  <Tooltip content={agente.active ? 'Desativar' : 'Ativar'}>
                    <Button 
                      variant={agente.active ? 'warning' : 'primary'}
                      size="sm" 
                      className="min-w-0 w-9 h-9 p-0 flex items-center justify-center"
                      onClick={() => handleToggleActive(agente)} 
                      disabled={isLoading}
                      leftIcon={agente.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      aria-label={agente.active ? 'Desativar' : 'Ativar'}
                    >
                      {''}
                    </Button>
                  </Tooltip>
                  <Tooltip content="Editar">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="min-w-0 w-9 h-9 p-0 flex items-center justify-center"
                      onClick={() => { setEditAgent(agente); setShowModal(true); }} 
                      disabled={isLoading}
                      leftIcon={<Edit className="w-4 h-4" />}
                      aria-label="Editar"
                    >
                      {''}
                    </Button>
                  </Tooltip>
                  <Tooltip content="Deletar">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="min-w-0 w-9 h-9 p-0 flex items-center justify-center"
                      onClick={() => setDeleteAgent(agente)} 
                      disabled={isLoading}
                      leftIcon={<Trash2 className="w-4 h-4" />}
                      aria-label="Deletar"
                    >
                      {''}
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
              : 'Use o botão "Novo Agente" para criar o primeiro.'
            }
          </p>
        </div>
      )}
      
      <AgentModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSaved={handleSave}
        agent={editAgent}
        tenantId={tenantId || ""}
        isSuperAdmin={isSuperAdmin}
      />
      
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
    </div>
  );
} 