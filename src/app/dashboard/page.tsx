import { redirect } from "next/navigation";
import { LogoutButton } from '@/components/ui/LogoutButton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/brand';
import { Bot, MessageSquare, Users, Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-gray-dark mb-2">Dashboard</h1>
        <p className="text-gray-600">Bem-vindo de volta, {user.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instâncias Ativas</CardTitle>
            <MessageSquare className="h-4 w-4 text-brand-green-light" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-gray-dark">3</div>
            <p className="text-xs text-gray-600">+2 desde o último mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agentes de IA</CardTitle>
            <Bot className="h-4 w-4 text-brand-green-light" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-gray-dark">12</div>
            <p className="text-xs text-gray-600">+5 desde o último mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens Hoje</CardTitle>
            <MessageSquare className="h-4 w-4 text-brand-green-light" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-gray-dark">1,234</div>
            <p className="text-xs text-gray-600">+12% desde ontem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <Users className="h-4 w-4 text-brand-green-light" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-gray-dark">8</div>
            <p className="text-xs text-gray-600">+1 desde o último mês</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas ações realizadas no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-brand-green-light rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Nova instância conectada</p>
                  <p className="text-xs text-gray-600">Loja Principal - 2 minutos atrás</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-brand-green-light rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Agente de IA criado</p>
                  <p className="text-xs text-gray-600">Atendimento Vendas - 15 minutos atrás</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-brand-green-light rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Configuração atualizada</p>
                  <p className="text-xs text-gray-600">Webhook Settings - 1 hora atrás</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  <p className="text-sm font-medium">Configurações</p>
                  <p className="text-xs text-gray-600">Sistema</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex justify-center">
        <LogoutButton />
      </div>
    </div>
  );
} 