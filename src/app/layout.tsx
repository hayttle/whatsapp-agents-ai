import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Toaster } from 'sonner';

export const metadata = {
  title: "AI-Powered WhatsApp Agent",
  description: "Gerencie instâncias de WhatsApp com agentes de IA",
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
