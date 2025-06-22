"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input, Select, Button } from "@/components/brand";
import { User, Mail, Lock, Briefcase, Building } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
  tenant_id?: string;
}

interface Empresa {
  id: string;
  nome: string;
}

interface UserFormProps {
  user?: User;
  isSuperAdmin: boolean;
  tenantId?: string;
  empresas: Empresa[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UserForm({ user, isSuperAdmin, tenantId, empresas, onSuccess, onCancel }: UserFormProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState("user");
  const [empresa, setEmpresa] = useState(tenantId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!user;
  const supabase = createClientComponentClient();

  // Preencher formulário se estiver editando
  useEffect(() => {
    if (user) {
      setNome(user.nome);
      setEmail(user.email);
      setRole(user.role);
      setEmpresa(user.tenant_id || "");
      setSenha(""); // Não preencher senha na edição
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validações básicas
      if (!nome.trim()) {
        throw new Error('Nome é obrigatório');
      }
      
      if (!email.trim()) {
        throw new Error('E-mail é obrigatório');
      }
      
      // Validação de e-mail
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('E-mail inválido');
      }
      
      if (!isEditing && !senha.trim()) {
        throw new Error('Senha é obrigatória para novos usuários');
      }
      
      if (!isEditing && senha.length < 6) {
        throw new Error('Senha deve ter pelo menos 6 caracteres');
      }
      
      if (isSuperAdmin && !empresa) {
        throw new Error('Empresa é obrigatória para super admins');
      }
      
      // Validação de role
      const validRoles = isSuperAdmin ? ['super_admin', 'admin', 'user'] : ['admin', 'user'];
      if (!validRoles.includes(role)) {
        throw new Error('Papel inválido');
      }
      
      // Validação de empresa para super admin
      if (isSuperAdmin && empresa) {
        const validEmpresas = empresas.map(emp => emp.id);
        if (!validEmpresas.includes(empresa)) {
          throw new Error('Empresa inválida');
        }
      }
      
      // Validação de tenant para admin
      if (!isSuperAdmin && !tenantId) {
        throw new Error('Tenant ID é obrigatório para admins');
      }
      
      // Validação final do formulário
      if (!nome.trim() || !email.trim() || !role) {
        throw new Error('Todos os campos obrigatórios devem ser preenchidos');
      }

      if (isEditing) {
        // Atualizar usuário existente
        const updateData: any = {
          nome,
          email,
          role,
          tenant_id: isSuperAdmin ? empresa : tenantId,
        };

        // Incluir senha apenas se foi preenchida
        if (senha.trim()) {
          if (senha.length < 6) {
            throw new Error('Nova senha deve ter pelo menos 6 caracteres');
          }
          
          // Para atualização de senha, vamos usar a API
          try {
            const response = await fetch('/api/users/update', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: user.id,
                ...updateData,
                password: senha
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Erro ao atualizar usuário');
            }
          } catch (apiError: any) {
            throw new Error('Erro ao atualizar usuário: ' + apiError.message);
          }
        } else {
          // Atualizar dados na tabela users
          const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', user.id);

          if (updateError) {
            throw new Error('Erro ao atualizar usuário: ' + updateError.message);
          }
        }

        toast.success("Usuário atualizado com sucesso!");
      } else {
        // Criar novo usuário usando a API
        const userData = {
          email,
          password: senha,
          nome,
          role,
          tenant_id: isSuperAdmin ? empresa : tenantId,
        };

        try {
          const response = await fetch('/api/users/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao criar usuário');
          }
        } catch (apiError: any) {
          throw new Error('Erro ao criar usuário: ' + apiError.message);
        }

        toast.success("Usuário cadastrado com sucesso!");
      }

      // Limpar formulário se não estiver editando
      if (!isEditing) {
        setNome("");
        setEmail("");
        setSenha("");
        setRole("user");
        if (isSuperAdmin) setEmpresa("");
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar usuário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nome do usuário"
        placeholder="Ex: João da Silva"
        value={nome}
        onChange={e => setNome(e.target.value)}
        required
        leftIcon={<User className="h-4 w-4" />}
      />
      
      <Input
        label="E-mail"
        type="email"
        placeholder="Ex: joao.silva@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        leftIcon={<Mail className="h-4 w-4" />}
      />
      
      <Input
        label={isEditing ? "Nova senha (opcional)" : "Senha"}
        type="password"
        placeholder={isEditing ? "Deixe em branco para manter a atual" : "Mínimo de 6 caracteres"}
        value={senha}
        onChange={e => setSenha(e.target.value)}
        required={!isEditing}
        leftIcon={<Lock className="h-4 w-4" />}
      />
      
      <Select
        label="Papel (Role)"
        value={role}
        onChange={e => setRole(e.target.value)}
        required
        leftIcon={<Briefcase className="h-4 w-4" />}
      >
        {isSuperAdmin && <option value="super_admin">Super Admin</option>}
        <option value="admin">Admin</option>
        <option value="user">Usuário</option>
      </Select>
      
      {isSuperAdmin && (
        <Select
          label="Empresa"
          value={empresa}
          onChange={e => setEmpresa(e.target.value)}
          required={isSuperAdmin}
          leftIcon={<Building className="h-4 w-4" />}
        >
          <option value="">Selecione a empresa</option>
          {empresas.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.nome}</option>
          ))}
        </Select>
      )}

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button 
            type="button" 
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            size="lg"
          >
            Cancelar
          </Button>
        )}
        
        <Button 
          type="submit" 
          loading={loading}
          className="flex-1"
          size="lg"
        >
          {loading ? "Salvando..." : (isEditing ? "Atualizar Usuário" : "Cadastrar Usuário")}
        </Button>
      </div>
    </form>
  );
} 