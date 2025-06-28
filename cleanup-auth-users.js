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
    console.log('🔍 Iniciando limpeza de usuários órfãos...');

    // 1. Buscar todos os usuários do Supabase Auth
    console.log('📋 Buscando usuários do Supabase Auth...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao buscar usuários do Auth:', authError);
      return;
    }

    console.log(`📊 Encontrados ${authUsers.users.length} usuários no Auth`);

    // 2. Buscar todos os usuários da tabela users
    console.log('📋 Buscando usuários da tabela users...');
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('id');

    if (dbError) {
      console.error('❌ Erro ao buscar usuários da tabela:', dbError);
      return;
    }

    const dbUserIds = new Set(dbUsers.map(user => user.id));
    console.log(`📊 Encontrados ${dbUsers.length} usuários na tabela users`);

    // 3. Identificar usuários órfãos (existem no Auth mas não na tabela)
    const orphanedUsers = authUsers.users.filter(authUser => !dbUserIds.has(authUser.id));
    
    console.log(`🔍 Encontrados ${orphanedUsers.length} usuários órfãos`);

    if (orphanedUsers.length === 0) {
      console.log('✅ Nenhum usuário órfão encontrado!');
      return;
    }

    // Mostrar lista de usuários órfãos
    console.log('\n📋 Usuários órfãos encontrados:');
    orphanedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.id}) - Criado em: ${new Date(user.created_at).toLocaleString()}`);
    });

    // 4. Deletar usuários órfãos
    console.log('\n🗑️ Deletando usuários órfãos...');
    let deletedCount = 0;
    let errorCount = 0;

    for (const user of orphanedUsers) {
      try {
        console.log(`🗑️ Deletando usuário: ${user.email} (${user.id})`);
        
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        
        if (error) {
          console.error(`❌ Erro ao deletar ${user.email}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Deletado com sucesso: ${user.email}`);
          deletedCount++;
        }
      } catch (err) {
        console.error(`❌ Exceção ao deletar ${user.email}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n📊 Resumo da limpeza:');
    console.log(`✅ Usuários deletados: ${deletedCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📋 Total de órfãos: ${orphanedUsers.length}`);

    if (errorCount > 0) {
      console.log('\n⚠️ Alguns usuários não puderam ser deletados. Verifique os logs acima.');
    } else {
      console.log('\n🎉 Limpeza concluída com sucesso!');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar limpeza
cleanupOrphanedAuthUsers(); 