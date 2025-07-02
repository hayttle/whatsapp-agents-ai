// Script para limpar usuários órfãos do Supabase Auth
// Execute com: node cleanup-auth-users.js

// Carregar variáveis de ambiente do Next.js
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas');
  console.log('Verifique se existe um arquivo .env.local ou .env');
  console.log('');
  console.log('Exemplo de .env.local:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupOrphanedAuthUsers() {
  try {
    // 1. Buscar todos os usuários do Supabase Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      return;
    }

    // 2. Buscar todos os usuários da tabela users
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('id');

    if (dbError) {
      return;
    }

    const dbUserIds = new Set(dbUsers.map(user => user.id));

    // 3. Identificar usuários órfãos (existem no Auth mas não na tabela)
    const orphanedUsers = authUsers.users.filter(authUser => !dbUserIds.has(authUser.id));

    if (orphanedUsers.length === 0) {
      return;
    }

    // 4. Deletar usuários órfãos
    let deletedCount = 0;
    let errorCount = 0;

    for (const user of orphanedUsers) {
      try {
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        
        if (error) {
          errorCount++;
        } else {
          deletedCount++;
        }
      } catch (err) {
        errorCount++;
      }
    }

    if (errorCount > 0) {
      return;
    }

    return;

  } catch (error) {
    return;
  }
}

// Executar limpeza
cleanupOrphanedAuthUsers(); 