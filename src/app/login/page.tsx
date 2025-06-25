import Image from 'next/image';
import { LoginForm } from '@/components/login/LoginForm';
import { Check } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen bg-background">
      {/* Seção do formulário */}
      <section className="flex flex-1 flex-col justify-center items-center px-6 py-8 sm:px-8 md:px-16 lg:px-24 xl:px-32 bg-white">
        <div className="w-full max-w-md flex flex-col items-center">
          <Image src="/logo-chat.svg" alt="Logo" width={80} height={80} className="mb-8" />
          <LoginForm />
        </div>
      </section>
      {/* Seção visual (escondida no mobile) */}
      <section className="hidden lg:flex flex-1 flex-col justify-center items-center bg-brand-gray-deep text-white p-12">
        <div className="max-w-lg w-full flex flex-col items-center">
          <h2 className="text-3xl font-bold mb-10 text-center">Automatize o atendimento da sua empresa por Whatsapp</h2>
          <Image src="/login-illustration.svg" alt="Ilustração login" width={350} height={220} className="mb-10" />
          <p className="text-lg mb-10 text-center">O Agentes Inteligentes, ajudam a sua empresa a crescer.</p>
          <ul className="space-y-5 text-base">
            {[
              {
                titulo: 'Atendimento 24/7:',
                texto: ' nunca perca uma mensagem de cliente'
              },
              {
                titulo: 'Resposta com identidade:',
                texto: ' personalize o tom e a personalidade do seu agente para refletir sua marca'
              },
              {
                titulo: 'Sem complicação técnica:',
                texto: ' conecte seu número via QR Code e comece a usar em minutos'
              },
              {
                titulo: 'Múltiplos agentes, múltiplos objetivos:',
                texto: ' crie agentes para vendas, suporte, dúvidas ou promoções — todos no mesmo lugar'
              },
              {
                titulo: '',
                texto: 'e muito mais...'
              }
            ].map((item, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-brand-green-light flex-shrink-0" />
                <span>{item.titulo && <b>{item.titulo}</b>}{item.texto}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

export const metadata = {
  title: 'Whatsapp Agents AI',
  description: 'Automatize o atendimento da sua empresa no WhatsApp com agentes inteligentes, personalizados e fáceis de configurar.',
  keywords: [
    'whatsapp', 'atendimento', 'chatbot', 'agente inteligente', 'automação', 'suporte', 'vendas', 'IA', 'bot', 'empresa'
  ]
}; 