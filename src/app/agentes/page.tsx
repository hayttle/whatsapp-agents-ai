import { redirect } from "next/navigation";
import { AgentList } from "@/components/admin/agents/AgentList";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Alert } from "@/components/brand";
import { createClient } from '@/lib/supabase/server';
import { Shield } from 'lucide-react';

// Página de configuração de agente será criada em /agentes/[id]/configuracao

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
  const isUser = userData?.role === 'user';

  if (!isSuperAdmin && !isUser) {
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

  const tenantId = userData?.tenant_id;

  return (
    <AgentList isSuperAdmin={isSuperAdmin} tenantId={tenantId} />
  );
} 