import { AuthProvider } from '@/hooks/useAuth';

export default function AssinaturaLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
} 