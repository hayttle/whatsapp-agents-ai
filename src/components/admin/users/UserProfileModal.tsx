"use client";
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/brand';
import { User, Mail, Shield, Building } from 'lucide-react';
import { UserProfileModalProps } from './types';

export function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
  const roleDisplay: { [key: string]: string } = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    user: 'Usuário',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-md">
      <ModalHeader>Perfil do Usuário</ModalHeader>
      <ModalBody className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-green-light rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{user.name}</h3>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{user.email}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-400" />
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
              user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {roleDisplay[user.role] || user.role}
            </span>
          </div>
          
          {user.tenant_id && (
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-400" />
              <span className="text-sm">Tenant ID: {user.tenant_id}</span>
            </div>
          )}
          
          <div className="text-xs text-gray-500">
            Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button onClick={onClose} variant="outline">
          Fechar
        </Button>
      </ModalFooter>
    </Modal>
  );
} 