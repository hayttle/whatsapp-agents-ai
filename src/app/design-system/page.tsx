'use client';

import React from 'react';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  Badge,
  Input,
  Alert,
  StatusIndicator,
  WhatsAppInstanceCard
} from '@/components/brand';
import { 
  Mail, 
  Search, 
  Eye, 
  Settings, 
  MessageSquare
} from 'lucide-react';

export default function DesignSystemPage() {
  // Dados de exemplo para as instâncias
  const exampleInstances = [
    {
      id: '1',
      name: 'Loja Principal',
      number: '+55 11 99999-9999',
      status: 'online' as const,
      type: 'business' as const,
      isActive: true,
      lastActivity: '2 minutos atrás'
    },
    {
      id: '2',
      name: 'Suporte Técnico',
      number: '+55 11 88888-8888',
      status: 'connecting' as const,
      type: 'business' as const,
      isActive: true
    },
    {
      id: '3',
      name: 'Vendas',
      number: '+55 11 77777-7777',
      status: 'offline' as const,
      type: 'personal' as const,
      isActive: false
    }
  ];

  const handleConnect = () => {
    // Remover todos os console.log
  };

  const handleDisconnect = () => {};

  const handleEdit = () => {};

  const handleDelete = () => {};

  const handleShowQR = () => {};

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-brand-gray-dark mb-4">Design System</h1>
          <p className="text-lg text-gray-600">Componentes reutilizáveis que usam as cores da marca</p>
        </div>

        {/* Cores da Marca */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-brand-gray-dark mb-6">Cores da Marca</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-brand-green-light rounded-lg mx-auto mb-2"></div>
              <p className="text-sm font-medium">brand-green-light</p>
              <p className="text-xs text-gray-500">#3BA863</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-brand-green rounded-lg mx-auto mb-2"></div>
              <p className="text-sm font-medium">brand-green</p>
              <p className="text-xs text-gray-500">#25D366</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-brand-green-medium rounded-lg mx-auto mb-2"></div>
              <p className="text-sm font-medium">brand-green-medium</p>
              <p className="text-xs text-gray-500">#418058</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-brand-green-dark rounded-lg mx-auto mb-2"></div>
              <p className="text-sm font-medium">brand-green-dark</p>
              <p className="text-xs text-gray-500">#395443</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-brand-gray-dark rounded-lg mx-auto mb-2"></div>
              <p className="text-sm font-medium">brand-gray-dark</p>
              <p className="text-xs text-gray-500">#2B332E</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-brand-gray-deep rounded-lg mx-auto mb-2"></div>
              <p className="text-sm font-medium">brand-gray-deep</p>
              <p className="text-xs text-gray-500">#28332C</p>
            </div>
          </div>
        </section>

        {/* Botões */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-brand-gray-dark mb-6">Botões</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-dark mb-4">Variantes</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primário</Button>
                <Button variant="secondary">Secundário</Button>
                <Button variant="warning">Warning</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="add" leftIcon={<span className="text-lg font-bold">+</span>}>Novo (Add)</Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">Use <code>variant=&quot;add&quot;</code> para botões de adição, como &quot;Nova Instância&quot; ou &quot;Novo Provedor&quot;. Visual escuro, texto branco, fonte semibold, hover escurecido.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-dark mb-4">Tamanhos</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Pequeno</Button>
                <Button size="md">Médio</Button>
                <Button size="lg">Grande</Button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-dark mb-4">Estados</h3>
              <div className="flex flex-wrap gap-4">
                <Button loading>Carregando</Button>
                <Button disabled>Desabilitado</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-brand-gray-dark mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Card Padrão</CardTitle>
                <CardDescription>Descrição do card padrão</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Conteúdo do card com as cores padrão.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Ação</Button>
              </CardFooter>
            </Card>
            
            <Card variant="brand">
              <CardHeader>
                <CardTitle className="text-white">Card da Marca</CardTitle>
                <CardDescription className="text-gray-300">Card com cores da marca</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">Conteúdo do card com as cores da marca.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-brand-gray-deep">
                  Ação
                </Button>
              </CardFooter>
            </Card>
            
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Card Elevado</CardTitle>
                <CardDescription>Card com sombra mais pronunciada</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Conteúdo do card elevado.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Ação</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Badges */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-brand-gray-dark mb-6">Badges</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-dark mb-4">Variantes</h3>
              <div className="flex flex-wrap gap-4">
                <Badge variant="default">Padrão</Badge>
                <Badge variant="success">Sucesso</Badge>
                <Badge variant="warning">Aviso</Badge>
                <Badge variant="error">Erro</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="brand">Marca</Badge>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-dark mb-4">Tamanhos</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Badge size="sm">Pequeno</Badge>
                <Badge size="md">Médio</Badge>
                <Badge size="lg">Grande</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Inputs */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-brand-gray-dark mb-6">Inputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Email" 
              placeholder="Digite seu email"
              leftIcon={<Mail className="h-4 w-4" />}
            />
            <Input 
              label="Senha" 
              type="password" 
              placeholder="Digite sua senha"
              rightIcon={<Eye className="h-4 w-4" />}
            />
            <Input 
              label="Buscar" 
              placeholder="Buscar..."
              leftIcon={<Search className="h-4 w-4" />}
            />
            <Input 
              label="Nome" 
              placeholder="Digite seu nome"
              error="Nome é obrigatório"
            />
          </div>
        </section>

        {/* Alerts */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-brand-gray-dark mb-6">Alerts</h2>
          <div className="space-y-4">
            <Alert variant="success" title="Sucesso!">
              Sua operação foi concluída com sucesso.
            </Alert>
            <Alert variant="warning" title="Atenção!">
              Esta ação não pode ser desfeita.
            </Alert>
            <Alert variant="error" title="Erro!">
              Ocorreu um erro ao processar sua solicitação.
            </Alert>
            <Alert variant="info" title="Informação">
              Aqui está uma informação importante para você.
            </Alert>
            <Alert variant="default" title="Nota">
              Esta é uma mensagem padrão do sistema.
            </Alert>
          </div>
        </section>

        {/* Status Indicators */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-brand-gray-dark mb-6">Status Indicators</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-dark mb-4">Estados</h3>
              <div className="flex flex-wrap gap-6">
                <StatusIndicator status="online" showLabel />
                <StatusIndicator status="offline" showLabel />
                <StatusIndicator status="away" showLabel />
                <StatusIndicator status="busy" showLabel />
                <StatusIndicator status="connecting" showLabel />
                <StatusIndicator status="error" showLabel />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-dark mb-4">Tamanhos</h3>
              <div className="flex flex-wrap items-center gap-6">
                <StatusIndicator status="online" size="sm" showLabel />
                <StatusIndicator status="online" size="md" showLabel />
                <StatusIndicator status="online" size="lg" showLabel />
              </div>
            </div>
          </div>
        </section>

        {/* WhatsApp Instance Cards */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-brand-gray-dark mb-6">WhatsApp Instance Cards</h2>
          <p className="text-gray-600 mb-6">Exemplo de uso real dos componentes em um contexto específico</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exampleInstances.map((instance) => (
              <WhatsAppInstanceCard
                key={instance.id}
                instance={instance}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onShowQR={handleShowQR}
              />
            ))}
          </div>
        </section>

        {/* Exemplo de Uso Real */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-brand-gray-dark mb-6">Exemplo de Uso Real</h2>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Instância WhatsApp</CardTitle>
                  <CardDescription>Gerencie suas instâncias do WhatsApp</CardDescription>
                </div>
                <StatusIndicator status="online" showLabel />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge variant="brand">Ativo</Badge>
                  <Badge variant="info">Business</Badge>
                </div>
                <Alert variant="info" title="Dica">
                  Esta instância está conectada e funcionando normalmente.
                </Alert>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Nome da Instância" 
                    placeholder="Minha Loja"
                    leftIcon={<Settings className="h-4 w-4" />}
                  />
                  <Input 
                    label="Número" 
                    placeholder="+55 11 99999-9999"
                    leftIcon={<MessageSquare className="h-4 w-4" />}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex gap-2">
                <Button variant="outline">Editar</Button>
                <Button variant="destructive">Desconectar</Button>
                <Button>Conectar</Button>
              </div>
            </CardFooter>
          </Card>
        </section>
      </div>
    </div>
  );
} 