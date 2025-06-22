"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/brand";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Lock } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Senha obrigatória"),
});

type LoginData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const supabase = createClientComponentClient();
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
      const { data: loginData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.senha,
      });

      if (error) {
        toast.error(error.message);
      } else if (loginData.user) {
        toast.success("Login realizado com sucesso!");
        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
      }
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
          <CardTitle className="text-2xl">Bem-vindo de volta!</CardTitle>
          <CardDescription>Faça login para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              autoComplete="current-password"
              {...register("senha")}
            />
            <Button 
              type="submit" 
              loading={loading} 
              disabled={loading} 
              className="w-full"
              size="lg"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 