import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Alert } from "@/components/brand";
import { Building2, Users, Bot, MessageSquare, Settings, Shield } from "lucide-react";
import { createClient } from '@/lib/supabase/server';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("email", user.email)
    .single();

  const isSuperAdmin = userData?.role === 'super_admin';

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Você não tem permissão para acessar esta página</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="error" title="Permissão Insuficiente">
              Apenas super administradores podem acessar o painel administrativo.
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-gray-dark mb-2">Painel Administrativo</h1>
        <p className="text-gray-600">
          Bem-vindo, {user.email}
          <span className="ml-2 text-brand-green-dark font-medium">(Super Admin)</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-green-light rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Empresas</CardTitle>
                <CardDescription>Gerencie as empresas do sistema</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Crie, edite e gerencie as empresas que utilizam a plataforma.
            </p>
            <Button className="w-full">
              <a href="/admin/empresas">Gerenciar Empresas</a>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-green-light rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Usuários</CardTitle>
                <CardDescription>Gerencie os usuários do sistema</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Adicione, edite e gerencie os usuários e suas permissões.
            </p>
            <Button className="w-full">
              <a href="/admin/usuarios">Gerenciar Usuários</a>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-green-light rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Instâncias</CardTitle>
                <CardDescription>Gerencie as instâncias do WhatsApp</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Configure e gerencie as instâncias do WhatsApp Business.
            </p>
            <Button className="w-full">
              <a href="/admin/instancias">Gerenciar Instâncias</a>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-green-light rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Agentes</CardTitle>
                <CardDescription>Gerencie os agentes de IA</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Crie e configure agentes de inteligência artificial.
            </p>
            <Button className="w-full">
              <a href="/agentes">Gerenciar Agentes</a>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-gray-dark rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>Configurações do sistema</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Configure parâmetros globais do sistema.
            </p>
            <Button variant="secondary" className="w-full">
              <a href="/admin/configuracoes">Configurações</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Alert variant="info" title="Dica">
          Use o menu lateral para navegar rapidamente entre as seções do painel administrativo.
        </Alert>
      </div>
    </div>
  );
} 