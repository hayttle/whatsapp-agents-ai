"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Button } from "@/components/brand";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Lock } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Senha obrigatória"),
});

type LoginData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.senha,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao fazer login');
      }

      // Salvar o token no localStorage
      if (result.access_token) {
        localStorage.setItem('supabase.auth.token', result.access_token);
      }

      toast.success('Login realizado com sucesso!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center">
      <h1 className="text-2xl md:text-3xl font-bold text-brand-gray-dark mb-2 mt-2 w-full text-left">Entre na sua conta</h1>
      <p className="text-brand-gray-medium text-base mb-8 w-full text-left">Entre com seus dados de acesso</p>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-4">
        <Input
          label="E-mail do usuário"
          type="email"
          placeholder="E-mail do usuário"
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          autoComplete="email"
          {...register("email")}
        />
        <Input
          label="Senha de acesso"
          type="password"
          placeholder="Senha de acesso"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.senha?.message}
          autoComplete="current-password"
          {...register("senha")}
        />
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
          className="w-full rounded-full mt-2"
          size="lg"
        >
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
      <div className="w-full flex flex-col items-center mt-4">
        <a
          href="#"
          className="text-brand-gray-dark text-sm underline hover:text-brand-green-light mb-6"
        >
          Esqueci minha senha
        </a>
        <hr className="w-full border-t border-gray-200 mb-6" />
        <Button
          type="button"
          variant="primary"
          className="w-full max-w-xs rounded-md"
          onClick={() => router.push('/signup')}
        >
          Crie uma conta grátis
        </Button>
      </div>
      <p className="text-xs text-brand-gray-medium mt-8 text-center w-full">Copyright © 2025 | Whatsapp Agents AI</p>
    </div>
  );
} 