import { ArrowRight, Bot, Zap, Settings, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/brand";
import { PlanList } from '@/components/brand/PlanList';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bot className="w-8 h-8 text-brand-green-light" />
          <h1 className="text-xl font-bold text-brand-gray-dark">WhatsApp Agents AI</h1>
        </div>
        <div className="flex items-center gap-4">
          <a href="/login" className="text-sm font-medium text-brand-gray-dark hover:text-brand-green-dark transition-colors">
            Login
          </a>
          <a href="/signup" className="inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 px-3 py-1.5 text-sm rounded-md bg-brand-green-light hover:bg-brand-green-medium text-white focus:ring-brand-green-light shadow-sm">
            Criar Conta
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="text-center py-20 px-6">
          <h2 className="text-5xl font-bold text-brand-gray-dark tracking-tight">
            Crie Agentes de IA para seu WhatsApp em minutos
          </h2>
          <p className="mt-4 text-lg max-w-2xl mx-auto text-brand-gray-dark">
            Automatize o atendimento do seu negócio com inteligência artificial personalizada. Seus clientes terão respostas profissionais 24 horas por dia.
          </p>
          <a href="/signup" className="inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 px-6 py-3 text-base rounded-lg bg-brand-green-light hover:bg-brand-green-medium text-white focus:ring-brand-green-light shadow-sm mt-8">
            Criar meu agente de IA
            <ArrowRight className="w-5 h-5 ml-2" />
          </a>
        </section>

        {/* How it works */}
        <section className="py-20 bg-gray-50 px-6">
          <div className="container mx-auto">
            <h3 className="text-3xl font-bold text-center text-brand-gray-dark">Como funciona</h3>
            <div className="mt-12 grid md:grid-cols-3 gap-12 text-center">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-16 h-16 mb-4 bg-brand-green-light rounded-full text-white text-2xl font-bold">1</div>
                <h4 className="text-xl font-semibold text-brand-gray-dark">Crie sua conta</h4>
                <p className="mt-2 text-brand-gray-dark">Cadastre-se na nossa plataforma de forma rápida e simples, sem complicações ou taxas de setup.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-16 h-16 mb-4 bg-brand-green-light rounded-full text-white text-2xl font-bold">2</div>
                <h4 className="text-xl font-semibold text-brand-gray-dark">Conecte seu WhatsApp</h4>
                <p className="mt-2 text-brand-gray-dark">Vincule seu número do WhatsApp Business à nossa plataforma através da API Evolution.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-16 h-16 mb-4 bg-brand-green-light rounded-full text-white text-2xl font-bold">3</div>
                <h4 className="text-xl font-semibold text-brand-gray-dark">Crie seu agente de IA</h4>
                <p className="mt-2 text-brand-gray-dark">Configure seu assistente virtual com informações sobre seu negócio. O resto ele vai fazer automaticamente.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Why choose us */}
        <section className="py-20 px-6">
          <div className="container mx-auto">
            <h3 className="text-3xl font-bold text-center text-brand-gray-dark">Por que escolher nossa plataforma?</h3>
            <div className="mt-12 grid md:grid-cols-3 gap-8">
              <FeatureCard icon={<Zap size={24} />} title="Atendimento 24/7" description="Seus clientes recebem respostas instantâneas a qualquer hora do dia, aumentando a satisfação e as vendas." />
              <FeatureCard icon={<UserCheck size={24} />} title="Totalmente Personalizado" description="Configure seu agente com o tom de voz do seu negócio e informações específicas sobre produtos e serviços." />
              <FeatureCard icon={<Settings size={24} />} title="Fácil de Usar" description="Não precisa de conhecimento técnico. Nossa interface é intuitiva e você mesmo consegue configurar em minutos." />
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-gray-50 px-6">
          <div className="container mx-auto">
            <h3 className="text-3xl font-bold text-center text-brand-gray-dark">O que nossos clientes dizem</h3>
            <div className="mt-12 grid lg:grid-cols-3 gap-8">
              <TestimonialCard name="Maria Silva" company="Lojas Belas" text="“Agora meus clientes têm respostas imediatas, mesmo fora do horário. Minhas vendas aumentaram 40%!”" />
              <TestimonialCard name="João Santos" company="Restaurante" text="“Configurei em 10 minutos. Agora aceito pedidos e respondo dúvidas até quando estou ocupado na cozinha.”" />
              <TestimonialCard name="Ana Costa" company="Clínica de Beleza" text="“Meus clientes adoram agendar horários pelo WhatsApp. O atendimento ficou muito mais profissional.”" />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-brand-gray-deep text-white">
          <div className="container mx-auto px-6 py-20 text-center">
            <h3 className="text-3xl font-bold">Pronto para revolucionar seu atendimento?</h3>
            <p className="mt-4 max-w-2xl mx-auto">
              Junte-se a centenas de pequenas empresas que já automatizaram seu WhatsApp com IA.
            </p>
            <a href="/signup" className="inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 px-6 py-3 text-base rounded-lg bg-brand-gray-dark hover:bg-brand-gray-deep text-white focus:ring-brand-gray-dark shadow-sm mt-8">
              Começar agora gratuitamente
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </div>
        </section>

        <section className="my-16">
          <h2 className="text-2xl font-bold text-center mb-8">Planos e Assinaturas</h2>
          <PlanList />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="container mx-auto px-6 py-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2">
                <Bot className="w-8 h-8 text-brand-green-light" />
                <h1 className="text-xl font-bold text-brand-gray-dark">WhatsApp Agents AI</h1>
              </div>
              <p className="mt-2 text-sm text-gray-500">Automatize seu atendimento no WhatsApp com inteligência artificial.</p>
            </div>
            <div>
              <h4 className="font-semibold text-brand-gray-dark">Produto</h4>
              <nav className="mt-4 flex flex-col gap-2 text-sm">
                <a href="#" className="text-gray-500 hover:text-brand-green-dark">Funcionalidades</a>
                <a href="#" className="text-gray-500 hover:text-brand-green-dark">Preços</a>
                <a href="#" className="text-gray-500 hover:text-brand-green-dark">Documentação</a>
              </nav>
            </div>
            <div>
              <h4 className="font-semibold text-brand-gray-dark">Empresa</h4>
              <nav className="mt-4 flex flex-col gap-2 text-sm">
                <a href="#" className="text-gray-500 hover:text-brand-green-dark">Sobre Nós</a>
                <a href="#" className="text-gray-500 hover:text-brand-green-dark">Contato</a>
              </nav>
            </div>
            <div>
              <h4 className="font-semibold text-brand-gray-dark">Legal</h4>
              <nav className="mt-4 flex flex-col gap-2 text-sm">
                <a href="#" className="text-gray-500 hover:text-brand-green-dark">Termos de Uso</a>
                <a href="#" className="text-gray-500 hover:text-brand-green-dark">Política de Privacidade</a>
                <a href="#" className="text-gray-500 hover:text-brand-green-dark">Suporte</a>
              </nav>
            </div>
          </div>
          <div className="mt-8 border-t pt-4 text-center text-sm text-gray-400">
            <p>© {new Date().getFullYear()} WhatsApp Agents AI. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <Card className="text-center">
    <CardContent className="pt-6">
      <div className="text-brand-green-light mb-4 flex justify-center">{icon}</div>
      <h4 className="text-xl font-semibold text-brand-gray-dark">{title}</h4>
      <p className="mt-2 text-gray-600">{description}</p>
    </CardContent>
  </Card>
);

const TestimonialCard = ({ name, company, text }: { name: string, company: string, text: string }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
          <UserCheck className="w-6 h-6 text-gray-500" />
        </div>
        <div>
          <p className="font-semibold text-brand-gray-dark">{name}</p>
          <p className="text-sm text-gray-500">{company}</p>
        </div>
      </div>
      <p className="text-gray-600">{text}</p>
    </CardContent>
  </Card>
);

export const metadata = {
  title: 'Whatsapp Agents AI',
  description: 'Automatize o atendimento do seu negócio no WhatsApp com agentes de IA personalizados, disponíveis 24/7, sem complicação técnica.',
  keywords: [
    'whatsapp', 'landing page', 'chatbot', 'agente inteligente', 'automação', 'suporte', 'vendas', 'IA', 'bot', 'empresa'
  ]
};
