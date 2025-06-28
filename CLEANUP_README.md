# 🔧 Limpeza de Usuários Órfãos - Supabase Auth

## Problema Identificado

Quando usuários são deletados do sistema, eles são removidos apenas da tabela `users`, mas **não do Supabase Auth**. Isso causa conflito quando tenta criar um novo usuário com o mesmo email.

### Erro Típico:
```
Error [AuthApiError]: A user with this email address has already been registered
```

## Soluções Implementadas

### 1. ✅ API de Delete Corrigida
A API `/api/users/delete` agora remove usuários tanto da tabela `users` quanto do Supabase Auth.

### 2. ✅ Script de Limpeza
Criado script `cleanup-auth-users.js` para limpar usuários órfãos existentes.

### 3. ✅ Restrição de Auto-Delete
Implementada proteção para impedir que usuários se deletem a si mesmos.

## Como Resolver o Problema

### Opção 1: Limpeza Automática (Recomendado)

1. **Execute o script de limpeza:**
   ```bash
   node cleanup-auth-users.js
   ```

2. **Verifique as variáveis de ambiente:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **O script irá:**
   - ✅ Listar todos os usuários do Auth
   - ✅ Listar todos os usuários da tabela `users`
   - ✅ Identificar usuários órfãos
   - ✅ Deletar usuários órfãos do Auth
   - ✅ Mostrar relatório detalhado

### Opção 2: Limpeza Manual via Supabase Dashboard

1. **Acesse** [Supabase Dashboard](https://supabase.com/dashboard)
2. **Selecione seu projeto**
3. **Vá para Authentication > Users**
4. **Identifique usuários órfãos** (que não existem na tabela `users`)
5. **Delete manualmente** cada usuário órfão

### Opção 3: Limpeza via SQL (Avançado)

```sql
-- Listar usuários do Auth que não existem na tabela users
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- ⚠️ CUIDADO: Esta query apenas lista, não deleta
```

## Verificação da Correção

### 1. Teste a API de Delete
```bash
# Teste deletar um usuário
curl -X DELETE http://localhost:3000/api/users/delete \
  -H "Content-Type: application/json" \
  -d '{"id": "user-id-here"}'
```

### 2. Verifique os Logs
A API agora mostra logs detalhados:
```
Deletando usuário: user@example.com (ID: xxx)
Usuário deletado da tabela users com sucesso
Usuário deletado do Supabase Auth com sucesso
```

### 3. Teste Criação de Usuário
Após a limpeza, tente criar um usuário com email que foi deletado:
- ✅ Deve funcionar sem erro
- ✅ Não deve dar "email already exists"

### 4. Teste Restrição de Auto-Delete
```bash
# Execute o teste de auto-delete
node test-self-delete.js
```

**Resultado esperado:**
- ✅ Erro 400: "Você não pode excluir sua própria conta. Entre em contato com outro administrador."
- ✅ Usuário não é deletado

## Prevenção Futura

### ✅ API Corrigida
- Usuários deletados via interface agora são removidos do Auth automaticamente
- Logs detalhados para debugging
- Tratamento de erro robusto

### ✅ Validações
- Verificação se usuário existe antes de deletar
- **Proteção contra auto-delete** (usuário deletar a si mesmo)
- Rollback em caso de erro

### ✅ Mensagens em Português
- Erro de email duplicado: "Este email já está registrado no sistema. Tente usar um email diferente."
- Erro de auto-delete: "Você não pode excluir sua própria conta. Entre em contato com outro administrador."
- Erro de email inválido: "Email inválido. Verifique o formato do email."
- Erro de senha fraca: "A senha deve ter pelo menos 6 caracteres."

## Estrutura de Dados

### Antes (Problemático):
```
Tabela users: [user1, user2, user3] ❌
Supabase Auth: [user1, user2, user3, user4, user5] ❌
```

### Depois (Correto):
```
Tabela users: [user1, user2, user3] ✅
Supabase Auth: [user1, user2, user3] ✅
```

## Troubleshooting

### Se o script falhar:
1. **Verifique as variáveis de ambiente**
2. **Verifique as permissões do service role**
3. **Execute em modo debug:**
   ```bash
   DEBUG=* node cleanup-auth-users.js
   ```

### Se a API falhar:
1. **Verifique os logs do servidor**
2. **Verifique se o service role tem permissões**
3. **Teste manualmente via Supabase Dashboard**

### Se ainda houver conflitos:
1. **Execute o script de limpeza novamente**
2. **Verifique se há usuários pendentes de confirmação**
3. **Limpe manualmente via Dashboard se necessário**

### Se tentar auto-delete:
1. **Use outro super admin** para deletar o usuário
2. **Entre em contato** com outro administrador
3. **Verifique se há outros super admins** no sistema

## Próximos Passos

1. **Execute a limpeza** usando o script
2. **Teste a criação** de super admin
3. **Verifique se não há mais conflitos** de email
4. **Teste a restrição** de auto-delete
5. **Monitore os logs** para garantir que a correção está funcionando

---

**🎉 Após executar a limpeza, você poderá criar super admins sem problemas!** 