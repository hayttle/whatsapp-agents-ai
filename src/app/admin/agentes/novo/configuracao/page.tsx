'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/brand/Card';
import { Button } from '@/components/brand/Button';
import { Input } from '@/components/brand/Input';
import { Select } from '@/components/brand/Select';
import { Switch } from '@/components/brand/Switch';
import { FiBookOpen, FiUser, FiCalendar, FiSettings, FiSave, FiArrowLeft } from 'react-icons/fi';
import { PromptModelDropdown } from '@/components/admin/agents/internal/PromptModelDropdown';
import { PromptModel } from '@/services/promptModelService';
import { toast } from 'sonner';
import { agentService } from '@/services/agentService';


interface CreateAgentData {
  title: string;
  description?: string;
  prompt: string;
  active: boolean;
  personality?: string;
  custom_personality?: string;
  tone?: string;
  rules?: string;
  buffer_time?: number;
  agent_model_id?: string | null;
  scheduling_enabled?: boolean;
  calendar_id?: string;
  scheduling_query_prompt?: string;
  scheduling_create_prompt?: string;
  webhookUrl?: string;
  agent_type: 'internal' | 'external';
  tenant_id: string;
}

export default function NovoAgenteConfigPage() {
  const router = useRouter();
  
  // Estados locais para formulário
  const [agentPrompt, setAgentPrompt] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Estados do agente
  const [agent, setAgent] = useState<CreateAgentData>({
    title: '',
    description: '',
    prompt: '',
    active: true,
    personality: '',
    custom_personality: '',
    tone: '',
    rules: '',
    buffer_time: 10,
    agent_model_id: null,
    scheduling_enabled: false,
    calendar_id: '',
    scheduling_query_prompt: '',
    scheduling_create_prompt: '',
    webhookUrl: '',
    agent_type: 'internal',
    tenant_id: '',
  });



  // Buscar dados do usuário logado para definir tenant_id
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/users/current');
        if (response.ok) {
          const userData = await response.json();
          setAgent(prev => ({
            ...prev,
            tenant_id: userData.tenant_id || ''
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
      }
    };
    fetchUserData();
  }, []);

  const handleModelSelect = (model: PromptModel) => {
    setSelectedModelId(model.id);
    setAgentPrompt(model.content);
    setAgent(prev => ({
      ...prev,
      agent_model_id: model.id,
      prompt: model.content
    }));
  };

  const updateField = (field: keyof CreateAgentData, value: string | number | boolean | null | undefined) => {
    setAgent(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!agent.title.trim()) {
      toast.error('Título do agente é obrigatório');
      return;
    }

    if (agent.agent_type === 'internal' && !agent.prompt.trim()) {
      toast.error('Prompt é obrigatório para agentes internos');
      return;
    }

    if (agent.agent_type === 'external' && !agent.webhookUrl?.trim()) {
      toast.error('URL do webhook é obrigatória para agentes externos');
      return;
    }

    // Buscar tenant_id do usuário logado para garantir que nunca fique vazio
    let tenantId = agent.tenant_id;
    try {
      const response = await fetch('/api/users/current');
      if (response.ok) {
        const userData = await response.json();
        console.log('userData retornado de /api/users/current:', userData);
        const role = userData.role || userData.user?.role;
        if (role === 'user') {
          tenantId = userData.tenant_id || userData.user?.tenant_id || '';
        }
      }
    } catch {
      // Se der erro, mantém o valor atual
    }

    if (!tenantId) {
      toast.error('Empresa é obrigatória');
      return;
    }

    console.log('tenant_id enviado:', tenantId);

    setSaving(true);
    try {
      const agentData = {
        title: agent.title,
        description: agent.description,
        prompt: agent.prompt,
        active: agent.active,
        personality: agent.personality,
        custom_personality: agent.custom_personality,
        tone: agent.tone,
        rules: agent.rules,
        buffer_time: agent.buffer_time,
        agent_model_id: selectedModelId || null,
        scheduling_enabled: agent.scheduling_enabled,
        calendar_id: agent.calendar_id,
        scheduling_query_prompt: agent.scheduling_query_prompt,
        scheduling_create_prompt: agent.scheduling_create_prompt,
        webhookUrl: agent.webhookUrl,
        agent_type: agent.agent_type,
        tenant_id: tenantId,
        instance_id: null,
      };

      await agentService.createAgent(agentData);
      toast.success('Agente criado com sucesso!');
      router.push('/admin/agentes');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar agente';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">


      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            onClick={handleCancel}
            leftIcon={<FiArrowLeft />}
            className="mr-2"
          >
            Voltar
          </Button>
          <div className="bg-brand-green-light/10 rounded-full p-3">
            <FiUser className="text-brand-green-light text-3xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Novo Agente de IA</h1>
            <p className="text-gray-600">Configure o comportamento do seu novo agente inteligente</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch 
            checked={agent.active} 
            onCheckedChange={(checked) => updateField('active', checked)} 
            id="agent-active"
          >
            <span className="text-sm font-medium text-gray-700">Ativado</span>
          </Switch>
        </div>
      </div>

      {/* Seção: Configurações Básicas */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <div className="bg-gray-100 rounded-full p-2"><FiSettings className="text-gray-500 text-xl" /></div>
          <div>
            <CardTitle>Configurações Básicas</CardTitle>
            <CardDescription>Informações básicas do agente</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input 
            label="Título do agente *" 
            placeholder="Ex: Bot de Atendimento" 
            value={agent.title || ''}
            onChange={(e) => updateField('title', e.target.value)}
            required
          />
          <Input 
            label="Descrição" 
            placeholder="Descreva a finalidade do agente" 
            value={agent.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-brand-gray-dark mb-2">Tipo de Agente *</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-brand-green-light focus:outline-none focus:ring-1 focus:ring-brand-green-light"
              value={agent.agent_type}
              onChange={(e) => updateField('agent_type', e.target.value as 'internal' | 'external')}
              required
            >
              <option value="internal">Agente Interno (IA)</option>
              <option value="external">Agente Externo (n8n/Webhook)</option>
            </select>
          </div>
          {agent.agent_type === 'internal' && (
            <Input 
              label="Tempo de pausa (segundos)" 
              placeholder="10" 
              type="number"
              value={agent.buffer_time || ''}
              onChange={(e) => updateField('buffer_time', parseFloat(e.target.value) || 10)}
            />
          )}
        </CardContent>
      </Card>

      {/* Seção: Configuração Webhook - apenas para agentes externos */}
      {agent.agent_type === 'external' && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="bg-purple-100 rounded-full p-2"><FiSettings className="text-purple-500 text-xl" /></div>
            <div>
              <CardTitle>Configuração Webhook</CardTitle>
              <CardDescription>Configure o endpoint n8n para seu agente externo</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input 
                label="URL do Webhook n8n *" 
                placeholder="https://seu-n8n.com/webhook/abc123" 
                value={agent.webhookUrl || ''}
                onChange={(e) => updateField('webhookUrl', e.target.value)}
                required
              />
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                <p><strong>Como configurar:</strong></p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Crie um webhook no n8n</li>
                  <li>Copie a URL do webhook gerada</li>
                  <li>Cole a URL no campo acima</li>
                  <li>Configure a lógica de resposta no n8n</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção: Modelos Padrão - apenas para agentes internos */}
      {agent.agent_type === 'internal' && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="bg-blue-100 rounded-full p-2"><FiBookOpen className="text-blue-500 text-xl" /></div>
            <div>
              <CardTitle>Modelos Padrão</CardTitle>
              <CardDescription>Selecione um modelo pré-configurado para seu agente</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <PromptModelDropdown
                onSelect={handleModelSelect}
                value={selectedModelId}
              />
              {/* Textarea para texto do prompt do agente */}
              <div>
                <label className="block text-sm font-medium text-brand-gray-dark mb-2">Prompt do Agente *</label>
                <textarea 
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 transition-colors focus:border-brand-green-light focus:outline-none focus:ring-1 focus:ring-brand-green-light disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed" 
                  placeholder="Digite ou selecione um modelo para o prompt do agente" 
                  rows={6}
                  value={agentPrompt}
                  onChange={(e) => {
                    setAgentPrompt(e.target.value);
                    updateField('prompt', e.target.value);
                  }}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção: Personalidade do Agente - apenas para agentes internos */}
      {agent.agent_type === 'internal' && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="bg-green-100 rounded-full p-2"><FiUser className="text-green-500 text-xl" /></div>
            <div>
              <CardTitle>Personalidade do Agente</CardTitle>
              <CardDescription>Configure a personalidade do seu agente</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Descrição da Personalidade como textarea */}
            <div>
              <label className="block text-sm font-medium text-brand-gray-dark mb-2">Descrição da Personalidade</label>
              <textarea 
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 transition-colors focus:border-brand-green-light focus:outline-none focus:ring-1 focus:ring-brand-green-light disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed" 
                placeholder="Exemplo de personalidade" 
                rows={3}
                value={agent.personality || ''}
                onChange={(e) => updateField('personality', e.target.value)}
              />
            </div>
            <Select 
              label="Tom de voz"
              value={agent.tone || ''}
              onChange={(e) => updateField('tone', e.target.value)}
            >
              <option value="">Selecione um tom</option>
              <option value="profissional">Profissional</option>
              <option value="amigavel">Amigável</option>
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Seção: Regras e Restrições - apenas para agentes internos */}
      {agent.agent_type === 'internal' && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="bg-yellow-100 rounded-full p-2"><FiSettings className="text-yellow-500 text-xl" /></div>
            <div>
              <CardTitle>Regras e Restrições</CardTitle>
              <CardDescription>Defina as regras gerais e restrições do seu agente</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {/* Regras e Restrições como textarea */}
            <div>
              <label className="block text-sm font-medium text-brand-gray-dark mb-2">Regras e Restrições</label>
              <textarea 
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 transition-colors focus:border-brand-green-light focus:outline-none focus:ring-1 focus:ring-brand-green-light disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed" 
                placeholder="Descreva as regras e restrições" 
                rows={3}
                value={agent.rules || ''}
                onChange={(e) => updateField('rules', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção: Agendamento - apenas para agentes internos */}
      {agent.agent_type === 'internal' && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="bg-pink-100 rounded-full p-2"><FiCalendar className="text-pink-500 text-xl" /></div>
            <div>
              <CardTitle>Agendamento</CardTitle>
              <CardDescription>Vincule uma agenda do Google Agenda ao seu agente</CardDescription>
            </div>
            <div className="ml-auto">
              <Switch 
                checked={agent.scheduling_enabled || false} 
                onCheckedChange={(checked) => updateField('scheduling_enabled', checked)} 
                id="scheduling-enabled"
              >
                <span className="text-sm font-medium text-pink-700">Ativar</span>
              </Switch>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input 
              label="ID da Agenda" 
              placeholder="ID da agenda" 
              value={agent.calendar_id || ''}
              onChange={(e) => updateField('calendar_id', e.target.value)}
            />
            {/* Prompt para consultar agendamento como textarea */}
            <div>
              <label className="block text-sm font-medium text-brand-gray-dark mb-2">Prompt para consultar agendamento</label>
              <textarea 
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 transition-colors focus:border-brand-green-light focus:outline-none focus:ring-1 focus:ring-brand-green-light disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed" 
                placeholder="Prompt para consultar agendamento" 
                rows={2}
                value={agent.scheduling_query_prompt || ''}
                onChange={(e) => updateField('scheduling_query_prompt', e.target.value)}
              />
            </div>
            {/* Prompt para marcar agendamento como textarea */}
            <div>
              <label className="block text-sm font-medium text-brand-gray-dark mb-2">Prompt para marcar agendamento</label>
              <textarea 
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 transition-colors focus:border-brand-green-light focus:outline-none focus:ring-1 focus:ring-brand-green-light disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed" 
                placeholder="Prompt para marcar agendamento" 
                rows={2}
                value={agent.scheduling_create_prompt || ''}
                onChange={(e) => updateField('scheduling_create_prompt', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões de ação */}
      <div className="flex justify-between gap-2">
        <Button variant="ghost" onClick={handleCancel} leftIcon={<FiArrowLeft />}>
          Voltar
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSave}
          loading={saving}
          leftIcon={<FiSave />}
        >
          Criar Agente
        </Button>
      </div>
    </div>
  );
} 