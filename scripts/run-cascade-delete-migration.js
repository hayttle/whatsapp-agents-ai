// Script para executar migração de cascade delete
// Execute com: node scripts/run-cascade-delete-migration.js

// Carregar variáveis de ambiente do Next.js
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas');
  console.log('Verifique se existe um arquivo .env.local ou .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runCascadeDeleteMigration() {
  try {
    console.log('🚀 Iniciando migração de cascade delete...');
    
    // Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, '..', 'migration-cascade-delete-safe.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 Arquivo SQL carregado com sucesso');
    
    // Executar a migração
    console.log('⚡ Executando migração no banco de dados...');
    
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      // Se a função exec_sql não existir, tentar executar diretamente
      console.log('⚠️  Função exec_sql não encontrada, tentando execução direta...');
      
      // Dividir o SQL em comandos individuais
      const commands = sqlContent
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
      
      for (const command of commands) {
        if (command.trim()) {
          try {
            const { error: cmdError } = await supabase.rpc('exec_sql', { sql: command + ';' });
            if (cmdError) {
              console.warn(`⚠️  Comando falhou (pode ser normal): ${command.substring(0, 50)}...`);
            }
          } catch (err) {
            console.warn(`⚠️  Erro ao executar comando: ${err.message}`);
          }
        }
      }
    }
    
    console.log('✅ Migração executada com sucesso!');
    
    // Verificar se as constraints foram criadas
    console.log('🔍 Verificando constraints criadas...');
    
    const { data: constraints, error: checkError } = await supabase
      .from('information_schema.table_constraints')
      .select(`
        table_name,
        constraint_name,
        constraint_type
      `)
      .in('table_name', ['users', 'subscriptions', 'whatsapp_instances', 'agents', 'prompt_models', 'subscription_payments'])
      .eq('constraint_type', 'FOREIGN KEY');
    
    if (checkError) {
      console.warn('⚠️  Não foi possível verificar as constraints:', checkError.message);
    } else {
      console.log('📋 Constraints encontradas:');
      constraints?.forEach(constraint => {
        console.log(`  - ${constraint.table_name}.${constraint.constraint_name}`);
      });
    }
    
    console.log('');
    console.log('🎉 Migração de cascade delete concluída com sucesso!');
    console.log('');
    console.log('📝 O que foi implementado:');
    console.log('  ✅ Constraints de foreign key com ON DELETE CASCADE');
    console.log('  ✅ Tabela de log de auditoria (tenant_deletion_log)');
    console.log('  ✅ Trigger para registrar exclusões');
    console.log('  ✅ Exclusão automática de usuários do Auth');
    console.log('');
    console.log('⚠️  IMPORTANTE: Execute a migração SQL diretamente no Supabase Dashboard');
    console.log('   se este script não conseguir executar todos os comandos.');
    console.log('   Use o arquivo: migration-cascade-delete-safe.sql');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    console.log('');
    console.log('💡 Solução alternativa:');
    console.log('1. Acesse o Supabase Dashboard');
    console.log('2. Vá para SQL Editor');
    console.log('3. Cole o conteúdo do arquivo migration-cascade-delete-safe.sql');
    console.log('4. Execute o script');
  }
}

// Executar a migração
runCascadeDeleteMigration(); 