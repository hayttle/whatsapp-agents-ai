"use client";
import { useState, useEffect } from "react";
import { userService } from "@/services/userService";
import { useActions } from "@/hooks/useActions";
import Modal from "@/components/ui/Modal";

interface UserProfileModalProps {
  user: any;
  onClose: () => void;
  onUpdated: () => void;
}

export function UserProfileModal({ user, onClose, onUpdated }: UserProfileModalProps) {
  const [nome, setNome] = useState(user.nome || "");
  const [email, setEmail] = useState(user.email || "");
  const { actionLoading, handleAction } = useActions();

  useEffect(() => {
    setNome(user.nome || "");
    setEmail(user.email || "");
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await handleAction(
      async () => {
        await userService.updateProfile({ nome, email });
        setTimeout(() => {
          onUpdated();
        }, 1000);
      },
      'update-profile',
      'Perfil atualizado com sucesso!'
    );
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Editar Perfil</h2>
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
          <button 
            type="submit" 
            disabled={actionLoading === 'update-profile'} 
            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
          >
            {actionLoading === 'update-profile' ? "Salvando..." : "Salvar"}
          </button>
        </form>
      </div>
    </Modal>
  );
} 