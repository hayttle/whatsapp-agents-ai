"use client";

import { useDashboard } from '@/hooks/useDashboard';
import { useUserRole } from '@/hooks/useUserRole';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/brand';
import { Bot, MessageSquare, Users, Settings, MessageCircleMore, Activity, UserCheck, UserX } from 'lucide-react';

export default function DashboardPage() {
  const { isSuperAdmin, userData, isLoading: userLoading } = useUserRole();
  const { stats, isLoading: statsLoading, error } = useDashboard();

  const isLoading = userLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green-light"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center">
          <p className="text-red-600">Erro ao carregar dashboard: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-gray-dark mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Bem-vindo de volta, {userData?.name || userData?.email}
          {isSuperAdmin && <span className="ml-2 text-brand-green-light font-medium">(Super Admin)</span>}
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isSuperAdmin ? (
          // Dashboard para Super Admin
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Instâncias Nativas</CardTitle>
                <MessageSquare className="h-4 w-4 text-brand-green-light" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-gray-dark">{stats.instancesInternal}</div>
                <p className="text-xs text-gray-600">Instâncias internas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Instâncias Externas</CardTitle>
                <MessageCircleMore className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-gray-dark">{stats.instancesExternal}</div>
                <p className="text-xs text-gray-600">Instâncias externas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Agentes Nativos</CardTitle>
                <Bot className="h-4 w-4 text-brand-green-light" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-gray-dark">{stats.agentsInternal}</div>
                <p className="text-xs text-gray-600">Agentes de IA</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Agentes Externos</CardTitle>
                <Bot className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-gray-dark">{stats.agentsExternal}</div>
                <p className="text-xs text-gray-600">Agentes webhook</p>
              </CardContent>
            </Card>
          </>
        ) : (
          // Dashboard para Usuário Comum
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Instâncias Ativas</CardTitle>
                <MessageSquare className="h-4 w-4 text-brand-green-light" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-gray-dark">{stats.instancesActive}</div>
                <p className="text-xs text-gray-600">Conectadas ao WhatsApp</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Instâncias Inativas</CardTitle>
                <MessageSquare className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-gray-dark">{stats.instancesInactive}</div>
                <p className="text-xs text-gray-600">Desconectadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Agentes Criados</CardTitle>
                <Bot className="h-4 w-4 text-brand-green-light" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-gray-dark">{stats.agentsTotal}</div>
                <p className="text-xs text-gray-600">Total de agentes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status Geral</CardTitle>
                <Activity className="h-4 w-4 text-brand-green-light" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-gray-dark">
                  {stats.instancesActive > 0 ? 'Ativo' : 'Inativo'}
                </div>
                <p className="text-xs text-gray-600">
                  {stats.instancesActive > 0 ? 'Sistema operacional' : 'Nenhuma instância ativa'}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Cards adicionais para Super Admin */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-gray-dark">{stats.usersActive}</div>
              <p className="text-xs text-gray-600">Usuários com atividade recente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Inativos</CardTitle>
              <UserX className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-gray-dark">{stats.usersInactive}</div>
              <p className="text-xs text-gray-600">Usuários sem atividade recente</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acesse rapidamente as principais funcionalidades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <a href="/admin/instancias" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-brand-green-light hover:bg-brand-green-light/5 transition-colors">
                <MessageSquare className="h-5 w-5 text-brand-green-light" />
                <div>
                  <p className="text-sm font-medium">Instâncias</p>
                  <p className="text-xs text-gray-600">Gerenciar WhatsApp</p>
                </div>
              </a>
              <a href="/admin/agentes" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-brand-green-light hover:bg-brand-green-light/5 transition-colors">
                <Bot className="h-5 w-5 text-brand-green-light" />
                <div>
                  <p className="text-sm font-medium">Agentes</p>
                  <p className="text-xs text-gray-600">Criar IA</p>
                </div>
              </a>
              {isSuperAdmin && (
                <>
                  <a href="/admin/usuarios" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-brand-green-light hover:bg-brand-green-light/5 transition-colors">
                    <Users className="h-5 w-5 text-brand-green-light" />
                    <div>
                      <p className="text-sm font-medium">Usuários</p>
                      <p className="text-xs text-gray-600">Gerenciar equipe</p>
                    </div>
                  </a>
                  <a href="/admin/empresas" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-brand-green-light hover:bg-brand-green-light/5 transition-colors">
                    <Settings className="h-5 w-5 text-brand-green-light" />
                    <div>
                      <p className="text-sm font-medium">Empresas</p>
                      <p className="text-xs text-gray-600">Gerenciar tenants</p>
                    </div>
                  </a>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo do Sistema</CardTitle>
            <CardDescription>Visão geral do status atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total de Instâncias:</span>
                <span className="font-medium">
                  {isSuperAdmin
                    ? stats.instancesInternal + stats.instancesExternal
                    : stats.instancesActive + stats.instancesInactive
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total de Agentes:</span>
                <span className="font-medium">
                  {isSuperAdmin
                    ? stats.agentsInternal + stats.agentsExternal
                    : stats.agentsTotal
                  }
                </span>
              </div>
              {isSuperAdmin && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total de Usuários:</span>
                  <span className="font-medium">{stats.usersActive + stats.usersInactive}</span>
                </div>
              )}
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-brand-green-light rounded-full"></div>
                  <span className="text-sm text-gray-600">Sistema operacional</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 