import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Toaster } from 'sonner';

export const metadata = {
  title: "Whatsapp Agents AI",
  description: "Automatize o atendimento da sua empresa no WhatsApp com agentes inteligentes de IA, personalizados e fáceis de configurar.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`} suppressHydrationWarning>
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
