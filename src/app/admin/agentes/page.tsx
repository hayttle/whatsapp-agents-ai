import { redirect } from "next/navigation";
import { AgentList } from "@/components/admin/agents/AgentList";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Alert } from "@/components/brand";
import { Bot, Shield } from "lucide-react";
import { createClient } from '@/lib/supabase/server';

export default async function AgentesAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Buscar dados do usuário logado
  const { data: userData } = await supabase
    .from("users")
    .select("id, email, role, tenant_id")
    .eq("email", user.email)
    .single();

  const isSuperAdmin = userData?.role === 'super_admin';
  const isAdmin = userData?.role === 'admin';
  const tenantId = userData?.tenant_id;
  
  if (!isSuperAdmin && !isAdmin) {
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
              Entre em contato com o administrador do sistema para solicitar acesso.
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-brand-green-light rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-brand-gray-dark">Agentes de IA</h1>
            <p className="text-gray-600">
              {isSuperAdmin ? "Gerencie todos os agentes do sistema" : "Gerencie os agentes da sua empresa"}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agentes de Inteligência Artificial</CardTitle>
          <CardDescription>
            {isSuperAdmin 
              ? "Crie e gerencie agentes de IA para todas as empresas" 
              : "Crie e gerencie agentes de IA para automatizar respostas"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgentList isSuperAdmin={isSuperAdmin} tenantId={tenantId} />
        </CardContent>
      </Card>
    </div>
  );
} 