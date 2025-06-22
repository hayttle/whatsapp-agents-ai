# Componentes da Marca

Esta biblioteca de componentes reutilizáveis utiliza as cores da marca definidas no Tailwind CSS e oferece uma experiência consistente em toda a aplicação.

## Cores da Marca

### Verdes
- `brand-green-light` (#3BA863) - Verde claro para elementos de destaque
- `brand-green` (#25D366) - Verde padrão do WhatsApp
- `brand-green-medium` (#418058) - Verde médio para hover states
- `brand-green-dark` (#395443) - Verde escuro para textos

### Cinzas
- `brand-gray-dark` (#2B332E) - Cinza escuro para textos principais
- `brand-gray-deep` (#28332C) - Cinza profundo para backgrounds

## Componentes Disponíveis

### Button
Botão reutilizável com múltiplas variantes e estados.

```tsx
import { Button } from '@/components/brand';

<Button variant="primary" size="md" loading={false}>
  Clique aqui
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean
- `disabled`: boolean

### Card
Sistema de cards modular com header, content e footer.

```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/brand';

<Card variant="default">
  <CardHeader>
    <CardTitle>Título do Card</CardTitle>
  </CardHeader>
  <CardContent>
    Conteúdo do card
  </CardContent>
  <CardFooter>
    <Button>Ação</Button>
  </CardFooter>
</Card>
```

**Variantes:**
- `default`: Card padrão com fundo branco
- `brand`: Card com cores da marca
- `elevated`: Card com sombra mais pronunciada

### Badge
Indicadores visuais para status, categorias e tags.

```tsx
import { Badge } from '@/components/brand';

<Badge variant="success" size="md">
  Ativo
</Badge>
```

**Variantes:**
- `default`: Cinza neutro
- `success`: Verde para sucesso
- `warning`: Amarelo para avisos
- `error`: Vermelho para erros
- `info`: Azul para informações
- `brand`: Cor da marca

### Input
Campo de entrada com suporte a ícones e validação.

```tsx
import { Input } from '@/components/brand';
import { Mail } from 'lucide-react';

<Input 
  label="Email"
  placeholder="Digite seu email"
  leftIcon={<Mail className="h-4 w-4" />}
  error="Email inválido"
/>
```

**Props:**
- `label`: Texto do label
- `error`: Mensagem de erro
- `helperText`: Texto de ajuda
- `leftIcon`: Ícone à esquerda
- `rightIcon`: Ícone à direita

### Alert
Componente para exibir mensagens de feedback ao usuário.

```tsx
import { Alert } from '@/components/brand';

<Alert variant="success" title="Sucesso!">
  Operação concluída com sucesso.
</Alert>
```

**Variantes:**
- `default`: Cinza neutro
- `success`: Verde para sucesso
- `warning`: Amarelo para avisos
- `error`: Vermelho para erros
- `info`: Azul para informações

### StatusIndicator
Indicador visual de status com diferentes estados.

```tsx
import { StatusIndicator } from '@/components/brand';

<StatusIndicator status="online" showLabel size="md" />
```

**Estados:**
- `online`: Verde para conectado
- `offline`: Cinza para desconectado
- `away`: Amarelo para ausente
- `busy`: Vermelho para ocupado
- `connecting`: Cor da marca para conectando
- `error`: Vermelho para erro

### WhatsAppInstanceCard
Componente específico para exibir instâncias do WhatsApp.

```tsx
import { WhatsAppInstanceCard } from '@/components/brand';

const instance = {
  id: '1',
  name: 'Loja Principal',
  number: '+55 11 99999-9999',
  status: 'online',
  type: 'business',
  isActive: true,
  lastActivity: '2 minutos atrás'
};

<WhatsAppInstanceCard
  instance={instance}
  onConnect={(id) => handleConnect(id)}
  onDisconnect={(id) => handleDisconnect(id)}
  onEdit={(id) => handleEdit(id)}
  onDelete={(id) => handleDelete(id)}
  onShowQR={(id) => handleShowQR(id)}
/>
```

## Como Usar

1. **Importe os componentes:**
```tsx
import { Button, Card, Badge } from '@/components/brand';
```

2. **Use as cores da marca diretamente:**
```tsx
<div className="bg-brand-green-light text-white">
  Conteúdo com cor da marca
</div>
```

3. **Combine componentes:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Meu Título</CardTitle>
    <Badge variant="brand">Novo</Badge>
  </CardHeader>
  <CardContent>
    <p>Conteúdo do card</p>
  </CardContent>
  <CardFooter>
    <Button>Ação</Button>
  </CardFooter>
</Card>
```

## Boas Práticas

1. **Consistência**: Sempre use os componentes da marca em vez de criar estilos customizados
2. **Acessibilidade**: Todos os componentes já incluem atributos de acessibilidade
3. **Responsividade**: Os componentes são responsivos por padrão
4. **Performance**: Use as variantes e props disponíveis em vez de sobrescrever estilos

## Customização

Para adicionar novas variantes ou modificar componentes existentes:

1. Edite o componente no arquivo correspondente
2. Mantenha a consistência com as cores da marca
3. Atualize a documentação
4. Teste em diferentes contextos

## Exemplos

Veja exemplos completos na página de design system: `/design-system` 