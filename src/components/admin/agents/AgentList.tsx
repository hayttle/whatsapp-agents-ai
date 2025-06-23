"use client";
import { useState } from "react";
import { AgentModal } from "./AgentModal";
import { useAgents } from "@/hooks/useAgents";
import { useActions } from "@/hooks/useActions";
import { Agent } from "./types";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Select, StatusIndicator, Alert } from "@/components/brand";
import { Bot, Plus, Edit, Trash2, Power, PowerOff, Building } from "lucide-react";

interface AgentListProps {
  isSuperAdmin: boolean;
  tenantId?: string;
}

export function AgentList({ isSuperAdmin, tenantId }: AgentListProps) {
  const [filtroAtivo, setFiltroAtivo] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [deleteAgent, setDeleteAgent] = useState<Agent | null>(null);
  
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

  const agentesFiltrados = agentes.filter((a: Agent) =>
    filtroAtivo === 'all' ? true : filtroAtivo === 'active' ? a.active : !a.active
  );

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
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Select
          label="Filtrar por status"
          value={filtroAtivo}
          onChange={e => setFiltroAtivo(e.target.value as 'all' | 'active' | 'inactive')}
          className="w-full md:w-48"
        >
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </Select>
        {(isSuperAdmin || tenantId) && (
          <button 
            className="px-4 py-2 text-sm font-semibold text-white bg-brand-gray-dark rounded-md hover:bg-brand-gray-deep transition-colors flex items-center gap-2 whitespace-nowrap self-end"
            onClick={() => { setEditAgent(null); setShowModal(true); }}
          >
            <Plus className="w-4 h-4" />
            Novo Agente
          </button>
        )}
      </div>

      {agentesFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agentesFiltrados.map((agente: Agent) => {
            const isLoading = actionLoading?.startsWith(`toggle-${agente.id}`) || actionLoading?.startsWith(`delete-${agente.id}`);
            return (
              <Card key={agente.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-brand-green-light" />
                      {agente.title}
                    </span>
                    <StatusIndicator status={agente.active ? 'online' : 'offline'} />
                  </CardTitle>
                  <CardDescription>
                    Instância: {instancias[agente.instance_id || ''] || "Não definida"}
                    {isSuperAdmin && empresas[agente.tenant_id] && (
                      <span className="flex items-center gap-1 text-xs mt-1">
                        <Building className="w-3 h-3"/>
                        {empresas[agente.tenant_id]}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {agente.prompt || "Este agente não possui uma descrição detalhada."}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 bg-gray-50/50 p-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => { setEditAgent(agente); setShowModal(true); }} 
                    disabled={isLoading}
                    leftIcon={<Edit className="w-4 h-4" />}
                  >
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleToggleActive(agente)} 
                    disabled={isLoading}
                    leftIcon={agente.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  >
                    {agente.active ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => setDeleteAgent(agente)} 
                    disabled={isLoading}
                    leftIcon={<Trash2 className="w-4 h-4" />}
                  >
                    Deletar
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500 border border-dashed rounded-lg">
          <Bot className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <h3 className="text-lg font-semibold">Nenhum agente encontrado</h3>
          <p className="text-sm">Use o botão &quot;Novo Agente&quot; para criar o primeiro.</p>
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
      
      {deleteAgent && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setDeleteAgent(null)}
          onConfirm={handleDelete}
          title="Confirmar exclusão"
          confirmText="Deletar"
          isLoading={actionLoading === `delete-${deleteAgent.id}`}
        >
          Tem certeza que deseja deletar o agente <span className="font-semibold">&quot;{deleteAgent.title}&quot;</span>?
        </ConfirmationModal>
      )}
    </div>
  );
} 