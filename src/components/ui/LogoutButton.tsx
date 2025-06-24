"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/brand";
import { toast } from "sonner";
import { useState } from "react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      const result = await response.json();
      setLoading(false);
      if (!response.ok) {
        toast.error('Erro ao sair. Tente novamente.');
      } else {
        toast.success('Logout realizado!');
        router.push('/login');
      }
    } catch (err) {
      setLoading(false);
      toast.error('Erro ao sair. Tente novamente.');
    }
  };

  return (
    <Button 
      onClick={handleLogout} 
      loading={loading} 
      variant="outline"
      className="w-full mt-4"
      leftIcon={<LogOut className="w-4 h-4" />}
    >
      Sair
    </Button>
  );
} 