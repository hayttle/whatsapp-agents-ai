import { CompanyType } from './constants';

export interface Tenant {
  id: string;
  name: string;
  email: string;
  cpf_cnpj?: string;
  phone?: string;
  type: CompanyType;
}

export interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tenant: Tenant) => void;
  tenant?: Tenant | null;
} 