import { z } from "zod";

// Schema para dados da empresa (primeira etapa)
export const companySchema = z.object({
  type: z.enum(['FISICA', 'JURIDICA'], {
    required_error: "Selecione o tipo de pessoa"
  }),
  name: z.string().min(3, "Nome da empresa deve ter pelo menos 3 caracteres"),
  cpf_cnpj: z.string().min(11, "CPF/CNPJ inválido").max(18, "CPF/CNPJ inválido"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "Telefone inválido").max(15, "Telefone inválido"),
  address: z.object({
    street: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
    number: z.string().min(1, "Número é obrigatório"),
    complement: z.string().optional(),
    neighborhood: z.string().min(2, "Bairro deve ter pelo menos 2 caracteres"),
    city: z.string().min(2, "Cidade deve ter pelo menos 2 caracteres"),
    state: z.string().length(2, "Estado deve ter 2 caracteres"),
    zip_code: z.string().min(8, "CEP inválido").max(9, "CEP inválido"),
  }),
});

// Schema para dados do usuário (segunda etapa)
export const userSchema = z.object({
  full_name: z.string().min(3, "Nome completo deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  whatsapp: z.string().min(10, "WhatsApp inválido").max(15, "WhatsApp inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirm_password: z.string().min(6, "Confirme sua senha"),
}).refine((data) => data.password === data.confirm_password, {
  message: "As senhas não coincidem",
  path: ["confirm_password"],
});

// Schema completo para signup
export const signupSchema = z.object({
  company: companySchema,
  user: userSchema,
});

export type CompanyData = z.infer<typeof companySchema>;
export type UserData = z.infer<typeof userSchema>;
export type SignupData = z.infer<typeof signupSchema>;

// Tipos para resposta da API
export interface SignupResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenant_id: string;
  };
  tenant?: {
    id: string;
    name: string;
    email: string;
    type: string;
  };
  error?: string;
}

export interface SupabaseTenantResponse {
  error: {
    message: string;
  } | null;
} 