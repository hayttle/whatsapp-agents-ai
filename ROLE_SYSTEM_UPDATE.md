# Atualização do Sistema de Roles

## Resumo das Mudanças

O sistema foi atualizado para ter apenas dois roles: `super_admin` e `user`, removendo completamente o role `admin`.

## Novos Roles

### Super Admin (`super_admin`)
- **Acesso completo e irrestrito** a todo o sistema
- Pode gerenciar todas as empresas, usuários, agentes e instâncias
- Acesso total ao painel administrativo

### User (`user`)
- **Acesso limitado** à sua própria empresa
- Pode gerenciar apenas seus próprios agentes e instâncias
- Não tem acesso ao painel administrativo

## Mudanças Implementadas

### 1. Banco de Dados

#### Script SQL (`update_users_rls_policies.sql`)
- Removida constraint que permitia role `admin`
- Nova constraint: `CHECK (role IN ('user', 'super_admin'))`
- Políticas RLS atualizadas para apenas super_admin

### 2. Tipos TypeScript

#### `src/components/admin/users/types.ts`
```typescript
// Antes
role: 'user' | 'admin' | 'super_admin';

// Depois
role: 'user' | 'super_admin';
```

#### `src/services/userService.ts`
```typescript
// Antes
role: 'super_admin' | 'admin' | 'user';

// Depois
role: 'super_admin' | 'user';
```

### 3. Componentes

#### Sidebar (`src/components/layout/Sidebar.tsx`)
- Removida interface `adminOnly`
- Todos os itens administrativos agora são `superAdminOnly: true`
- Lógica de filtragem simplificada

#### UserModal (`src/components/admin/users/UserModal.tsx`)
- Removida opção "Admin" do select de roles
- Validações atualizadas para apenas `super_admin` e `user`

### 4. Páginas de Administração

#### Página Principal (`src/app/admin/page.tsx`)
- Acesso restrito apenas a `super_admin`
- Removidas verificações de `admin`

#### Página de Agentes (`src/app/admin/agentes/page.tsx`)
- Acesso restrito apenas a `super_admin`

#### Página de Instâncias (`src/app/admin/instancias/page.tsx`)
- Acesso restrito apenas a `super_admin`

#### Página de Usuários (`src/app/admin/usuarios/page.tsx`)
- Acesso restrito apenas a `super_admin`

### 5. Componentes de Listagem

#### InstanceList (`src/components/admin/instances/InstanceList.tsx`)
- Removida prop `isAdmin`
- Apenas `super_admin` pode gerenciar instâncias

## Estrutura de Acesso

### Super Admin
- ✅ Dashboard
- ✅ Empresas
- ✅ Usuários
- ✅ Agentes
- ✅ Instâncias
- ✅ Configurações
- ✅ Logs do Sistema

### User
- ❌ Dashboard
- ❌ Empresas
- ❌ Usuários
- ❌ Agentes (globais)
- ❌ Instâncias (globais)
- ❌ Configurações
- ❌ Logs do Sistema
- ✅ Seus próprios agentes (via empresa)
- ✅ Suas próprias instâncias (via empresa)

## Instruções de Deploy

### 1. Executar Script SQL
```sql
-- Execute o arquivo update_users_rls_policies.sql no Supabase
```

### 2. Atualizar Usuários Existentes
```sql
-- Converter usuários admin para user ou super_admin
UPDATE users SET role = 'user' WHERE role = 'admin';
-- OU
UPDATE users SET role = 'super_admin' WHERE role = 'admin';
```

### 3. Deploy do Código
- Todas as mudanças no código estão prontas para deploy

## Teste da Funcionalidade

### 1. Super Admin
- Deve ver todos os itens no sidebar
- Deve conseguir acessar todas as páginas administrativas
- Deve conseguir gerenciar usuários, empresas, agentes e instâncias

### 2. User
- Não deve ver itens administrativos no sidebar
- Não deve conseguir acessar páginas administrativas
- Deve ter acesso apenas às funcionalidades da sua empresa

## Benefícios da Mudança

1. **Simplicidade**: Sistema mais simples com apenas dois roles
2. **Segurança**: Maior controle de acesso
3. **Manutenibilidade**: Código mais limpo e fácil de manter
4. **Clareza**: Permissões mais claras e diretas

## Rollback (Se Necessário)

Para reverter as mudanças:

1. **Banco de Dados**: Reverter o script SQL
2. **Código**: Reverter as alterações nos arquivos
3. **Usuários**: Restaurar roles admin se necessário 