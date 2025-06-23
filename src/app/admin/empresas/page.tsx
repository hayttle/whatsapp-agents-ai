import { redirect } from "next/navigation";
import { TenantList } from "@/components/admin/tenants/TenantList";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Alert } from "@/components/brand";
import { Building2, Shield } from "lucide-react";
import { createClient } from '@/lib/supabase/server';

export default async function EmpresasAdminPage() {
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
              Apenas super administradores podem gerenciar empresas.
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
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-brand-gray-dark">Gerenciar Empresas</h1>
            <p className="text-gray-600">
              {isSuperAdmin ? "Gerencie todas as empresas do sistema" : "Gerencie as empresas"}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Empresas do Sistema</CardTitle>
          <CardDescription>
            {isSuperAdmin 
              ? "Visualize e gerencie todas as empresas cadastradas no sistema" 
              : "Visualize e gerencie as empresas"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TenantList isSuperAdmin={isSuperAdmin} />
        </CardContent>
      </Card>
    </div>
  );
} 