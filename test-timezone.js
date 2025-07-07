require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTimezone() {
  console.log('🔍 Testando timezone...\n');

  try {
    // Teste 1: Verificar configuração do banco
    console.log('1. Verificando configuração do banco...');
    const { data: config, error: configError } = await supabase
      .rpc('get_timezone')
      .catch(() => ({ data: null, error: { message: 'Função não disponível' } }));

    if (configError) {
      console.log('⚠️  Não foi possível verificar timezone do banco');
    } else {
      console.log('✅ Timezone do banco:', config);
    }

    // Teste 2: Tentar inserir com data
    console.log('\n2. Testando inserção com data...');
    const testData = {
      tenant_id: '00000000-0000-0000-0000-000000000000',
      plan_name: 'Teste Timezone',
      plan_type: 'starter',
      quantity: 1,
      status: 'PENDING',
      value: 99.99,
    };

    const { data: insertData, error: insertError } = await supabase
      .from('subscriptions')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Erro na inserção:');
      console.log('   ', insertError.message);
      console.log('   ', insertError.details);
      console.log('   ', insertError.hint);
    } else {
      console.log('✅ Inserção bem-sucedida');
      console.log('   Dados inseridos:', insertData);
      
      // Limpar dados de teste
      await supabase
        .from('subscriptions')
        .delete()
        .eq('id', insertData.id);
      console.log('✅ Dados de teste removidos');
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
  }
}

testTimezone(); 