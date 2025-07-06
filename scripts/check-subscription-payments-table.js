require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSubscriptionPaymentsTable() {
  console.log('🔍 Verificando estrutura da tabela subscription_payments...\n');

  try {
    // 1. Verificar se a tabela existe
    console.log('1. Verificando se a tabela subscription_payments existe...');
    const { data: tableExists, error: tableError } = await supabase
      .from('subscription_payments')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Erro ao acessar tabela subscription_payments:', tableError.message);
      
      if (tableError.message.includes('relation "subscription_payments" does not exist')) {
        console.log('\n📋 A tabela subscription_payments não existe. Crie-a com a seguinte estrutura:');
        console.log(`
CREATE TABLE subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asaas_payment_id TEXT UNIQUE NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  value DECIMAL(10,2) NOT NULL,
  net_value DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  billing_type TEXT,
  description TEXT,
  invoice_url TEXT,
  bank_slip_url TEXT,
  installment_number INTEGER,
  installment_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX idx_subscription_payments_tenant_id ON subscription_payments(tenant_id);
CREATE INDEX idx_subscription_payments_status ON subscription_payments(status);
CREATE INDEX idx_subscription_payments_due_date ON subscription_payments(due_date);
        `);
      }
      return;
    }

    console.log('✅ Tabela subscription_payments existe');

    // 2. Verificar estrutura das colunas
    console.log('\n2. Verificando estrutura das colunas...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'subscription_payments' })
      .catch(() => ({ data: null, error: { message: 'Função get_table_columns não disponível' } }));

    if (columnsError) {
      console.log('⚠️  Não foi possível verificar colunas automaticamente');
      console.log('   Verifique manualmente se todas as colunas necessárias existem:');
      console.log('   - id (UUID, PRIMARY KEY)');
      console.log('   - asaas_payment_id (TEXT, UNIQUE)');
      console.log('   - subscription_id (UUID, FOREIGN KEY)');
      console.log('   - tenant_id (UUID, FOREIGN KEY)');
      console.log('   - value (DECIMAL)');
      console.log('   - net_value (DECIMAL)');
      console.log('   - status (TEXT)');
      console.log('   - due_date (DATE)');
      console.log('   - payment_date (DATE)');
      console.log('   - billing_type (TEXT)');
      console.log('   - description (TEXT)');
      console.log('   - invoice_url (TEXT)');
      console.log('   - bank_slip_url (TEXT)');
      console.log('   - installment_number (INTEGER)');
      console.log('   - installment_count (INTEGER)');
      console.log('   - created_at (TIMESTAMP)');
      console.log('   - updated_at (TIMESTAMP)');
    } else {
      console.log('✅ Estrutura das colunas verificada');
    }

    // 3. Verificar relacionamentos
    console.log('\n3. Verificando relacionamentos...');
    
    // Verificar se a tabela subscriptions existe
    const { data: subscriptionsExists, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('id')
      .limit(1);
    
    if (subscriptionsError) {
      console.error('❌ Erro ao verificar tabela subscriptions:', subscriptionsError.message);
    } else {
      console.log('✅ Tabela subscriptions existe (relacionamento subscription_id)');
    }

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
    const { data: payments, error: dataError } = await supabase
      .from('subscription_payments')
      .select('*')
      .limit(5);

    if (dataError) {
      console.error('❌ Erro ao buscar dados:', dataError.message);
    } else {
      console.log(`✅ Tabela acessível. ${payments?.length || 0} registros encontrados`);
      
      if (payments && payments.length > 0) {
        console.log('\n📊 Exemplo de registro:');
        console.log(JSON.stringify(payments[0], null, 2));
      }
    }

    console.log('\n🎉 Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkSubscriptionPaymentsTable();
}

module.exports = { checkSubscriptionPaymentsTable }; 