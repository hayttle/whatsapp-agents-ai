// Script para verificar a estrutura das tabelas
// Execute com: node scripts/check-table-structure.js

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableStructure() {
  console.log('🔍 Verificando estrutura das tabelas...\n');

  const tables = [
    'users',
    'subscriptions', 
    'whatsapp_instances',
    'agents',
    'prompt_models',
    'subscription_payments'
  ];

  for (const tableName of tables) {
    try {
      console.log(`📋 Tabela: ${tableName}`);
      
      // Verificar se a tabela existe
      const { data: tableExists, error: tableError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (tableError) {
        console.log(`  ❌ Tabela não existe ou erro: ${tableError.message}`);
        continue;
      }

      // Buscar informações das colunas
      const { data: columns, error: columnsError } = await supabase
        .rpc('get_table_columns', { table_name: tableName });

      if (columnsError) {
        // Fallback: tentar buscar diretamente
        console.log(`  ⚠️  Não foi possível buscar colunas via RPC, tentando alternativa...`);
        
        // Buscar uma linha para ver a estrutura
        const { data: sampleData, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (sampleData && sampleData.length > 0) {
          const columnNames = Object.keys(sampleData[0]);
          console.log(`  ✅ Colunas encontradas: ${columnNames.join(', ')}`);
        } else {
          console.log(`  ⚠️  Tabela vazia ou erro ao buscar dados`);
        }
      } else {
        console.log(`  ✅ Colunas: ${columns.map(c => c.column_name).join(', ')}`);
      }

      // Verificar constraints de foreign key
      console.log(`  🔗 Verificando foreign keys...`);
      const { data: constraints, error: constraintsError } = await supabase
        .rpc('get_foreign_keys', { table_name: tableName });

      if (constraintsError) {
        console.log(`    ⚠️  Não foi possível verificar constraints: ${constraintsError.message}`);
      } else if (constraints && constraints.length > 0) {
        constraints.forEach(constraint => {
          console.log(`    - ${constraint.constraint_name}: ${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name} (${constraint.delete_rule})`);
        });
      } else {
        console.log(`    ℹ️  Nenhuma foreign key encontrada`);
      }

      console.log('');

    } catch (error) {
      console.error(`❌ Erro ao verificar tabela ${tableName}:`, error.message);
      console.log('');
    }
  }

  console.log('✅ Verificação concluída!');
}

// Executar verificação
checkTableStructure(); 