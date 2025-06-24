"use client";
import { useState, useEffect } from "react";
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui';
import { Button, Alert, Input } from '@/components/brand';
import { Building2, Mail, Phone, FileText } from "lucide-react";
import { TenantModalProps } from './types';

const TenantModal: React.FC<TenantModalProps> = ({ isOpen, onClose, onSave, tenant }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("FISICA");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (tenant) {
      setName(tenant.name || "");
      setEmail(tenant.email || "");
      setCpfCnpj(tenant.cpf_cnpj || "");
      setPhone(tenant.phone || "");
      setType(tenant.type || "FISICA");
    } else {
      setName("");
      setEmail("");
      setCpfCnpj("");
      setPhone("");
      setType("JURIDICA");
    }
    setMsg("");
    setError("");
  }, [tenant, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setError("");

    try {
      const url = tenant ? `/api/tenants/update` : `/api/tenants/create`;
      const method = tenant ? 'PUT' : 'POST';
      
      const payload = {
        ...(tenant && { id: tenant.id }),
        name,
        cpf_cnpj: cpfCnpj,
        phone,
        email,
        type,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar empresa');
      }

      setMsg(`Empresa ${tenant ? 'atualizada' : 'criada'} com sucesso!`);
      onSave(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar empresa');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setMsg("");
        setError("");
      }, 3000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-lg">
      <ModalHeader>{tenant ? 'Editar Empresa' : 'Nova Empresa'}</ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          {msg && (
            <Alert variant="success" title="Sucesso">
              {msg}
            </Alert>
          )}
          {error && (
            <Alert variant="error" title="Erro">
              {error}
            </Alert>
          )}
          
          <Input
            label="Nome da empresa"
            name="name"
            placeholder="Ex: Empresa ABC Ltda"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            leftIcon={<Building2 className="h-4 w-4" />}
          />
          
          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <select
              className="w-full border rounded px-3 py-2 text-sm"
              value={type}
              onChange={e => setType(e.target.value)}
              required
            >
              <option value="FISICA">Física</option>
              <option value="JURIDICA">Jurídica</option>
            </select>
          </div>
          
          <Input
            label="E-mail"
            type="email"
            placeholder="Ex: contato@empresa.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            leftIcon={<Mail className="h-4 w-4" />}
          />
          
          <Input
            label="CPF/CNPJ"
            placeholder="Ex: 12.345.678/0001-90"
            value={cpfCnpj}
            onChange={e => setCpfCnpj(e.target.value)}
            required
            leftIcon={<FileText className="h-4 w-4" />}
          />
          
          <Input
            label="Telefone"
            type="tel"
            placeholder="Ex: (11) 99999-9999"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
            leftIcon={<Phone className="h-4 w-4" />}
          />
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
            {tenant ? 'Salvar Alterações' : 'Criar Empresa'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default TenantModal; 