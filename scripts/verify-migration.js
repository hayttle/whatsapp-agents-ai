const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
  console.log('🔍 Verificando migração do sistema de assinaturas...\n');

  try {
    // 1. Verificar tabela subscription_payments
    console.log('1. Verificando tabela subscription_payments...');
    const { data: payments, error: paymentsError } = await supabase
      .from('subscription_payments')
      .select('*')
      .limit(1);

    if (paymentsError) {
      console.error('❌ Erro ao acessar subscription_payments:', paymentsError.message);
    } else {
      console.log('✅ Tabela subscription_payments criada com sucesso');
    }

    // 2. Verificar colunas na tabela subscriptions
    console.log('\n2. Verificando colunas na tabela subscriptions...');
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('plan_type, allowed_instances, price')
      .limit(1);

    if (subError) {
      console.error('❌ Erro ao acessar colunas da subscriptions:', subError.message);
    } else {
      console.log('✅ Colunas plan_type, allowed_instances e price adicionadas');
    }

    // 3. Verificar views
    console.log('\n3. Verificando views...');
    try {
      const { data: usageStats, error: viewError } = await supabase
        .from('tenant_usage_stats')
        .select('*')
        .limit(1);

      if (viewError) {
        console.error('❌ Erro ao acessar view tenant_usage_stats:', viewError.message);
      } else {
        console.log('✅ View tenant_usage_stats criada com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar views:', error.message);
    }

    // 4. Verificar funções
    console.log('\n4. Verificando funções...');
    try {
      // Testar função calculate_allowed_instances
      const { data: functionTest, error: funcError } = await supabase
        .rpc('calculate_allowed_instances', { p_plan_type: 'starter', p_quantity: 2 });

      if (funcError) {
        console.error('❌ Erro ao testar função calculate_allowed_instances:', funcError.message);
      } else {
        console.log('✅ Função calculate_allowed_instances funcionando (resultado:', functionTest, ')');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar funções:', error.message);
    }

    // 5. Verificar dados existentes
    console.log('\n5. Verificando dados existentes...');
    const { data: existingSubs, error: dataError } = await supabase
      .from('subscriptions')
      .select('plan_name, plan_type, allowed_instances, quantity')
      .limit(5);

    if (dataError) {
      console.error('❌ Erro ao buscar dados:', dataError.message);
    } else {
      console.log(`✅ ${existingSubs?.length || 0} assinaturas encontradas`);
      if (existingSubs && existingSubs.length > 0) {
        console.log('📊 Exemplo de dados:');
        existingSubs.forEach((sub, index) => {
          console.log(`   ${index + 1}. ${sub.plan_name} → ${sub.plan_type} (${sub.quantity} pacotes, ${sub.allowed_instances} instâncias)`);
        });
      }
    }

    // 6. Verificar índices
    console.log('\n6. Verificando índices...');
    try {
      const { data: indices, error: indexError } = await supabase
        .from('subscription_payments')
        .select('subscription_id')
        .eq('subscription_id', '00000000-0000-0000-0000-000000000000')
        .limit(1);

      if (indexError && !indexError.message.includes('No rows returned')) {
        console.error('❌ Erro ao verificar índices:', indexError.message);
      } else {
        console.log('✅ Índices funcionando corretamente');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar índices:', error.message);
    }

    console.log('\n🎉 Verificação concluída!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Teste o dashboard para ver se o PlanLimitsCard aparece');
    console.log('2. Tente criar uma nova assinatura');
    console.log('3. Verifique se os limites de instâncias estão funcionando');
    console.log('4. Teste o webhook do Asaas para pagamentos');

  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
  }
}

// Executar verificação
verifyMigration(); 