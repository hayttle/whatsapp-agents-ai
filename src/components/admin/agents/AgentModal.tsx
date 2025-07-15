"use client";
import { useState, useEffect } from "react";
import { agentService } from "@/services/agentService";
import Modal, { ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Input, Button, Select, Switch } from "@/components/brand";
import { Building, Save, ArrowLeft } from "lucide-react";
import { AgentModalProps } from "./types";
import { toast } from "sonner";
import { useTenants } from "@/hooks/useTenants";
import { Alert } from '@/components/brand/Alert';

export function AgentModal({ open, onClose, onSaved, agent, tenantId, isSuperAdmin }: AgentModalProps) {
  // Remover todos os estados e campos relacionados a prompt, fallback, personalidade, tom, bufferTime, status, etc.
  // Manter apenas:
  // - title
  // - description
  // - agentType
  // - webhookUrl (se externo)
  // - selectedTenant (se super admin)

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [agentType, setAgentType] = useState<'internal' | 'external'>('internal');
  const [webhookUrl, setWebhookUrl] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [msg, setMsg] = useState<string>("");
  const { data: empresas } = useTenants(isSuperAdmin);

  // Resetar campos ao abrir/fechar ou mudar agente
  useEffect(() => {
    if (agent) {
      setTitle(agent.title || "");
      setDescription(agent.description || "");
      setAgentType(agent.agent_type || 'internal');
      setWebhookUrl(agent.webhookUrl || "");
      setSelectedTenant(agent.tenant_id || tenantId || "");
    } else {
      setTitle("");
      setDescription("");
      setAgentType('internal');
      setWebhookUrl("");
      setSelectedTenant(tenantId || "");
    }
  }, [agent, open, tenantId]);



  // No handleSubmit, só validar os campos essenciais
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");

    if (!title.trim()) {
      setError('O nome do agente é obrigatório.');
      setLoading(false);
      return;
    }
    if (agentType === 'external' && !webhookUrl.trim()) {
      setError('O endpoint do webhook é obrigatório para agentes externos.');
      setLoading(false);
      return;
    }
    if (agentType === 'external') {
      try {
        new URL(webhookUrl);
      } catch {
        setError('Endpoint deve ser uma URL válida.');
        setLoading(false);
        return;
      }
    }

    try {
      const agentData = {
        title,
        description: description || undefined,
        agent_type: agentType,
        webhookUrl: agentType === 'external' ? webhookUrl : undefined,
        tenant_id: selectedTenant || tenantId,
        status: 'active' as 'active',
      };
      if (agent) {
        await agentService.updateAgent(agent.id, agentData);
        setMsg("Agente atualizado com sucesso!");
        onSaved(agent.id);
      } else {
        const response = await agentService.createAgent({ ...agentData, instance_id: null });
        const newAgentId = response.agent?.id;
        setMsg("Agente criado com sucesso!");
        if (newAgentId) onSaved(newAgentId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao salvar agente";
      setError(errorMessage);
      console.error('[AgentModal] Erro ao salvar agente:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} className="w-full max-w-lg">
      <ModalHeader>{agent ? "Editar Agente" : "Novo Agente"}</ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          {msg && (
            <Alert variant="success" title="Sucesso">{msg}</Alert>
          )}
          {error && (
            <Alert variant="error" title="Erro">{error}</Alert>
          )}
          {isSuperAdmin && !agent && (
            <Select
              label="Empresa"
              value={selectedTenant}
              onChange={e => setSelectedTenant(e.target.value)}
              leftIcon={<Building className="w-4 h-4" />}
            >
              <option value="">Selecione a empresa (opcional)</option>
              {(empresas || []).map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </Select>
          )}
          <Input
            label="Nome do agente *"
            placeholder="Ex: Bot de Atendimento"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <Input
            label="Descrição"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descreva a finalidade ou detalhes do agente (opcional)"
          />
          <Select
            label="Tipo de agente"
            value={agentType}
            onChange={e => setAgentType(e.target.value as 'internal' | 'external')}
          >
            <option value="internal">Nativo (IA)</option>
            <option value="external">Externo (Webhook/n8n)</option>
          </Select>
          {agentType === 'external' && (
            <Input
              label="URL do Webhook n8n *"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              required
              placeholder="https://seu-n8n.com/webhook/abc123"
            />
          )}
        </ModalBody>
        <ModalFooter>
          {agent && (
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
              disabled={loading}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Voltar
            </Button>
          )}
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {agent ? "Salvar Alterações" : "Criar Agente"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
} 