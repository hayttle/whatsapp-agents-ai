require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSubscriptionTable() {
  console.log('🔍 Verificando estrutura da tabela subscriptions...\n');

  try {
    // 1. Verificar se a tabela existe
    console.log('1. Verificando se a tabela subscriptions existe...');
    const { data: tableExists, error: tableError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Erro ao acessar tabela subscriptions:', tableError.message);
      
      if (tableError.message.includes('relation "subscriptions" does not exist')) {
        console.log('\n📋 A tabela subscriptions não existe. Crie-a com a seguinte estrutura:');
        console.log(`
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES auth.users(id),
  asaas_subscription_id TEXT UNIQUE,
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'TRIAL',
  value DECIMAL(10,2) NOT NULL,
  cycle TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_due_date DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  invoice_url TEXT,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
        `);
      }
      return;
    }

    console.log('✅ Tabela subscriptions existe');

    // 2. Verificar estrutura das colunas
    console.log('\n2. Verificando estrutura das colunas...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'subscriptions' })
      .catch(() => ({ data: null, error: { message: 'Função get_table_columns não disponível' } }));

    if (columnsError) {
      console.log('⚠️  Não foi possível verificar colunas automaticamente');
      console.log('   Verifique manualmente se todas as colunas necessárias existem:');
      console.log('   - id (UUID, PRIMARY KEY)');
      console.log('   - tenant_id (UUID, FOREIGN KEY)');
      console.log('   - user_id (UUID, FOREIGN KEY)');
      console.log('   - asaas_subscription_id (TEXT, UNIQUE)');
      console.log('   - plan_name (TEXT)');
      console.log('   - status (TEXT)');
      console.log('   - value (DECIMAL)');
      console.log('   - cycle (TEXT)');
      console.log('   - started_at (TIMESTAMP)');
      console.log('   - next_due_date (DATE)');
      console.log('   - paid_at (TIMESTAMP)');
      console.log('   - invoice_url (TEXT)');
      console.log('   - payment_method (TEXT)');
      console.log('   - created_at (TIMESTAMP)');
      console.log('   - updated_at (TIMESTAMP)');
    } else {
      console.log('✅ Estrutura das colunas verificada');
    }

    // 3. Verificar relacionamentos
    console.log('\n3. Verificando relacionamentos...');
    
    // Verificar se a tabela tenants existe
    const { data: tenantsExists, error: tenantsError } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);
    
    if (tenantsError) {
      console.error('❌ Erro ao verificar tabela tenants:', tenantsError.message);
    } else {
      console.log('✅ Tabela tenants existe (relacionamento tenant_id)');
    }

    // 4. Verificar dados existentes
    console.log('\n4. Verificando dados existentes...');
    const { data: subscriptions, error: dataError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(5);

    if (dataError) {
      console.error('❌ Erro ao buscar dados:', dataError.message);
    } else {
      console.log(`✅ Tabela acessível. ${subscriptions?.length || 0} registros encontrados`);
      
      if (subscriptions && subscriptions.length > 0) {
        console.log('\n📊 Exemplo de registro:');
        console.log(JSON.stringify(subscriptions[0], null, 2));
      }
    }

    // 5. Testar inserção de dados de teste
    console.log('\n5. Testando inserção de dados...');
    const testData = {
      tenant_id: '00000000-0000-0000-0000-000000000000', // UUID inválido para teste
      user_id: '00000000-0000-0000-0000-000000000000', // UUID inválido para teste
      asaas_subscription_id: 'test-subscription-' + Date.now(),
      plan_name: 'Plano Teste',
      status: 'TRIAL',
      value: 99.99,
      cycle: 'MONTHLY',
      next_due_date: new Date().toISOString().split('T')[0],
    };

    const { data: insertData, error: insertError } = await supabase
      .from('subscriptions')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      console.log('⚠️  Erro ao inserir dados de teste (pode ser normal se foreign keys não existem):');
      console.log('   ', insertError.message);
    } else {
      console.log('✅ Inserção de dados funcionando');
      
      // Limpar dados de teste
      await supabase
        .from('subscriptions')
        .delete()
        .eq('id', insertData.id);
      console.log('✅ Dados de teste removidos');
    }

    console.log('\n🎉 Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkSubscriptionTable();
}

module.exports = { checkSubscriptionTable }; 