"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui';
import { Input, Select, Button, Alert } from '@/components/brand';
import { User, Mail, Lock, Briefcase, Building } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { UserModalProps } from './types';

export function UserModal({ isOpen, onClose, onSave, user, isSuperAdmin, tenantId, empresas }: UserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState("user");
  const [empresa, setEmpresa] = useState(tenantId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!user;
  const supabase = createClient();

  // Preencher formulário se estiver editando
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setEmpresa(user.tenant_id || "");
      setSenha(""); // Não preencher senha na edição
    } else {
      setName("");
      setEmail("");
      setSenha("");
      setRole("user");
      setEmpresa(tenantId || "");
    }
    setError("");
  }, [user, isOpen, tenantId]);

  // Limpar empresa quando role for super_admin
  useEffect(() => {
    if (role === 'super_admin') {
      setEmpresa("");
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validações básicas
      if (!name.trim()) {
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
      
      // Validação de role
      const validRoles = isSuperAdmin ? ['super_admin', 'user'] : ['user'];
      if (!validRoles.includes(role)) {
        throw new Error('Papel inválido');
      }
      
      // Validação de empresa para super admin
      if (isSuperAdmin && empresa && role !== 'super_admin') {
        const validEmpresas = empresas.map(emp => emp.id);
        if (!validEmpresas.includes(empresa)) {
          throw new Error('Empresa inválida');
        }
      }
      
      // Validação de tenant para user (apenas se não for super_admin)
      if (role !== 'super_admin' && !isSuperAdmin && !tenantId) {
        throw new Error('Tenant ID é obrigatório para usuários');
      }
      
      // Validação de empresa para usuários normais quando super admin está criando
      if (isSuperAdmin && role !== 'super_admin' && !empresa) {
        throw new Error('Empresa é obrigatória para usuários que não são super admin');
      }
      
      // Validação final do formulário
      if (!name.trim() || !email.trim() || !role) {
        throw new Error('Todos os campos obrigatórios devem ser preenchidos');
      }

      if (isEditing) {
        // Atualizar usuário existente
        const updateData = {
          name,
          email,
          role,
          tenant_id: role === 'super_admin' ? null : (isSuperAdmin ? empresa : tenantId),
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
          } catch (apiError) {
            const errorMessage = apiError instanceof Error ? apiError.message : 'Erro desconhecido';
            throw new Error('Erro ao atualizar usuário: ' + errorMessage);
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
          name,
          role,
          tenant_id: role === 'super_admin' ? null : (isSuperAdmin ? empresa : tenantId),
        };

        const response = await fetch('/api/users/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Erro ao criar usuário');
        }

        toast.success("Usuário cadastrado com sucesso!");
        onSave({ id: '', name, email, role: role as 'user' | 'super_admin', tenant_id: undefined, created_at: new Date().toISOString() });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar usuário';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-lg">
      <ModalHeader>{user ? 'Editar Usuário' : 'Novo Usuário'}</ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          {error && (
            <Alert variant="error" title="Erro">
              {error}
            </Alert>
          )}
          
          <Input
            label="Nome completo"
            name="name"
            placeholder="Ex: João Silva"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            leftIcon={<User className="h-4 w-4" />}
          />
          
          <Input
            label="E-mail"
            type="email"
            placeholder="Ex: joao@empresa.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            leftIcon={<Mail className="h-4 w-4" />}
          />
          
          <Input
            label={isEditing ? "Nova senha (opcional)" : "Senha"}
            type="password"
            placeholder={isEditing ? "Deixe em branco para manter a atual" : "Mínimo 6 caracteres"}
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required={!isEditing}
            leftIcon={<Lock className="h-4 w-4" />}
          />
          
          <Select
            label="Papel"
            value={role}
            onChange={e => setRole(e.target.value)}
            required
            leftIcon={<Briefcase className="h-4 w-4" />}
          >
            {isSuperAdmin && <option value="super_admin">Super Admin</option>}
            <option value="user">Usuário</option>
          </Select>
          
          {isSuperAdmin && role !== 'super_admin' && (
            <Select
              label="Empresa"
              value={empresa}
              onChange={e => setEmpresa(e.target.value)}
              required
              leftIcon={<Building className="h-4 w-4" />}
            >
              <option value="">Selecione a empresa</option>
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </Select>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
          >
            {user ? 'Salvar Alterações' : 'Criar Usuário'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
} 