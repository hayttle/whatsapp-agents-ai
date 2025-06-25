import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthenticatedLayout>
      <div className="p-4 md:p-8">
        {children}
      </div>
    </AuthenticatedLayout>
  );
} 