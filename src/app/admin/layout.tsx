import { AuthProvider } from '@/hooks/useAuth';
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthenticatedLayout>
        <div className="p-4 md:p-8">
          {children}
        </div>
      </AuthenticatedLayout>
    </AuthProvider>
  );
} 