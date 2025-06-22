# ActionButton Component

Um componente reutilizável para botões de ação com ícones, projetado para padronizar a interface de ações em listas e tabelas.

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `icon` | `LucideIcon` | - | Ícone do Lucide React |
| `onClick` | `() => void` | - | Função executada ao clicar |
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'success' \| 'warning'` | `'primary'` | Variante de cor do botão |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamanho do botão |
| `disabled` | `boolean` | `false` | Se o botão está desabilitado |
| `loading` | `boolean` | `false` | Se está carregando (mostra spinner) |
| `title` | `string` | - | Tooltip do botão |
| `className` | `string` | `''` | Classes CSS adicionais |

## Variantes

- **primary**: Azul (editar, visualizar)
- **secondary**: Cinza (ações neutras)
- **danger**: Vermelho (deletar, cancelar)
- **success**: Verde (conectar, ativar)
- **warning**: Amarelo (desconectar, desativar)

## Tamanhos

- **sm**: 1.5rem padding, ícone 3.5x3.5
- **md**: 2rem padding, ícone 4x4
- **lg**: 2.5rem padding, ícone 5x5

## Exemplos de Uso

### Lista de Instâncias
```tsx
<ActionButton
  icon={Power}
  onClick={() => handleConnect(instance.name)}
  variant="success"
  disabled={isLoading}
  loading={isLoading}
  title="Conectar"
/>
```

### Lista de Usuários
```tsx
<ActionButton
  icon={Edit}
  onClick={() => handleEdit(user.id)}
  variant="primary"
  title="Editar"
/>
```

### Lista de Empresas
```tsx
<ActionButton
  icon={Trash2}
  onClick={() => handleDelete(empresa.id)}
  variant="danger"
  loading={isLoading}
  title="Deletar"
/>
```

## Benefícios

1. **Consistência**: Padrão uniforme em toda a aplicação
2. **Acessibilidade**: Tooltips e focus rings automáticos
3. **Estados**: Loading, disabled e hover states padronizados
4. **Manutenibilidade**: Mudanças centralizadas no componente
5. **Reutilização**: Fácil implementação em novas listas 