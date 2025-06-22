"use client";
import { useState, useEffect } from "react";
import { userService } from "@/services/userService";
import { useActions } from "@/hooks/useActions";
import Modal from "@/components/ui/Modal";

interface EditUserModalProps {
  user: any;
  empresas: Record<string, string>;
  isSuperAdmin: boolean;
  onClose: () => void;
  onUpdated: () => void;
  tenantId?: string;
}

export function EditUserModal({ user, empresas, isSuperAdmin, onClose, onUpdated, tenantId }: EditUserModalProps) {
  const [nome, setNome] = useState(user.nome || "");
  const [email, setEmail] = useState(user.email || "");
  const [role, setRole] = useState(user.role || "user");
  const [empresa, setEmpresa] = useState(user.tenant_id || tenantId || "");
  const { actionLoading, handleAction } = useActions();

  useEffect(() => {
    setNome(user.nome || "");
    setEmail(user.email || "");
    setRole(user.role || "user");
    setEmpresa(user.tenant_id || tenantId || "");
  }, [user, tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await handleAction(
      async () => {
        await userService.updateUser(user.id, {
          nome,
          email,
          role: isSuperAdmin ? role : undefined,
          tenant_id: isSuperAdmin ? empresa : undefined,
        });
        setTimeout(() => {
          onUpdated();
        }, 1000);
      },
      'update-user',
      'Usuário atualizado com sucesso!'
    );
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Editar Usuário</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nome do usuário"
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
            className="border rounded px-3 py-2 w-full"
          />
          <input
            type="email"
            placeholder="E-mail do usuário"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="border rounded px-3 py-2 w-full"
          />
          {isSuperAdmin ? (
            <select
              value={empresa}
              onChange={e => setEmpresa(e.target.value)}
              required
              className="border rounded px-3 py-2 w-full"
            >
              <option value="">Selecione a empresa</option>
              {Object.entries(empresas).map(([id, nome]) => (
                <option key={id} value={id}>{nome}</option>
              ))}
            </select>
          ) : null}
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            required
            className="border rounded px-3 py-2 w-full"
            disabled={!isSuperAdmin}
          >
            <option value="super_admin">super_admin</option>
            <option value="admin">admin</option>
            <option value="user">user</option>
          </select>
          <button 
            type="submit" 
            disabled={actionLoading === 'update-user'} 
            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
          >
            {actionLoading === 'update-user' ? "Salvando..." : "Salvar"}
          </button>
        </form>
      </div>
    </Modal>
  );
} 