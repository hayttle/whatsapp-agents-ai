"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { Input, Button } from "@/components/brand";
import { Building2, Mail, Phone, FileText } from "lucide-react";
import { Tenant } from "@/services/tenantService";

interface EmpresaFormProps {
  empresa?: Tenant;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EmpresaForm({ empresa, onSuccess, onCancel }: EmpresaFormProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!empresa;

  // Preencher formulário se estiver editando
  useEffect(() => {
    if (empresa) {
      setNome(empresa.nome);
      setEmail(empresa.email || "");
      setCpfCnpj(empresa.cpf_cnpj || "");
      setTelefone(empresa.telefone || "");
    }
  }, [empresa]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClientComponentClient();

    try {
      if (isEditing) {
        // Atualizar empresa existente
        const { error } = await supabase
          .from("tenants")
          .update({
            nome,
            cpf_cnpj: cpfCnpj,
            telefone,
            email,
          })
          .eq("id", empresa.id);

        if (error) throw error;
        toast.success("Empresa atualizada com sucesso!");
      } else {
        // Criar nova empresa
        const { error } = await supabase.from("tenants").insert({
          id: crypto.randomUUID(),
          tipo: "FISICA",
          nome,
          cpf_cnpj: cpfCnpj,
          telefone,
          email,
          status: "ATIVO",
          user_id: null,
        });

        if (error) throw error;
        toast.success("Empresa cadastrada com sucesso!");
      }

      // Limpar formulário se não estiver editando
      if (!isEditing) {
        setNome("");
        setEmail("");
        setCpfCnpj("");
        setTelefone("");
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar empresa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nome da empresa"
        placeholder="Ex: Empresa ABC Ltda"
        value={nome}
        onChange={e => setNome(e.target.value)}
        required
        leftIcon={<Building2 className="h-4 w-4" />}
      />
      
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
        value={telefone}
        onChange={e => setTelefone(e.target.value)}
        required
        leftIcon={<Phone className="h-4 w-4" />}
      />

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
          {loading ? "Salvando..." : (isEditing ? "Atualizar Empresa" : "Cadastrar Empresa")}
        </Button>
      </div>
    </form>
  );
} 