require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSubscriptionPayments() {
  console.log('🔍 Testando tabela subscription_payments...\n');

  try {
    // Teste 1: Verificar estrutura básica
    console.log('1. Verificando estrutura básica...');
    const { data: columns, error: columnsError } = await supabase
      .from('subscription_payments')
      .select('*')
      .limit(1);

    if (columnsError) {
      console.log('❌ Erro ao acessar tabela:', columnsError.message);
    } else {
      console.log('✅ Tabela acessível');
      if (columns && columns.length > 0) {
        console.log('📊 Colunas encontradas:', Object.keys(columns[0]));
      }
    }

    // Teste 2: Tentar inserir dados de teste
    console.log('\n2. Testando inserção de dados...');
    const testData = {
      asaas_payment_id: 'test-payment-' + Date.now(),
      subscription_id: '00000000-0000-0000-0000-000000000000', // UUID inválido para teste
      tenant_id: '00000000-0000-0000-0000-000000000000', // UUID inválido para teste
      value: 100.00,
      net_value: 97.00,
      status: 'PENDING',
      due_date: new Date().toISOString().split('T')[0],
      billing_type: 'BOLETO',
      description: 'Teste de cobrança',
      installment_number: 1,
      installment_count: 1,
    };

    const { data: insertData, error: insertError } = await supabase
      .from('subscription_payments')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      console.log('⚠️  Erro na inserção (pode ser normal se foreign keys não existem):');
      console.log('   ', insertError.message);
      console.log('   ', insertError.details);
    } else {
      console.log('✅ Inserção bem-sucedida');
      console.log('   Dados inseridos:', insertData);
      
      // Limpar dados de teste
      await supabase
        .from('subscription_payments')
        .delete()
        .eq('id', insertData.id);
      console.log('✅ Dados de teste removidos');
    }

    // Teste 3: Verificar dados existentes
    console.log('\n3. Verificando dados existentes...');
    const { data: existingData, error: existingError } = await supabase
      .from('subscription_payments')
      .select('*')
      .limit(5);

    if (existingError) {
      console.log('❌ Erro ao buscar dados existentes:', existingError.message);
    } else {
      console.log(`✅ ${existingData?.length || 0} registros encontrados`);
      if (existingData && existingData.length > 0) {
        console.log('📊 Exemplo de registro:');
        console.log(JSON.stringify(existingData[0], null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
  }
}

testSubscriptionPayments(); 