"use client";
import { useState } from "react";
import { AgentModal } from "@/components/admin/AgentModal";
import { useAgents } from "@/hooks/useAgents";
import { useActions } from "@/hooks/useActions";
import { agentService } from "@/services/agentService";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { Button, Card, Input, Select, Badge, StatusIndicator, Alert } from "@/components/brand";
import { Bot, Plus, Edit, Trash2, Power, PowerOff, Building } from "lucide-react";

interface AgentListProps {
  isSuperAdmin: boolean;
  tenantId?: string;
}

export function AgentList({ isSuperAdmin, tenantId }: AgentListProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [filtroAtivo, setFiltroAtivo] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editAgent, setEditAgent] = useState<any | null>(null);
  const [deleteAgent, setDeleteAgent] = useState<any | null>(null);
  
  const { agentes, empresas, instancias, loading, error } = useAgents({
    isSuperAdmin,
    tenantId,
    refreshKey,
  });
  
  const { actionLoading, handleAction } = useActions();

  const agentesFiltrados = agentes.filter(a =>
    filtroAtivo === 'all' ? true : filtroAtivo === 'active' ? a.active : !a.active
  );

  const handleToggleActive = (agente: any) => handleAction(
    async () => {
      await agentService.toggleAgentStatus(agente.id, !agente.active);
      setRefreshKey(k => k + 1);
    },
    `toggle-${agente.id}`,
    `Agente ${agente.active ? 'desativado' : 'ativado'} com sucesso!`
  );

  const handleDelete = () => handleAction(
    async () => {
      if (!deleteAgent) return;
      await agentService.deleteAgent(deleteAgent.id);
      setDeleteAgent(null);
      setRefreshKey(k => k + 1);
    },
    `delete-${deleteAgent?.id}`,
    "Agente deletado com sucesso!"
  );

  const handleSave = () => {
    setShowModal(false);
    setEditAgent(null);
    setRefreshKey(k => k + 1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green-light"></div>
      </div>
    );
  }

  if (error) {
    return <Alert variant="error" title="Erro ao carregar agentes" children={error} />;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Select
          label="Filtrar por status"
          value={filtroAtivo}
          onChange={e => setFiltroAtivo(e.target.value as any)}
          className="w-full md:w-48"
        >
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </Select>
        {(isSuperAdmin || tenantId) && (
          <Button 
            className="ml-auto" 
            onClick={() => { setEditAgent(null); setShowModal(true); }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Novo Agente
          </Button>
        )}
      </div>

      {agentesFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agentesFiltrados.map((agente: any) => {
            const isLoading = actionLoading.startsWith(`toggle-${agente.id}`) || actionLoading.startsWith(`delete-${agente.id}`);
            return (
              <Card key={agente.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-brand-green-light" />
                      {agente.title}
                    </span>
                    <StatusIndicator active={agente.active} />
                  </CardTitle>
                  <CardDescription>
                    Instância: {instancias[agente.instance_id] || "Não definida"}
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
          <p className="text-sm">Use o botão "Novo Agente" para criar o primeiro.</p>
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