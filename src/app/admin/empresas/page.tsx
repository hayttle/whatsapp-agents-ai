import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { EmpresaList } from "@/components/admin/EmpresaList";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Alert } from "@/components/brand";
import { Building2, Shield } from "lucide-react";

const ADMIN_EMAILS = ["hayttle@gmail.com"];

export default async function EmpresasAdminPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session || !ADMIN_EMAILS.includes(String(session.user.email))) {
    redirect("/login");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("id, email, role, tenant_id")
    .eq("email", session.user.email)
    .single();

  const isSuperAdmin = userData?.role === 'super_admin';
  const isAdmin = userData?.role === 'admin';
  
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
          <EmpresaList isSuperAdmin={isSuperAdmin} />
        </CardContent>
      </Card>
    </div>
  );
} 