'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/brand/Card';
import { Button } from '@/components/brand/Button';
import { Input } from '@/components/brand/Input';
import { Select } from '@/components/brand/Select';
import { Switch } from '@/components/brand/Switch';
import { FiBookOpen, FiUser, FiCalendar, FiSettings, FiSave, FiX, FiArrowLeft } from 'react-icons/fi';
import { PromptModelDropdown } from '@/components/admin/agents/internal/PromptModelDropdown';
import { PromptModel } from '@/services/promptModelService';
import { useAgentConfig } from '@/hooks/useAgentConfig';
import { toast } from 'sonner';
import { agentService } from '@/services/agentService';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { deepEqual } from '@/lib/utils';

export default function AgentConfigPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params?.id as string;
  const isNewAgent = agentId === 'novo';
  
  // Estados locais para formulário - sempre declarados
  const [agentPrompt, setAgentPrompt] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [initialAgent, setInitialAgent] = useState<unknown>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<null | (() => void)>(null);
  
  // Hook sempre chamado, mas pode retornar dados vazios se agentId for inválido
  const { agent, loading, saving, error, saveAgent, updateField } = useAgentConfig({ 
    agentId: isNewAgent ? '' : (agentId || '') 
  });

  // Sincronizar dados do agente com estados locais
  useEffect(() => {
    if (agent) {
      setAgentPrompt(agent.prompt || '');
      setSelectedModelId(agent.agent_model_id || '');
      setInitialAgent(agent);
    }
  }, [agent]);

  // Detectar alterações
  const hasUnsavedChanges = agent && initialAgent && !deepEqual(agent, initialAgent);

  // Interceptar navegação do navegador (fechar/atualizar aba)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Interceptar navegação interna (botão Voltar ou router)
  const handleProtectedNavigation = (navFn: () => void) => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
      setPendingNavigation(() => navFn);
    } else {
      navFn();
    }
  };

  // Substituir handleCancel para usar proteção
  const handleCancel = () => {
    handleProtectedNavigation(() => router.back());
  };

  // Ações do modal
  const handleModalSave = async () => {
    if (!agent) return;
    setShowUnsavedModal(false);
    await handleSave();
    setTimeout(() => {
      if (pendingNavigation) pendingNavigation();
    }, 100); // Pequeno delay para garantir salvamento
  };
  const handleModalDiscard = () => {
    setShowUnsavedModal(false);
    if (pendingNavigation) pendingNavigation();
  };
  const handleModalCancel = () => {
    setShowUnsavedModal(false);
    setPendingNavigation(null);
  };

  const handleModelSelect = (model: PromptModel) => {
    setSelectedModelId(model.id);
    setAgentPrompt(model.content);
    updateField('agent_model_id', model.id);
    updateField('prompt', model.content);
  };

  const handleSave = async () => {
    if (!agent && !isNewAgent) return;

    if (isNewAgent) {
      // Lógica para criar novo agente
      if (!agentPrompt.trim()) {
        toast.error('Prompt é obrigatório para agentes internos');
        return;
      }
      
      try {
        // Buscar dados do usuário para obter tenant_id
        const userResponse = await fetch('/api/users/current');
        const userData = await userResponse.json();
        
        const agentData = {
          title: agent?.title || '',
          description: agent?.description || '',
          prompt: agentPrompt,
          fallback_message: agent?.fallback_message || '',
          active: agent?.active ?? true,
          personality: agent?.personality || '',
          custom_personality: agent?.custom_personality || '',
          tone: agent?.tone || '',
          rules: agent?.rules || '',
          buffer_time: agent?.buffer_time || 10,
          agent_model_id: selectedModelId || null,
          scheduling_enabled: agent?.scheduling_enabled || false,
          calendar_id: agent?.calendar_id || '',
          scheduling_query_prompt: agent?.scheduling_query_prompt || '',
          scheduling_create_prompt: agent?.scheduling_create_prompt || '',
          agent_type: 'internal' as const,
          tenant_id: userData.tenant_id || '',
          instance_id: null,
        };

        await agentService.createAgent(agentData);
        toast.success('Agente criado com sucesso!');
        router.push('/admin/agentes');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao criar agente';
        toast.error(errorMessage);
      }
    } else {
      // Lógica para atualizar agente existente
      if (!agent) return;
      
      if (agent.agent_type === 'external') {
        const agentData = {
          id: agent.id,
          title: agent.title,
          description: agent.description,
          webhookUrl: agent.webhookUrl,
          tenant_id: agent.tenant_id,
          active: agent.active,
          agent_type: 'external' as const,
          instance_id: agent.instance_id || null,
        };
        const result = await saveAgent(agentData);
        if (result.success) {
          setShowSuccess(true);
          toast.success('Agente salvo com sucesso!');
          setTimeout(() => setShowSuccess(false), 3000);
          router.push('/admin/agentes');
        } else {
          toast.error(result.error || 'Erro ao salvar agente');
        }
      } else {
        const agentData = {
          title: agent.title,
          description: agent.description,
          prompt: agentPrompt,
          fallback_message: agent.fallback_message,
          active: agent.active,
          personality: agent.personality,
          custom_personality: agent.custom_personality,
          tone: agent.tone,
          rules: agent.rules,
          buffer_time: agent.buffer_time,
          agent_model_id: selectedModelId,
          scheduling_enabled: agent.scheduling_enabled,
          calendar_id: agent.calendar_id,
          scheduling_query_prompt: agent.scheduling_query_prompt,
          scheduling_create_prompt: agent.scheduling_create_prompt,
        };
        const result = await saveAgent(agentData);
        if (result.success) {
          setShowSuccess(true);
          toast.success('Agente salvo com sucesso!');
          setTimeout(() => setShowSuccess(false), 3000);
          router.push('/admin/agentes');
        } else {
          toast.error(result.error || 'Erro ao salvar agente');
        }
      }
    }
  };

  // Se não há agentId e não é novo agente, mostrar erro
  if (!agentId && !isNewAgent) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">ID do agente não encontrado</h2>
          <p className="text-gray-600 mt-2">URL inválida.</p>
        </div>
      </div>
    );
  }

  if (loading && !isNewAgent) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green-light"></div>
        </div>
      </div>
    );
  }

  if (error && !isNewAgent) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <FiX className="text-red-400 text-xl mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Erro ao carregar agente</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!agent && !isNewAgent) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Agente não encontrado</h2>
          <p className="text-gray-600 mt-2">O agente solicitado não foi encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      {/* Feedback de sucesso */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <FiSave className="text-green-400 text-xl mr-2" />
            <div>
              <h3 className="text-sm font-medium text-green-800">Agente salvo com sucesso!</h3>
              <p className="text-sm text-green-700 mt-1">As alterações foram aplicadas.</p>
            </div>
          </div>
        </div>
      )}

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
            <h1 className="text-3xl font-bold">{isNewAgent ? 'Novo Agente de IA' : (agent?.title || 'Agente de IA')}</h1>
            <p className="text-gray-600">{isNewAgent ? 'Configure o comportamento do seu novo agente inteligente' : 'Configure o comportamento do seu agente inteligente'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch 
            checked={agent?.active ?? true} 
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
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input 
            label="Título do agente" 
            placeholder="Título do agente" 
            value={agent?.title || ''}
            onChange={(e) => {
              updateField('title', e.target.value);
            }}
          />
          <Input 
            label="Descrição" 
            placeholder="Descrição" 
            value={agent?.description || ''}
            onChange={(e) => {
              updateField('description', e.target.value);
            }}
          />
          {agent?.agent_type === 'internal' && (
            <Input 
              label="Tempo de pausa (segundos)" 
              placeholder="Tempo de pausa (segundos)" 
              type="number"
              value={agent?.buffer_time || ''}
              onChange={(e) => {
                updateField('buffer_time', parseFloat(e.target.value) || null);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Seção: Configuração Webhook - apenas para agentes externos */}
      {agent?.agent_type === 'external' && (
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
                value={agent?.webhookUrl || ''}
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
      {agent?.agent_type === 'internal' && (
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
                <label className="block text-sm font-medium text-brand-gray-dark mb-2">Prompt do Agente</label>
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
      {agent?.agent_type === 'internal' && (
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
                value={agent?.personality || ''}
                onChange={(e) => updateField('personality', e.target.value)}
              />
            </div>
            <Select 
              label="Tom de voz"
              value={agent?.tone || ''}
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
      {agent?.agent_type === 'internal' && (
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
                value={agent?.rules || ''}
                onChange={(e) => updateField('rules', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção: Agendamento - apenas para agentes internos */}
      {agent?.agent_type === 'internal' && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="bg-pink-100 rounded-full p-2"><FiCalendar className="text-pink-500 text-xl" /></div>
            <div>
              <CardTitle>Agendamento</CardTitle>
              <CardDescription>Vincule uma agenda do Google Agenda ao seu agente</CardDescription>
            </div>
            <div className="ml-auto">
              <Switch 
                checked={agent?.scheduling_enabled || false} 
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
              value={agent?.calendar_id || ''}
              onChange={(e) => updateField('calendar_id', e.target.value)}
            />
            {/* Prompt para consultar agendamento como textarea */}
            <div>
              <label className="block text-sm font-medium text-brand-gray-dark mb-2">Prompt para consultar agendamento</label>
              <textarea 
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 transition-colors focus:border-brand-green-light focus:outline-none focus:ring-1 focus:ring-brand-green-light disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed" 
                placeholder="Prompt para consultar agendamento" 
                rows={2}
                value={agent?.scheduling_query_prompt || ''}
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
                value={agent?.scheduling_create_prompt || ''}
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
          {isNewAgent ? 'Criar Agente' : 'Salvar'}
        </Button>
      </div>

      <ConfirmationModal
        isOpen={showUnsavedModal}
        onClose={handleModalCancel}
        onConfirm={handleModalDiscard}
        title="Alterações não salvas"
        confirmText="Descartar"
        cancelText="Cancelar"
      >
        <p>Você tem alterações não salvas. Deseja salvar, descartar ou cancelar?</p>
        <div className="flex gap-2 mt-4">
          <Button variant="primary" onClick={handleModalSave}>Salvar</Button>
          <Button variant="destructive" onClick={handleModalDiscard}>Descartar</Button>
          <Button variant="outline" onClick={handleModalCancel}>Cancelar</Button>
        </div>
      </ConfirmationModal>
    </div>
  );
} 