"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input, Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/brand";
import { Mail, Lock, User, Building2 } from "lucide-react";

const signupSchema = z.object({
  name: z.string().min(3, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  whatsapp: z.string().min(10, "Número inválido").max(15, "Número inválido"),
});

export type SignupData = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
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
    <div className="w-full max-w-md">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Crie sua conta</CardTitle>
          <CardDescription>É rápido e fácil. Comece a automatizar agora!</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nome completo"
              type="text"
              placeholder="Digite seu nome completo"
              leftIcon={<User className="h-4 w-4" />}
              error={errors.name?.message}
              autoComplete="name"
              {...register("name")}
            />
            <Input
              label="E-mail"
              type="email"
              placeholder="Digite seu e-mail"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              autoComplete="email"
              {...register("email")}
            />
            <Input
              label="Senha"
              type="password"
              placeholder="Digite sua senha"
              leftIcon={<Lock className="h-4 w-4" />}
              error={errors.senha?.message}
              autoComplete="new-password"
              {...register("senha")}
            />
            <Input
              label="Número WhatsApp"
              type="tel"
              placeholder="(99) 99999-9999"
              leftIcon={<Building2 className="h-4 w-4" />}
              error={errors.whatsapp?.message}
              autoComplete="tel"
              {...register("whatsapp")}
            />
            <Button 
              type="submit" 
              loading={loading} 
              disabled={loading} 
              className="w-full"
              size="lg"
            >
              {loading ? "Cadastrando..." : "Criar conta"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 