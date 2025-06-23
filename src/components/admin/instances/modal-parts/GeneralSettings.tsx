import React from 'react';
import { Input, Select } from '@/components/brand';
import { Instance } from '../types';

type EmpresaDropdown = { id: string; name: string };

interface GeneralSettingsProps {
  instanceName: string;
  handleInstanceNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  integration: string;
  setIntegration: (value: string) => void;
  INTEGRATION_OPTIONS: string[];
  instance?: Instance | null;
  tenants: EmpresaDropdown[];
  selectedTenant: string;
  setSelectedTenant: (value: string) => void;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  instanceName,
  handleInstanceNameChange,
  integration,
  setIntegration,
  INTEGRATION_OPTIONS,
  instance,
  tenants,
  selectedTenant,
  setSelectedTenant,
}) => {
  return (
    <div className="space-y-4">
      {tenants.length > 0 && (
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
        disabled={!!instance}
        required={!instance}
      />
      <Select
        label="Integração"
        value={integration}
        onChange={e => setIntegration(e.target.value)}
      >
        {INTEGRATION_OPTIONS.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </Select>
    </div>
  );
};

export default GeneralSettings; 