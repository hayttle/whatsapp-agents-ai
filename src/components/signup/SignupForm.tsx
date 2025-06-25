"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input, Button } from "@/components/brand";
import { Mail, Lock, User, Phone } from "lucide-react";

const signupSchema = z.object({
  name: z.string().min(3, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  whatsapp: z.string().min(10, "Número inválido").max(15, "Número inválido"),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmSenha: z.string().min(6, "Confirme sua senha"),
  comoConheceu: z.string().optional(),
});

export type SignupData = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupData>({
    resolver: zodResolver(signupSchema.refine((data) => data.senha === data.confirmSenha, {
      message: "As senhas não coincidem",
      path: ["confirmSenha"],
    })),
  });

  const onSubmit = async (data: SignupData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.senha })
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || 'Erro ao cadastrar.');
        return;
      }
      if (!result.user) {
        toast.error('Usuário não criado. Verifique seu e-mail para confirmação.');
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

  return (
    <div className="w-full max-w-md flex flex-col items-center">
      <h1 className="text-2xl md:text-3xl font-bold text-brand-gray-dark mb-2 mt-2 w-full text-left">Crie sua conta</h1>
      <p className="text-brand-gray-medium text-base mb-8 w-full text-left">Informe seus dados nos campos abaixo</p>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-4">
        {/* Dados pessoais */}
        <Input
          label="Nome completo"
          type="text"
          placeholder="Informe seu nome completo"
          leftIcon={<User className="h-4 w-4" />}
          error={errors.name?.message}
          autoComplete="name"
          {...register("name")}
        />
        <Input
          label="E-mail"
          type="email"
          placeholder="Informe seu e-mail"
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          autoComplete="email"
          {...register("email")}
        />
        <Input
          label="Número de WhatsApp"
          type="tel"
          placeholder="Informe seu WhatsApp"
          leftIcon={<Phone className="h-4 w-4" />}
          error={errors.whatsapp?.message}
          autoComplete="tel"
          {...register("whatsapp")}
        />
        <hr className="my-2 border-gray-200" />
        {/* Dados de acesso */}
        <Input
          label="Senha"
          type="password"
          placeholder="Escolha uma senha"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.senha?.message}
          autoComplete="new-password"
          {...register("senha")}
        />
        <Input
          label="Confirme sua senha"
          type="password"
          placeholder="Confirme sua senha"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.confirmSenha?.message}
          autoComplete="new-password"
          {...register("confirmSenha")}
        />
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
          className="w-full rounded-full mt-2"
          size="lg"
        >
          {loading ? "Cadastrando..." : "Criar conta"}
        </Button>
      </form>
      <div className="w-full flex flex-col items-center mt-4">
        <a
          href="/login"
          className="text-brand-gray-dark text-sm underline hover:text-brand-green-light mb-6"
        >
          Já tem uma conta? Entrar
        </a>
        <hr className="w-full border-t border-gray-200 mb-6" />
      </div>
      <p className="text-xs text-brand-gray-medium mt-8 text-center w-full">Copyright © 2025 | Whatsapp Agent AI</p>
    </div>
  );
} 