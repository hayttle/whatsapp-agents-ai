require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateToTrials() {
  console.log('🔄 Iniciando migração para nova estrutura de trials...\n');

  try {
    // 1. Verificar se a tabela trials existe
    console.log('1. Verificando tabela trials...');
    const { data: tableExists, error: tableError } = await supabase
      .from('trials')
      .select('*')
      .limit(1);

    if (tableError && tableError.message.includes('relation "trials" does not exist')) {
      console.error('❌ Tabela trials não existe. Execute primeiro o script create-trials-table.js');
      return;
    }

    console.log('✅ Tabela trials existe\n');

    // 2. Buscar todos os tenants
    console.log('2. Buscando todos os tenants...');
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name, created_at');

    if (tenantsError) {
      console.error('❌ Erro ao buscar tenants:', tenantsError.message);
      return;
    }

    console.log(`📋 Encontrados ${tenants.length} tenants\n`);

    // 3. Para cada tenant, verificar se já tem trial
    let createdTrials = 0;
    let skippedTrials = 0;

    for (const tenant of tenants) {
      console.log(`🔍 Processando tenant: ${tenant.name} (${tenant.id})`);

      // Verificar se já tem trial
      const { data: existingTrial } = await supabase
        .from('trials')
        .select('id')
        .eq('tenant_id', tenant.id)
        .limit(1);

      if (existingTrial && existingTrial.length > 0) {
        console.log(`   ⏭️  Já possui trial, pulando...`);
        skippedTrials++;
        continue;
      }

      // Verificar se tem assinatura paga ativa
      const { data: activeSubscription } = await supabase
        .from('subscriptions')
        .select('id, status')
        .eq('tenant_id', tenant.id)
        .in('status', ['ACTIVE', 'PENDING'])
        .limit(1);

      if (activeSubscription && activeSubscription.length > 0) {
        console.log(`   ⏭️  Possui assinatura paga ativa, pulando...`);
        skippedTrials++;
        continue;
      }

      // Criar trial baseado na data de criação do tenant
      const tenantCreatedAt = new Date(tenant.created_at);
      const now = new Date();
      const daysSinceCreation = Math.floor((now - tenantCreatedAt) / (1000 * 60 * 60 * 24));

      let trialDuration = 7;
      let trialStatus = 'ACTIVE';

      // Se o tenant foi criado há mais de 7 dias, criar trial expirado
      if (daysSinceCreation > 7) {
        trialDuration = 7;
        trialStatus = 'EXPIRED';
      }

      const expiresAt = new Date(tenantCreatedAt);
      expiresAt.setDate(expiresAt.getDate() + trialDuration);

      // Criar trial
      const { data: trial, error: trialError } = await supabase
        .from('trials')
        .insert({
          tenant_id: tenant.id,
          started_at: tenantCreatedAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          status: trialStatus
        })
        .select()
        .single();

      if (trialError) {
        console.error(`   ❌ Erro ao criar trial:`, trialError.message);
        continue;
      }

      console.log(`   ✅ Trial criado: ${trialStatus} (expira em ${expiresAt.toLocaleDateString('pt-BR')})`);
      createdTrials++;
    }

    console.log('\n📊 Resumo da migração:');
    console.log(`   • Total de tenants: ${tenants.length}`);
    console.log(`   • Trials criados: ${createdTrials}`);
    console.log(`   • Trials pulados: ${skippedTrials}`);
    console.log('\n✅ Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante migração:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  migrateToTrials();
}

module.exports = { migrateToTrials }; 