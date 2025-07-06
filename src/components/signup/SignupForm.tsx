"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input, Button, Select } from "@/components/brand";
import {
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  FileText,
  ArrowLeft,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import {
  companySchema,
  userSchema,
  type CompanyData,
  type UserData,
  type SignupResponse
} from "./types";
import { validateCPF, validateCNPJ, formatCPF, formatCNPJ, formatCEP, formatPhone } from "@/lib/utils";

type Step = 'company' | 'user';

export function SignupForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('company');
  const [loading, setLoading] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);

  // Formulário da empresa (primeira etapa)
  const companyForm = useForm<CompanyData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      type: 'JURIDICA',
      name: 'empresa teste',
      cpf_cnpj: '60.859.566/0001-03',
      email: 'teste@teste.com',
      phone: '11987654321',
      address: {
        street: 'Rua teste',
        number: '123',
        complement: '',
        neighborhood: 'Bairro teste',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '04101-300',
      }
    }
  });

  // Formulário do usuário (segunda etapa)
  const userForm = useForm<UserData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      full_name: 'João da Silva',
      email: 'joao@teste.com',
      whatsapp: '(11) 99999-9999',
      password: '123456',
      confirm_password: '123456',
    }
  });

  // TODO: Remover valores default após testes de criação de customer no Asaas

  // Validação customizada de CPF/CNPJ
  const validateDocument = (value: string, type: 'FISICA' | 'JURIDICA') => {
    if (type === 'FISICA') {
      return validateCPF(value) || 'CPF inválido';
    } else {
      return validateCNPJ(value) || 'CNPJ inválido';
    }
  };

  // Handler para próxima etapa (empresa -> usuário)
  const handleNextStep = async (data: CompanyData) => {
    setLoading(true);
    try {
      // Validar documento baseado no tipo
      const documentValidation = validateDocument(data.cpf_cnpj, data.type);
      if (documentValidation !== true) {
        toast.error(documentValidation);
        return;
      }

      setCompanyData(data);
      setCurrentStep('user');
      toast.success('Dados da empresa salvos! Agora informe seus dados de acesso.');
    } catch {
      toast.error('Erro ao validar dados da empresa');
    } finally {
      setLoading(false);
    }
  };

  // Handler para etapa anterior (usuário -> empresa)
  const handlePreviousStep = () => {
    setCurrentStep('company');
  };

  // Handler para finalizar cadastro
  const handleSubmit = async (userData: UserData) => {
    if (!companyData) {
      toast.error('Dados da empresa não encontrados');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: companyData,
          user: userData
        })
      });

      const result: SignupResponse = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Erro ao cadastrar.');
        return;
      }

      toast.success('Cadastro realizado com sucesso!');
      router.push('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Formatação automática de campos
  const handleCPFCNPJChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'FISICA' | 'JURIDICA') => {
    const value = e.target.value.replace(/\D/g, '');
    const formatted = type === 'FISICA' ? formatCPF(value) : formatCNPJ(value);
    e.target.value = formatted;
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formatted = formatCEP(value);
    e.target.value = formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formatted = formatPhone(value);
    e.target.value = formatted;
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
      <h1 className="text-2xl md:text-3xl font-bold text-brand-gray-dark mb-2 mt-2 w-full text-left">
        Crie sua conta
      </h1>
      <p className="text-brand-gray-medium text-base mb-8 w-full text-left">
        {currentStep === 'company'
          ? 'Primeiro, informe os dados da sua empresa'
          : 'Agora, crie seu acesso ao sistema'
        }
      </p>

      {/* Indicador de progresso */}
      <div className="w-full mb-8">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${currentStep === 'company' ? 'text-brand-green-light' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'company' ? 'border-brand-green-light bg-brand-green-light text-white' : 'border-gray-300'
              }`}>
              {currentStep === 'company' ? '1' : <CheckCircle className="w-5 h-5" />}
            </div>
            <span className="ml-2 font-medium">Empresa</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
          <div className={`flex items-center ${currentStep === 'user' ? 'text-brand-green-light' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'user' ? 'border-brand-green-light bg-brand-green-light text-white' : 'border-gray-300'
              }`}>
              {currentStep === 'user' ? '2' : '2'}
            </div>
            <span className="ml-2 font-medium">Usuário</span>
          </div>
        </div>
      </div>

      {/* Formulário da empresa */}
      {currentStep === 'company' && (
        <form onSubmit={companyForm.handleSubmit(handleNextStep)} className="w-full space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo de pessoa"
              value={companyForm.watch('type')}
              onChange={(e) => companyForm.setValue('type', e.target.value as 'FISICA' | 'JURIDICA')}
              error={companyForm.formState.errors.type?.message}
              leftIcon={<Building2 className="h-4 w-4" />}
            >
              <option value="FISICA">Pessoa Física</option>
              <option value="JURIDICA">Pessoa Jurídica</option>
            </Select>

            <Input
              label={companyForm.watch('type') === 'FISICA' ? 'CPF' : 'CNPJ'}
              placeholder={companyForm.watch('type') === 'FISICA' ? '000.000.000-00' : '00.000.000/0000-00'}
              value={companyForm.watch('cpf_cnpj')}
              onChange={(e) => {
                handleCPFCNPJChange(e, companyForm.watch('type'));
                companyForm.setValue('cpf_cnpj', e.target.value);
              }}
              error={companyForm.formState.errors.cpf_cnpj?.message}
              leftIcon={<FileText className="h-4 w-4" />}
            />
          </div>

          <Input
            label="Nome da empresa"
            placeholder="Nome da sua empresa"
            {...companyForm.register('name')}
            error={companyForm.formState.errors.name?.message}
            leftIcon={<Building2 className="h-4 w-4" />}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="E-mail da empresa"
              type="email"
              placeholder="contato@empresa.com"
              {...companyForm.register('email')}
              error={companyForm.formState.errors.email?.message}
              leftIcon={<Mail className="h-4 w-4" />}
            />

            <Input
              label="Telefone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={companyForm.watch('phone')}
              onChange={(e) => {
                handlePhoneChange(e);
                companyForm.setValue('phone', e.target.value);
              }}
              error={companyForm.formState.errors.phone?.message}
              leftIcon={<Phone className="h-4 w-4" />}
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-brand-gray-dark mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Endereço
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Rua"
                  placeholder="Nome da rua"
                  {...companyForm.register('address.street')}
                  error={companyForm.formState.errors.address?.street?.message}
                />
              </div>
              <Input
                label="Número"
                placeholder="123"
                {...companyForm.register('address.number')}
                error={companyForm.formState.errors.address?.number?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Input
                label="Complemento"
                placeholder="Apto, sala, etc. (opcional)"
                {...companyForm.register('address.complement')}
                error={companyForm.formState.errors.address?.complement?.message}
              />
              <Input
                label="Bairro"
                placeholder="Nome do bairro"
                {...companyForm.register('address.neighborhood')}
                error={companyForm.formState.errors.address?.neighborhood?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Input
                label="Cidade"
                placeholder="Nome da cidade"
                {...companyForm.register('address.city')}
                error={companyForm.formState.errors.address?.city?.message}
              />
              <Input
                label="Estado"
                placeholder="SP"
                maxLength={2}
                {...companyForm.register('address.state')}
                error={companyForm.formState.errors.address?.state?.message}
              />
              <Input
                label="CEP"
                placeholder="00000-000"
                value={companyForm.watch('address.zip_code')}
                onChange={(e) => {
                  handleCEPChange(e);
                  companyForm.setValue('address.zip_code', e.target.value);
                }}
                error={companyForm.formState.errors.address?.zip_code?.message}
              />
            </div>
          </div>

          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            className="w-full rounded-full mt-6"
            size="lg"
          >
            {loading ? "Validando..." : "Próxima etapa"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      )}

      {/* Formulário do usuário */}
      {currentStep === 'user' && (
        <form onSubmit={userForm.handleSubmit(handleSubmit)} className="w-full space-y-4">
          <Input
            label="Nome completo"
            placeholder="Seu nome completo"
            {...userForm.register('full_name')}
            error={userForm.formState.errors.full_name?.message}
            leftIcon={<User className="h-4 w-4" />}
          />

          <Input
            label="E-mail de acesso"
            type="email"
            placeholder="seu@email.com"
            {...userForm.register('email')}
            error={userForm.formState.errors.email?.message}
            leftIcon={<Mail className="h-4 w-4" />}
          />

          <Input
            label="WhatsApp"
            type="tel"
            placeholder="(11) 99999-9999"
            value={userForm.watch('whatsapp')}
            onChange={(e) => {
              handlePhoneChange(e);
              userForm.setValue('whatsapp', e.target.value);
            }}
            error={userForm.formState.errors.whatsapp?.message}
            leftIcon={<Phone className="h-4 w-4" />}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Senha"
              type="password"
              placeholder="Escolha uma senha"
              {...userForm.register('password')}
              error={userForm.formState.errors.password?.message}
              leftIcon={<Lock className="h-4 w-4" />}
            />
            <Input
              label="Confirme sua senha"
              type="password"
              placeholder="Confirme sua senha"
              {...userForm.register('confirm_password')}
              error={userForm.formState.errors.confirm_password?.message}
              leftIcon={<Lock className="h-4 w-4" />}
            />
          </div>

          <div className="flex gap-4 mt-6">
            <Button
              type="button"
              onClick={handlePreviousStep}
              variant="outline"
              disabled={loading}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              className="flex-1"
              size="lg"
            >
              {loading ? "Cadastrando..." : "Criar conta"}
            </Button>
          </div>
        </form>
      )}

      <div className="w-full flex flex-col items-center mt-8">
        <a
          href="/login"
          className="text-brand-gray-dark text-sm underline hover:text-brand-green-light mb-6"
        >
          Já tem uma conta? Entrar
        </a>
        <hr className="w-full border-t border-gray-200 mb-6" />
      </div>
      <p className="text-xs text-brand-gray-medium mt-8 text-center w-full">
        Copyright © 2025 | Whatsapp Agents AI
      </p>
    </div>
  );
} 