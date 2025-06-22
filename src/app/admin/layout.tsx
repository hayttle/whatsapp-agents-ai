import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthenticatedLayout>
      <div className="p-8">
        {children}
      </div>
    </AuthenticatedLayout>
  );
} 