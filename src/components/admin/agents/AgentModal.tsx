"use client";
import { useState, useEffect } from "react";
import { agentService } from "@/services/agentService";
import { tenantService, Tenant } from "@/services/tenantService";
import Modal, { ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Input, Button, Select, Alert, Switch } from "@/components/brand";
import { Building } from "lucide-react";
import { AgentModalProps } from "./types";

export function AgentModal({ open, onClose, onSaved, agent, tenantId, isSuperAdmin }: AgentModalProps) {
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [fallback, setFallback] = useState("");
  const [active, setActive] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [empresas, setEmpresas] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [personality, setPersonality] = useState('Friendly');
  const [customPersonality, setCustomPersonality] = useState('');
  const [tone, setTone] = useState('Empathetic');
  const [webhookUrl, setWebhookUrl] = useState("");

  // Resetar campos ao abrir/fechar ou mudar agente
  useEffect(() => {
    if (agent) {
      setTitle(agent.title || "");
      setPrompt(agent.prompt || "");
      setFallback(agent.fallback_message || "");
      setActive(agent.active ?? true);
      setSelectedTenant(agent.tenant_id || tenantId || "");
      setPersonality(agent.personality || 'Friendly');
      setCustomPersonality(agent.personality === 'Custom' ? (agent.custom_personality || '') : '');
      setTone(agent.tone || 'Empathetic');
      setWebhookUrl(agent.webhookUrl || "");
    } else {
      setTitle("");
      setPrompt("");
      setFallback("");
      setActive(true);
      setSelectedTenant(tenantId || "");
      setPersonality('Friendly');
      setCustomPersonality('');
      setTone('Empathetic');
      setWebhookUrl("");
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
        tenant_id: selectedTenant,
        personality: personality,
        custom_personality: personality === 'Custom' ? customPersonality : undefined,
        tone: tone,
        webhookUrl: webhookUrl || undefined,
      };
      if (agent) {
        await agentService.updateAgent(agent.id, agentData);
        setMsg("Agente atualizado com sucesso!");
      } else {
        await agentService.createAgent({ ...agentData, instance_id: null });
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
            <label className="block text-sm font-medium mb-1">Personalidade</label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={personality}
              onChange={e => setPersonality(e.target.value)}
              required
            >
              <option value="Friendly">Amigável</option>
              <option value="Professional">Profissional</option>
              <option value="Sophisticated">Sofisticado</option>
              <option value="Custom">Personalizado</option>
            </select>
            {personality === 'Custom' && (
              <input
                className="border rounded px-3 py-2 w-full mt-2"
                placeholder="Descreva a personalidade personalizada"
                value={customPersonality}
                onChange={e => setCustomPersonality(e.target.value)}
                required
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tom de Voz</label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={tone}
              onChange={e => setTone(e.target.value)}
              required
            >
              <option value="Empathetic">Empático</option>
              <option value="Direct">Direto</option>
              <option value="Humorous">Bem-humorado</option>
              <option value="Robotic">Robótico</option>
            </select>
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
            <Switch
              checked={active}
              onCheckedChange={setActive}
              id="active"
            >
              Ativo
            </Switch>
          </div>
          <Input
            label="Webhook do agente (URL)"
            placeholder="https://meusistema.com/webhook"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            type="url"
            required={false}
          />
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