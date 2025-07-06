export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'super_admin';
  tenant_id?: string;
  created_at: string;
  updated_at?: string;
  status?: 'active' | 'inactive';
}

export interface Empresa {
  id: string;
  name: string;
}

export interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  user?: User | null;
  isSuperAdmin: boolean;
  tenantId?: string;
  empresas: Empresa[];
}

export interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
} 