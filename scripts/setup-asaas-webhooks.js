const fetch = require('node-fetch');

const ASAAS_API_URL = process.env.ASAAS_API_URL;
const ASAAS_API_TOKEN = process.env.ASAAS_API_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://your-domain.com/api/webhooks/asaas';
const WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN || 'your-webhook-token';

async function setupWebhooks() {
  if (!ASAAS_API_URL || !ASAAS_API_TOKEN) {
    console.error('❌ Variáveis de ambiente ASAAS_API_URL e ASAAS_API_TOKEN são obrigatórias');
    process.exit(1);
  }

  if (!WEBHOOK_URL.includes('your-domain.com')) {
    console.error('❌ Configure a variável WEBHOOK_URL com sua URL real');
    process.exit(1);
  }

  console.log('🚀 Configurando webhooks do Asaas...\n');

  try {
    // 1. Listar webhooks existentes
    console.log('📋 Listando webhooks existentes...');
    const listResponse = await fetch(`${ASAAS_API_URL}/webhooks`, {
      headers: {
        'Authorization': `Bearer ${ASAAS_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!listResponse.ok) {
      throw new Error(`Erro ao listar webhooks: ${listResponse.status} ${listResponse.statusText}`);
    }

    const existingWebhooks = await listResponse.json();
    console.log(`✅ Encontrados ${existingWebhooks.data?.length || 0} webhooks existentes`);

    // 2. Deletar webhooks existentes (opcional)
    if (existingWebhooks.data && existingWebhooks.data.length > 0) {
      console.log('\n🗑️  Deletando webhooks existentes...');
      for (const webhook of existingWebhooks.data) {
        await fetch(`${ASAAS_API_URL}/webhooks/${webhook.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${ASAAS_API_TOKEN}`,
          },
        });
        console.log(`   ✅ Deletado webhook: ${webhook.id}`);
      }
    }

    // 3. Criar novo webhook
    console.log('\n➕ Criando novo webhook...');
    const webhookData = {
      url: WEBHOOK_URL,
      email: 'webhook@whatsapp-agent-ai.com',
      apiVersion: 'v3',
      enabled: true,
      interrupted: false,
      events: [
        'SUBSCRIPTION_CREATED',
        'SUBSCRIPTION_UPDATED', 
        'SUBSCRIPTION_INACTIVATED',
        'PAYMENT_CREATED',
        'PAYMENT_RECEIVED',
        'PAYMENT_OVERDUE',
        'PAYMENT_DELETED',
        'PAYMENT_RESTORED',
        'PAYMENT_REFUNDED',
        'PAYMENT_RECEIVED_LATE',
        'PAYMENT_CONFIRMED',
        'PAYMENT_ANTICIPATED',
      ],
    };

    const createResponse = await fetch(`${ASAAS_API_URL}/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ASAAS_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(`Erro ao criar webhook: ${createResponse.status} ${createResponse.statusText} - ${JSON.stringify(errorData)}`);
    }

    const newWebhook = await createResponse.json();
    console.log('✅ Webhook criado com sucesso!');
    console.log(`   ID: ${newWebhook.id}`);
    console.log(`   URL: ${newWebhook.url}`);
    console.log(`   Status: ${newWebhook.enabled ? 'Ativo' : 'Inativo'}`);

    // 4. Configurar token de acesso
    console.log('\n🔑 Configurando token de acesso...');
    console.log(`   Token: ${WEBHOOK_TOKEN}`);
    console.log('   ⚠️  Certifique-se de configurar a variável ASAAS_WEBHOOK_TOKEN no seu .env');

    // 5. Testar webhook
    console.log('\n🧪 Testando webhook...');
    const testResponse = await fetch(`${ASAAS_API_URL}/webhooks/${newWebhook.id}/test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ASAAS_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'PAYMENT_RECEIVED',
        payment: {
          id: 'test-payment-id',
          subscription: 'test-subscription-id',
          status: 'RECEIVED',
          value: 100.00,
          billingType: 'CREDIT_CARD',
          dueDate: new Date().toISOString().split('T')[0],
        },
      }),
    });

    if (testResponse.ok) {
      console.log('✅ Teste de webhook enviado com sucesso!');
    } else {
      console.log('⚠️  Teste de webhook falhou (isso é normal se o servidor não estiver rodando)');
    }

    console.log('\n🎉 Configuração de webhooks concluída!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Configure a variável ASAAS_WEBHOOK_TOKEN no seu .env');
    console.log('   2. Certifique-se de que sua aplicação está rodando e acessível');
    console.log('   3. Teste o webhook fazendo um pagamento de teste');
    console.log('   4. Monitore os logs da aplicação para verificar se os webhooks estão chegando');

  } catch (error) {
    console.error('❌ Erro ao configurar webhooks:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupWebhooks();
}

module.exports = { setupWebhooks }; 