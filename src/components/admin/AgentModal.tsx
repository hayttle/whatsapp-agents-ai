"use client";
import { useState, useEffect } from "react";
import { agentService } from "@/services/agentService";
import { useActions } from "@/hooks/useActions";
import { useInstances } from "@/hooks/useInstances";
import { tenantService } from "@/services/tenantService";
import Modal from "@/components/ui/Modal";

interface AgentModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  agent?: any | null;
  tenantId: string;
  isSuperAdmin?: boolean;
}

export function AgentModal({ open, onClose, onSaved, agent, tenantId, isSuperAdmin }: AgentModalProps) {
  const [title, setTitle] = useState(agent?.title || "");
  const [prompt, setPrompt] = useState(agent?.prompt || "");
  const [fallback, setFallback] = useState(agent?.fallback_message || "");
  const [active, setActive] = useState(agent?.active ?? true);
  const [instanceId, setInstanceId] = useState(agent?.instance_id || "");
  const [selectedTenant, setSelectedTenant] = useState(agent?.tenant_id || tenantId || "");
  const [empresas, setEmpresas] = useState<any[]>([]);
  
  const { actionLoading, handleAction } = useActions();
  const { instancias } = useInstances({
    isSuperAdmin: false,
    tenantId: selectedTenant,
    refreshKey: 0,
  });

  useEffect(() => {
    setTitle(agent?.title || "");
    setPrompt(agent?.prompt || "");
    setFallback(agent?.fallback_message || "");
    setActive(agent?.active ?? true);
    setInstanceId(agent?.instance_id || "");
    setSelectedTenant(agent?.tenant_id || tenantId || "");
  }, [agent, tenantId]);

  useEffect(() => {
    if (isSuperAdmin && !agent) {
      // Buscar empresas para super_admin criar agente
      const fetchEmpresas = async () => {
        try {
          const data = await tenantService.listTenants();
          setEmpresas(data.tenants || []);
        } catch (error) {
          console.error('Error fetching tenants:', error);
        }
      };
      fetchEmpresas();
    }
  }, [isSuperAdmin, agent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const agentData = {
      title,
      prompt,
      fallback_message: fallback,
      active,
      instance_id: instanceId || null,
      tenant_id: selectedTenant,
    };

    await handleAction(
      async () => {
        if (agent) {
          // Editar
          await agentService.updateAgent(agent.id, agentData);
        } else {
          // Criar
          await agentService.createAgent(agentData);
        }
        setTimeout(() => {
          onSaved();
        }, 1000);
      },
      agent ? 'update-agent' : 'create-agent',
      `Agente ${agent ? 'atualizado' : 'criado'} com sucesso!`
    );
  };

  if (!open) return null;

  return (
    <Modal isOpen={open} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">{agent ? 'Editar Agente' : 'Novo Agente'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSuperAdmin && !agent && (
            <select
              value={selectedTenant}
              onChange={e => setSelectedTenant(e.target.value)}
              required
              className="border rounded px-3 py-2 w-full"
            >
              <option value="">Selecione a empresa</option>
              {empresas.map((emp: any) => (
                <option key={emp.id} value={emp.id}>{emp.nome}</option>
              ))}
            </select>
          )}
          <input
            type="text"
            placeholder="Título do agente"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="border rounded px-3 py-2 w-full"
          />
          <textarea
            placeholder="Prompt (mensagem base de IA)"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            required
            rows={4}
            className="border rounded px-3 py-2 w-full"
          />
          <textarea
            placeholder="Mensagem fallback (caso IA falhe)"
            value={fallback}
            onChange={e => setFallback(e.target.value)}
            required
            rows={2}
            className="border rounded px-3 py-2 w-full"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={active}
              onChange={e => setActive(e.target.checked)}
              id="active"
            />
            <label htmlFor="active">Ativo</label>
          </div>
          <select
            value={instanceId}
            onChange={e => setInstanceId(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          >
            <option value="">Sem instância vinculada</option>
            {instancias.map((inst: any) => (
              <option key={inst.id} value={inst.id}>{inst.name}</option>
            ))}
          </select>
          <button 
            type="submit" 
            disabled={actionLoading === 'update-agent' || actionLoading === 'create-agent'} 
            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
          >
            {actionLoading === 'update-agent' || actionLoading === 'create-agent' 
              ? "Salvando..." 
              : agent ? "Salvar alterações" : "Criar agente"
            }
          </button>
        </form>
      </div>
    </Modal>
  );
} 