"use client";
import { useState, useEffect } from "react";
import { agentService } from "@/services/agentService";
import Modal, { ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Input, Button, Select, Switch } from "@/components/brand";
import { Building, Save, ArrowLeft } from "lucide-react";
import { AgentModalProps } from "./types";
import { toast } from "sonner";
import { useTenants } from "@/hooks/useTenants";

export function AgentModal({ open, onClose, onSaved, agent, tenantId, isSuperAdmin }: AgentModalProps) {
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [fallback, setFallback] = useState("");
  const [active, setActive] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [loading, setLoading] = useState(false);
  const { data: empresas } = useTenants(isSuperAdmin);
  const [personality, setPersonality] = useState('Friendly');
  const [customPersonality, setCustomPersonality] = useState('');
  const [tone, setTone] = useState('Empathetic');
  const [webhookUrl, setWebhookUrl] = useState("");
  const [description, setDescription] = useState("");
  const [agentType, setAgentType] = useState<'internal' | 'external'>('internal');
  const [bufferTime, setBufferTime] = useState<number>(10);

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
      setDescription(agent.description || "");
      setAgentType(agent.agent_type || 'internal');
      setBufferTime(agent.buffer_time ?? 10);
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
      setDescription("");
      setAgentType('internal');
      setBufferTime(10);
    }
  }, [agent, open, tenantId]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Validação específica por tipo de agente
    if (agentType === 'internal') {
      if (!prompt.trim()) {
        toast.error('Prompt é obrigatório para agentes internos.');
        setLoading(false);
        return;
      }
      if (!fallback.trim()) {
        toast.error('Mensagem fallback é obrigatória para agentes internos.');
        setLoading(false);
        return;
      }
    } else {
      if (!webhookUrl.trim()) {
        toast.error('Endpoint é obrigatório para agentes externos.');
        setLoading(false);
        return;
      }
      // Validar se é uma URL válida
      try {
        new URL(webhookUrl);
      } catch {
        toast.error('Endpoint deve ser uma URL válida.');
        setLoading(false);
        return;
      }
    }
    
    try {
      const agentData = {
        title,
        prompt: agentType === 'internal' ? prompt : '',
        fallback_message: agentType === 'internal' ? fallback : undefined,
        active,
        tenant_id: selectedTenant,
        personality: agentType === 'internal' ? personality : undefined,
        custom_personality: agentType === 'internal' && personality === 'Custom' ? customPersonality : undefined,
        tone: agentType === 'internal' ? tone : undefined,
        webhookUrl: agentType === 'external' ? webhookUrl : undefined,
        description: description || undefined,
        agent_type: agentType,
        buffer_time: bufferTime,
      };
      if (agent) {
        await agentService.updateAgent(agent.id, agentData);
        toast.success("Agente atualizado com sucesso!");
      } else {
        await agentService.createAgent({ ...agentData, instance_id: null });
        toast.success("Agente criado com sucesso!");
      }
      onSaved();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao salvar agente";
      toast.error(errorMessage);
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
            label="Título do agente *"
            placeholder="Ex: Bot de Atendimento"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium mb-1">Tempo de pausa para resposta (segundos)</label>
            <input
              type="number"
              min={0}
              step={1}
              className="border rounded px-3 py-2 w-full"
              placeholder="Ex: 10"
              value={bufferTime}
              onChange={e => setBufferTime(Number(e.target.value))}
              disabled={loading}
            />
            <span className="text-xs text-gray-500">O agente só irá responder após esse tempo, caso o usuário não envie outra mensagem.</span>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <textarea
              className="border rounded px-3 py-2 w-full resize-none min-h-[60px]"
              placeholder="Descreva a finalidade ou detalhes do agente (opcional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={255}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Agente *</label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={agentType}
              onChange={e => setAgentType(e.target.value as 'internal' | 'external')}
              required
              disabled={loading}
            >
              <option value="internal">Agente Interno (IA)</option>
              <option value="external">Agente Externo (n8n/Webhook)</option>
            </select>
          </div>
          
          {agentType === 'internal' ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Prompt (mensagem base de IA) *</label>
                <textarea
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Prompt do agente"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  required
                  rows={4}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Personalidade</label>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={personality}
                  onChange={e => setPersonality(e.target.value)}
                  required
                  disabled={loading}
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
                    disabled={loading}
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
                  disabled={loading}
                >
                  <option value="Empathetic">Empático</option>
                  <option value="Direct">Direto</option>
                  <option value="Humorous">Bem-humorado</option>
                  <option value="Robotic">Robótico</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mensagem fallback (caso IA falhe) *</label>
                <textarea
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Mensagem fallback"
                  value={fallback}
                  onChange={e => setFallback(e.target.value)}
                  required
                  rows={2}
                  disabled={loading}
                />
              </div>
            </>
          ) : (
            <Input
              label="Endpoint (URL do webhook) *"
              placeholder="https://seu-n8n.com/webhook/123"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              type="url"
              required
              disabled={loading}
            />
          )}
          
          <div className="flex items-center gap-2">
            <Switch
              checked={active}
              onCheckedChange={setActive}
              id="active"
            >
              Ativo
            </Switch>
          </div>
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