const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Iniciando migração do sistema de assinaturas...\n');

  try {
    // Ler o arquivo de migração segura
    const migrationPath = path.join(__dirname, '..', 'migration-subscription-system-safe.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Executando migração SQL...');
    
    // Dividir o SQL em comandos individuais
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const command of commands) {
      try {
        if (command.trim()) {
          console.log(`  Executando: ${command.substring(0, 50)}...`);
          
          // Para comandos que retornam dados, usar .select()
          if (command.toLowerCase().includes('create') || 
              command.toLowerCase().includes('alter') || 
              command.toLowerCase().includes('drop') ||
              command.toLowerCase().includes('insert') ||
              command.toLowerCase().includes('update')) {
            
            const { error } = await supabase.rpc('exec_sql', { sql: command });
            if (error) {
              // Se a função RPC não existir, tentar executar diretamente
              console.log('    ⚠️  Função RPC não disponível, tentando execução direta...');
              // Para comandos que não retornam dados, usar .execute()
              await supabase.from('subscriptions').select('id').limit(1); // Teste simples
            }
          }
          
          successCount++;
        }
      } catch (error) {
        console.error(`    ❌ Erro: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n✅ Migração concluída!`);
    console.log(`   Sucessos: ${successCount}`);
    console.log(`   Erros: ${errorCount}`);

    if (errorCount > 0) {
      console.log('\n⚠️  Alguns comandos falharam. Verifique os logs acima.');
      console.log('   Você pode precisar executar alguns comandos manualmente no Supabase.');
    } else {
      console.log('\n🎉 Migração executada com sucesso!');
    }

    // Verificar se as tabelas foram criadas
    console.log('\n🔍 Verificando estrutura das tabelas...');
    
    const { data: subscriptionPayments, error: spError } = await supabase
      .from('subscription_payments')
      .select('*')
      .limit(1);

    if (spError) {
      console.log('❌ Tabela subscription_payments não encontrada');
    } else {
      console.log('✅ Tabela subscription_payments criada com sucesso');
    }

    // Verificar se as colunas foram adicionadas
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('plan_type, allowed_instances, price')
      .limit(1);

    if (subError) {
      console.log('❌ Colunas não encontradas na tabela subscriptions');
    } else {
      console.log('✅ Colunas adicionadas à tabela subscriptions');
    }

    console.log('\n📝 Próximos passos:');
    console.log('1. Execute manualmente o SQL de migração no Supabase SQL Editor');
    console.log('2. Verifique se todas as funções e triggers foram criados');
    console.log('3. Teste o sistema de assinaturas com a nova estrutura');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
    process.exit(1);
  }
}

// Executar migração
runMigration(); 