import { AuthProvider } from '@/hooks/useAuth';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { SubscriptionGuard } from '@/components/brand/SubscriptionGuard';

export default function AssinaturaLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthenticatedLayout>
        <SubscriptionGuard>
          <div className="p-4 md:p-8">
            {children}
          </div>
        </SubscriptionGuard>
      </AuthenticatedLayout>
    </AuthProvider>
  );
} 