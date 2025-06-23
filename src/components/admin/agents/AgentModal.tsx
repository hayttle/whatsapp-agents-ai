"use client";
import { useState, useEffect } from "react";
import { agentService } from "@/services/agentService";
import { useInstances } from "@/hooks/useInstances";
import { tenantService, Tenant } from "@/services/tenantService";
import Modal, { ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Input, Button, Select, Alert } from "@/components/brand";
import { Building } from "lucide-react";
import { AgentModalProps } from "./types";

export function AgentModal({ open, onClose, onSaved, agent, tenantId, isSuperAdmin }: AgentModalProps) {
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [fallback, setFallback] = useState("");
  const [active, setActive] = useState(true);
  const [instanceId, setInstanceId] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("");
  const [empresas, setEmpresas] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const { instances } = useInstances({
    isSuperAdmin: false,
    tenantId: selectedTenant,
  });

  // Resetar campos ao abrir/fechar ou mudar agente
  useEffect(() => {
    if (agent) {
      setTitle(agent.title || "");
      setPrompt(agent.prompt || "");
      setFallback(agent.fallback_message || "");
      setActive(agent.active ?? true);
      setInstanceId(agent.instance_id || "");
      setSelectedTenant(agent.tenant_id || tenantId || "");
    } else {
      setTitle("");
      setPrompt("");
      setFallback("");
      setActive(true);
      setInstanceId("");
      setSelectedTenant(tenantId || "");
    }
    setMsg("");
    setError("");
  }, [agent, open, tenantId]);

  // Buscar empresas se for super admin
  useEffect(() => {
    if (isSuperAdmin && !agent) {
      const fetchEmpresas = async () => {
        try {
          const data = await tenantService.listTenants();
          setEmpresas(data.tenants || []);
        } catch {
          setEmpresas([]);
        }
      };
      fetchEmpresas();
    }
  }, [isSuperAdmin, agent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setError("");
    try {
      const agentData = {
        title,
        prompt,
        fallback_message: fallback,
        active,
        instance_id: instanceId || "",
        tenant_id: selectedTenant,
      };
      if (agent) {
        await agentService.updateAgent(agent.id, agentData);
        setMsg("Agente atualizado com sucesso!");
      } else {
        await agentService.createAgent(agentData);
        setMsg("Agente criado com sucesso!");
      }
      setTimeout(() => {
        setMsg("");
        onSaved();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar agente");
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
              required
              leftIcon={<Building className="w-4 h-4" />}
            >
              <option value="">Selecione a empresa</option>
              {(empresas || []).map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </Select>
          )}
          <Input
            label="Título do agente"
            placeholder="Ex: Bot de Atendimento"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium mb-1">Prompt (mensagem base de IA)</label>
            <textarea
              className="border rounded px-3 py-2 w-full"
              placeholder="Prompt do agente"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              required
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mensagem fallback (caso IA falhe)</label>
            <textarea
              className="border rounded px-3 py-2 w-full"
              placeholder="Mensagem fallback"
              value={fallback}
              onChange={e => setFallback(e.target.value)}
              required
              rows={2}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={active}
              onChange={e => setActive(e.target.checked)}
              id="active"
            />
            <label htmlFor="active">Ativo</label>
          </div>
          <Select
            label="Instância vinculada"
            value={instanceId}
            onChange={e => setInstanceId(e.target.value)}
          >
            <option value="">Sem instância vinculada</option>
            {(instances || []).map((inst) => (
              <option key={inst.id} value={inst.id}>{inst.instanceName}</option>
            ))}
          </Select>
        </ModalBody>
        <ModalFooter>
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
          >
            {agent ? "Salvar Alterações" : "Criar Agente"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
} 