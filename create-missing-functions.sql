-- =====================================================
-- CRIAR FUNÇÕES QUE ESTÃO FALTANDO NO BANCO DE DADOS
-- =====================================================

-- Remover trigger primeiro (se existir)
DROP TRIGGER IF EXISTS trigger_update_allowed_instances ON subscriptions;

-- Remover funções existentes se existirem
DROP FUNCTION IF EXISTS calculate_allowed_instances(TEXT, NUMERIC);
DROP FUNCTION IF EXISTS calculate_allowed_instances(TEXT, INTEGER);
DROP FUNCTION IF EXISTS update_allowed_instances();

-- Função para calcular allowed_instances
CREATE OR REPLACE FUNCTION calculate_allowed_instances(
  p_plan_type TEXT,
  p_quantity NUMERIC
) RETURNS INTEGER AS $$
BEGIN
  RETURN CASE p_plan_type
    WHEN 'starter' THEN 2 * p_quantity::INTEGER
    WHEN 'pro' THEN 5 * p_quantity::INTEGER
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para atualizar allowed_instances
CREATE OR REPLACE FUNCTION update_allowed_instances()
RETURNS TRIGGER AS $$
BEGIN
  NEW.allowed_instances = calculate_allowed_instances(NEW.plan_type, NEW.quantity);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger
CREATE TRIGGER trigger_update_allowed_instances
  BEFORE INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_allowed_instances();

-- Comentários
COMMENT ON FUNCTION calculate_allowed_instances(TEXT, NUMERIC) IS 'Calcula instâncias permitidas baseado no tipo de plano e quantidade';
COMMENT ON FUNCTION update_allowed_instances() IS 'Trigger function para atualizar allowed_instances automaticamente'; 