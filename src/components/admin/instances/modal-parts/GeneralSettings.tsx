import React from 'react';
import { Input, Select } from '@/components/brand';

type EmpresaDropdown = { id: string; name: string };

interface GeneralSettingsProps {
  instanceName: string;
  handleInstanceNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  tenants: EmpresaDropdown[];
  selectedTenant: string;
  setSelectedTenant: (value: string) => void;
  isSuperAdmin?: boolean;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  instanceName,
  handleInstanceNameChange,
  tenants,
  selectedTenant,
  setSelectedTenant,
  isSuperAdmin = false,
}) => {
  return (
    <div className="space-y-4">
      {isSuperAdmin && tenants.length > 0 && (
        <Select
          label="Empresa"
          value={selectedTenant}
          onChange={e => setSelectedTenant(e.target.value)}
          required
        >
          <option value="">Selecione a empresa</option>
          {tenants.map((emp: EmpresaDropdown) => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
        </Select>
      )}
      <Input
        label="Nome da Instância"
        type="text"
        placeholder="Nome da instância (apenas letras, números e hífens)"
        value={instanceName}
        onChange={handleInstanceNameChange}
        required
      />
    </div>
  );
};

export default GeneralSettings; 