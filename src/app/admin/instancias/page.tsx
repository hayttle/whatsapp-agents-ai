import { redirect } from "next/navigation";
import { InstanceList } from "@/components/admin/instances/InstanceList";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Alert } from "@/components/brand";
import { MessageSquare, Shield } from "lucide-react";
import { createClient } from '@/lib/supabase/server';

export default async function InstanciasAdminPage() {
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
  const isUser = userData?.role === 'user';
  const tenantId = userData?.tenant_id;
  
  if (!isSuperAdmin && !isAdmin && !isUser) {
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
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-brand-gray-dark">Instâncias de WhatsApp</h1>
            <p className="text-gray-600">
              {isSuperAdmin 
                ? "Gerencie todas as instâncias do sistema" 
                : isAdmin 
                  ? "Gerencie as instâncias da sua empresa" 
                  : "Visualize as instâncias da sua empresa"
              }
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instâncias do WhatsApp Business</CardTitle>
          <CardDescription>
            {isSuperAdmin 
              ? "Configure e gerencie todas as instâncias do WhatsApp Business" 
              : isAdmin 
                ? "Configure e gerencie as instâncias do WhatsApp Business da sua empresa" 
                : "Visualize as instâncias do WhatsApp Business da sua empresa"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InstanceList isSuperAdmin={isSuperAdmin} isAdmin={isAdmin} tenantId={tenantId} />
        </CardContent>
      </Card>
    </div>
  );
} 