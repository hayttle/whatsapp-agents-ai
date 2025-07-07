require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTrialsTable() {
  console.log('🔍 Criando tabela trials...\n');

  try {
    // 1. Verificar se a tabela já existe
    console.log('1. Verificando se a tabela trials existe...');
    const { data: tableExists, error: tableError } = await supabase
      .from('trials')
      .select('*')
      .limit(1);

    if (!tableError) {
      console.log('✅ Tabela trials já existe');
      return;
    }

    if (tableError.message.includes('relation "trials" does not exist')) {
      console.log('📋 A tabela trials não existe. Execute o seguinte SQL:');
      console.log(`
CREATE TABLE trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX idx_trials_tenant_id ON trials(tenant_id);
CREATE INDEX idx_trials_status ON trials(status);
CREATE INDEX idx_trials_expires_at ON trials(expires_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_trials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_trials_updated_at
  BEFORE UPDATE ON trials
  FOR EACH ROW
  EXECUTE FUNCTION update_trials_updated_at();
      `);
    } else {
      console.error('❌ Erro ao verificar tabela trials:', tableError.message);
    }

  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createTrialsTable();
}

module.exports = { createTrialsTable }; 