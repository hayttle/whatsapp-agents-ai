import Image from 'next/image';
import { SignupForm } from '@/components/signup/SignupForm';

export default function SignupPage() {
  return (
    <main className="flex min-h-screen bg-background">
      {/* Seção visual (escondida no mobile) */}
      <section className="hidden lg:flex flex-1 flex-col justify-center items-center bg-brand-gray-deep text-white p-12">
        <div className="max-w-lg w-full flex flex-col items-center">
          <h2 className="text-3xl font-bold mb-8 text-center">O que você pode desenvolver?</h2>
          <Image src="/sign-up-illustration.svg" alt="Ilustração cadastro" width={350} height={220} className="mb-8" />
          <p className="text-xl font-semibold text-center mb-8">Com os nossos Agentes de IA você tem inúmeras possibilidades de agregar funcionalidades ao seu negócio!</p>
        </div>
      </section>
      {/* Seção do formulário */}
      <section className="flex flex-1 flex-col justify-center items-center px-6 py-8 sm:px-8 md:px-16 lg:px-24 xl:px-32 bg-white">
        <div className="w-full max-w-md flex flex-col items-center">
          <Image src="/logo-chat.svg" alt="Logo" width={80} height={80} className="mb-8" />
          <SignupForm />
        </div>
      </section>
    </main>
  );
} 