# Migração do Banco de Dados - Signup com Empresa e Usuário

## Visão Geral

Esta migração adiciona os campos necessários para suportar o novo fluxo de cadastro de duas etapas:
1. **Primeira etapa**: Dados da empresa (incluindo endereço completo)
2. **Segunda etapa**: Dados do usuário (incluindo WhatsApp)

## Campos Adicionados

### Tabela `tenants` (Empresas)
- `address_street` - Rua do endereço
- `address_number` - Número do endereço
- `address_complement` - Complemento (opcional)
- `address_neighborhood` - Bairro
- `address_city` - Cidade
- `address_state` - Estado (2 caracteres)
- `address_zip_code` - CEP

### Tabela `users` (Usuários)
- `whatsapp` - Número de WhatsApp do usuário

## Como Executar a Migração

### Opção 1: Via Supabase Dashboard
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Cole o conteúdo do arquivo `database-migration.sql`
5. Clique em **Run** para executar

### Opção 2: Via Supabase CLI
```bash
# Se você tem o Supabase CLI instalado
supabase db push
```

### Opção 3: Via psql (se tiver acesso direto)
```bash
psql -h [SEU_HOST] -U [SEU_USUARIO] -d [SEU_BANCO] -f database-migration.sql
```

## Verificação da Migração

Após executar a migração, você pode verificar se os campos foram adicionados:

```sql
-- Verificar campos da tabela tenants
\d tenants

-- Verificar campos da tabela users
\d users
```

## Funcionalidades Implementadas

### 1. Formulário de Signup em Duas Etapas
- **Etapa 1**: Dados da empresa (tipo, CPF/CNPJ, nome, endereço completo)
- **Etapa 2**: Dados do usuário (nome, email, WhatsApp, senha)

### 2. Validações
- Validação de CPF/CNPJ com algoritmo oficial
- Formatação automática de campos (CPF, CNPJ, CEP, telefone)
- Validação de senhas (confirmação)
- Validação de e-mail

### 3. Criação Automática
- Empresa criada na tabela `tenants`
- Usuário criado no Supabase Auth
- Usuário vinculado à empresa na tabela `users`
- Primeiro usuário da empresa recebe role `admin`

### 4. Tratamento de Erros
- Rollback automático em caso de falha
- Validação de documentos antes da criação
- Mensagens de erro específicas

## Estrutura de Dados

### Empresa (Tenant)
```typescript
{
  id: string;
  name: string;
  email: string;
  cpf_cnpj: string;
  phone: string;
  type: 'FISICA' | 'JURIDICA';
  status: 'ATIVO' | 'INATIVO';
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_zip_code?: string;
}
```

### Usuário
```typescript
{
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'super_admin';
  tenant_id?: string;
  whatsapp?: string;
}
```

## Próximos Passos

1. Execute a migração do banco de dados
2. Teste o fluxo de cadastro completo
3. Verifique se os dados estão sendo salvos corretamente
4. Teste a validação de CPF/CNPJ
5. Verifique se o usuário consegue fazer login após o cadastro

## Observações Importantes

- A migração é segura e não afeta dados existentes
- Os novos campos são opcionais para manter compatibilidade
- O sistema funciona mesmo sem executar a migração (campos opcionais)
- Recomenda-se executar a migração para aproveitar todas as funcionalidades 