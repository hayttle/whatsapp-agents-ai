"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

const supabase = createClient();

export function ClientSideUserSection() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  return (
    <div>
      <h2>Usuário Atual (Client-Side)</h2>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
} 