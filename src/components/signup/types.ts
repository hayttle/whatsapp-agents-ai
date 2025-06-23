import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(3, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  whatsapp: z.string().min(10, "Número inválido").max(15, "Número inválido"),
});

export type SignupData = z.infer<typeof signupSchema>;

export interface SupabaseAuthResponse {
  user: {
    id: string;
    email: string;
  } | null;
  error: {
    message: string;
  } | null;
}

export interface SupabaseTenantResponse {
  error: {
    message: string;
  } | null;
} 