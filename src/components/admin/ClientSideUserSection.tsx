"use client";
import { useState } from "react";
import { UserForm } from "@/components/admin/UserForm";
import { UserList } from "@/components/admin/UserList";

interface Props {
  isSuperAdmin: boolean;
  tenantId?: string;
}

export function ClientSideUserSection({ isSuperAdmin, tenantId }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <>
      <UserForm isSuperAdmin={isSuperAdmin} tenantId={tenantId} onUserCreated={() => setRefreshKey(k => k + 1)} />
      <h2 className="text-xl font-semibold mb-2">Usuários cadastrados</h2>
      <UserList isSuperAdmin={isSuperAdmin} tenantId={tenantId} refreshKey={refreshKey} />
    </>
  );
} 