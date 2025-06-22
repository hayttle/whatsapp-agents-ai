"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/brand";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, Mail, Lock, Phone } from "lucide-react";

const signupSchema = z.object({
  nome: z.string().min(3, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  whatsapp: z.string().min(10, "Número inválido").max(15, "Número inválido"),
});

export type SignupData = z.infer<typeof signupSchema>;

export function SignupForm() {
  const supabase = createClientComponentClient();
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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.senha,
      });
      if (authError) {
        if (authError.message.toLowerCase().includes("user already registered") || authError.message.toLowerCase().includes("already registered")) {
          toast.error("E-mail já cadastrado. Faça login ou recupere sua senha.");
        } else {
          toast.error(authError.message);
        }
        return;
      }
      if (!authData.user) {
        toast.error("Usuário não criado. Verifique seu e-mail para confirmação.");
        return;
      }
      toast.success("Cadastro realizado com sucesso!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Erro inesperado. Tente novamente.");
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
              error={errors.nome?.message}
              autoComplete="name"
              {...register("nome")}
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
              leftIcon={<Phone className="h-4 w-4" />}
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