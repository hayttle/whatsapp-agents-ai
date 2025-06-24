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

**Variantes:**
- `primary`: Verde da marca (#3BA863) com hover mais escuro
- `secondary`: Azul claro (bg-blue-100) com texto azul escuro e hover azul mais escuro
- `outline`: Borda verde com texto verde, hover preenche com verde
- `ghost`: Texto cinza escuro com hover cinza
- `destructive`: Vermelho para ações destrutivas

### ActionButton
Botão de ação compacto com ícone, ideal para listas e ações secundárias.

```tsx
import { ActionButton } from '@/components/ui';
import { Edit, Trash2 } from 'lucide-react';

<ActionButton 
  icon={Edit} 
  variant="secondary" 
  onClick={() => handleEdit(id)}
  title="Editar"
/>
```

**Props:**
- `icon`: LucideIcon (ícone do Lucide React)
- `onClick`: () => void
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
- `size`: 'sm' | 'md' | 'lg'
- `disabled`: boolean
- `loading`: boolean
- `title`: string (tooltip)

**Variantes:**
- `primary`: Verde da marca (#3BA863) com hover mais escuro
- `secondary`: Azul claro (bg-blue-100) com texto azul escuro e hover azul mais escuro
- `outline`: Borda verde com texto verde, hover preenche com verde
- `ghost`: Texto cinza escuro com hover cinza
- `destructive`: Vermelho para ações destrutivas

**Uso Recomendado:**
- Use `variant="secondary"` para botões de "Editar" em listas
- Use `variant="primary"` para botões de ativar/ativar agentes
- Use `variant="destructive"` para botões de "Deletar"
- Use `variant="ghost"` para ações menos importantes

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

### Switch
Componente toggle para valores booleanos, seguindo o padrão visual do sistema.

```tsx
import { Switch } from '@/components/brand';

<Switch checked={value} onCheckedChange={setValue} id="meu-switch">
  Ativo
</Switch>
```

**Props:**
- `checked`: boolean
- `onCheckedChange`: (checked: boolean) => void
- `id`: string (opcional)
- `disabled`: boolean (opcional)
- `children`: ReactNode (label opcional)

### Tooltip
Tooltip reutilizável para ações sensíveis ou ícones sem label.

```tsx
import { Tooltip } from '@/components/ui';

<Tooltip content="Texto do tooltip">
  <Button>Hover me</Button>
</Tooltip>
```

**Props:**
- `content`: ReactNode (texto do tooltip)
- `children`: ReactNode (elemento alvo)

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

## Importações Centralizadas

Todos os componentes do sistema seguem o padrão de importação centralizada:

### Componentes da Marca (`/brand`)
```tsx
import { Button, Card, Badge, Input, Alert } from '@/components/brand';
```

### Componentes UI (`/ui`)
```tsx
import { Modal, Tooltip, ConfirmationModal, ActionButton } from '@/components/ui';
```

**Importante**: Sempre use as importações centralizadas via `index.ts` em vez de importar diretamente dos arquivos individuais. Isso garante:
- Consistência no código
- Facilita refatorações futuras
- Evita erros de importação
- Mantém o padrão do projeto

## Padrões de Uso dos Botões

### Button vs ActionButton
- **Button**: Use para ações principais, formulários e CTAs (Call-to-Action)
- **ActionButton**: Use para ações secundárias em listas, tabelas e cards

### Padrão de Variantes
- **primary**: Ações principais e positivas (salvar, ativar, conectar)
- **secondary**: Ações de edição e modificação (editar, configurar)
- **outline**: Ações alternativas que não são a principal
- **ghost**: Ações menos importantes ou de navegação
- **destructive**: Ações destrutivas (deletar, remover, desconectar)

### Exemplos de Uso
```tsx
// Botão principal em formulário
<Button variant="primary" onClick={handleSave}>
  Salvar Alterações
</Button>

// Botão de edição em lista
<ActionButton 
  icon={Edit} 
  variant="secondary" 
  onClick={() => handleEdit(id)}
  title="Editar"
/>

// Botão de ativar/desativar agente
<ActionButton 
  icon={isActive ? Pause : Play} 
  variant={isActive ? "secondary" : "primary"}
  onClick={() => handleToggleStatus(id)}
  title={isActive ? "Desativar" : "Ativar"}
/>

// Botão de deletar
<ActionButton 
  icon={Trash2} 
  variant="destructive" 
  onClick={() => handleDelete(id)}
  title="Deletar"
/>
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