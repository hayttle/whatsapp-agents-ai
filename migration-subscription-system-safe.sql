-- =====================================================
-- MIGRAÇÃO SEGURA: Sistema de Assinaturas com Pacotes
-- =====================================================
-- Esta versão pode ser executada múltiplas vezes sem erros

-- =====================================================
-- 1. CRIAR TABELA SUBSCRIPTION_PAYMENTS (se não existir)
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL,
  payment_id TEXT NOT NULL,
  invoice_url TEXT,
  payment_method TEXT,
  amount DECIMAL(10,2) NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT fk_subscription_payments_subscription 
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
  CONSTRAINT check_subscription_payments_status 
    CHECK (status IN ('PENDING', 'CONFIRMED', 'RECEIVED', 'OVERDUE', 'REFUNDED', 'RECEIVED_IN_CASH', 'REFUND_REQUESTED', 'CHARGEBACK_REQUESTED', 'CHARGEBACK_DISPUTE', 'AWAITING_CHARGEBACK_REVERSAL', 'DUNNING_REQUESTED', 'DUNNING_RECEIVED', 'AWAITING_RISK_ANALYSIS'))
);

-- Índices para performance (se não existirem)
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_payment_id ON subscription_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_paid_at ON subscription_payments(paid_at);

-- =====================================================
-- 2. ADICIONAR COLUNAS À TABELA SUBSCRIPTIONS
-- =====================================================

-- Adicionar plan_type se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' AND column_name = 'plan_type'
    ) THEN
        ALTER TABLE subscriptions ADD COLUMN plan_type TEXT;
    END IF;
END $$;

-- Adicionar allowed_instances se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' AND column_name = 'allowed_instances'
    ) THEN
        ALTER TABLE subscriptions ADD COLUMN allowed_instances INTEGER DEFAULT 0;
    END IF;
END $$;

-- Adicionar price se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' AND column_name = 'price'
    ) THEN
        ALTER TABLE subscriptions ADD COLUMN price DECIMAL(10,2);
    END IF;
END $$;

-- =====================================================
-- 3. ATUALIZAR DADOS EXISTENTES
-- =====================================================

-- Atualizar dados existentes baseado no plan_name
UPDATE subscriptions 
SET 
  plan_type = CASE 
    WHEN plan_name ILIKE '%starter%' THEN 'starter'
    WHEN plan_name ILIKE '%pro%' THEN 'pro'
    ELSE 'custom'
  END,
  allowed_instances = CASE 
    WHEN plan_name ILIKE '%starter%' THEN 2 * COALESCE(quantity, 1)
    WHEN plan_name ILIKE '%pro%' THEN 5 * COALESCE(quantity, 1)
    ELSE 0
  END,
  price = value
WHERE plan_type IS NULL;

-- =====================================================
-- 4. TORNAR COLUNAS OBRIGATÓRIAS
-- =====================================================

-- Tornar plan_type obrigatório se ainda não for
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'plan_type' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE subscriptions ALTER COLUMN plan_type SET NOT NULL;
    END IF;
END $$;

-- Tornar allowed_instances obrigatório se ainda não for
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'allowed_instances' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE subscriptions ALTER COLUMN allowed_instances SET NOT NULL;
    END IF;
END $$;

-- Tornar price obrigatório se ainda não for
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'price' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE subscriptions ALTER COLUMN price SET NOT NULL;
    END IF;
END $$;

-- =====================================================
-- 5. ADICIONAR CONSTRAINT
-- =====================================================

-- Adicionar constraint para plan_type (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_subscription_plan_type'
    ) THEN
        ALTER TABLE subscriptions 
        ADD CONSTRAINT check_subscription_plan_type 
        CHECK (plan_type IN ('starter', 'pro', 'custom'));
    END IF;
END $$;

-- =====================================================
-- 6. CRIAR FUNÇÕES
-- =====================================================

-- Função para calcular allowed_instances
CREATE OR REPLACE FUNCTION calculate_allowed_instances(
  p_plan_type TEXT,
  p_quantity INTEGER
) RETURNS INTEGER AS $$
BEGIN
  RETURN CASE p_plan_type
    WHEN 'starter' THEN 2 * p_quantity
    WHEN 'pro' THEN 5 * p_quantity
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

-- Função para verificar limite de instâncias
CREATE OR REPLACE FUNCTION check_instance_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  allowed_count INTEGER;
BEGIN
  -- Buscar limite permitido pela assinatura ativa
  SELECT s.allowed_instances INTO allowed_count
  FROM subscriptions s
  WHERE s.tenant_id = NEW.tenant_id
    AND s.status IN ('TRIAL', 'ACTIVE')
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  -- Se não há assinatura ativa, não permitir
  IF allowed_count IS NULL THEN
    RAISE EXCEPTION 'No active subscription found for tenant %', NEW.tenant_id;
  END IF;
  
  -- Contar instâncias atuais do tenant
  SELECT COUNT(*) INTO current_count
  FROM whatsapp_instances
  WHERE tenant_id = NEW.tenant_id;
  
  -- Se já atingiu o limite, não permitir
  IF current_count >= allowed_count THEN
    RAISE EXCEPTION 'Instance limit reached. Allowed: %, Current: %', allowed_count, current_count;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. CRIAR TRIGGERS
-- =====================================================

-- Trigger para atualizar allowed_instances
DROP TRIGGER IF EXISTS trigger_update_allowed_instances ON subscriptions;
CREATE TRIGGER trigger_update_allowed_instances
  BEFORE INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_allowed_instances();

-- Trigger para verificar limite ao criar instância
DROP TRIGGER IF EXISTS trigger_check_instance_limit ON whatsapp_instances;
CREATE TRIGGER trigger_check_instance_limit
  BEFORE INSERT ON whatsapp_instances
  FOR EACH ROW
  EXECUTE FUNCTION check_instance_limit();

-- =====================================================
-- 8. CRIAR VIEWS
-- =====================================================

-- View para estatísticas de uso por tenant
CREATE OR REPLACE VIEW tenant_usage_stats AS
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  t.email as tenant_email,
  COALESCE(s.plan_type, 'none') as current_plan,
  COALESCE(s.quantity, 0) as plan_quantity,
  COALESCE(s.allowed_instances, 0) as allowed_instances,
  COALESCE(wi.instance_count, 0) as current_instances,
  COALESCE(s.allowed_instances, 0) - COALESCE(wi.instance_count, 0) as remaining_instances,
  s.status as subscription_status,
  s.next_due_date,
  s.price as monthly_price
FROM tenants t
LEFT JOIN (
  SELECT 
    tenant_id,
    plan_type,
    quantity,
    allowed_instances,
    status,
    next_due_date,
    price,
    ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at DESC) as rn
  FROM subscriptions
  WHERE status IN ('TRIAL', 'ACTIVE')
) s ON t.id = s.tenant_id AND s.rn = 1
LEFT JOIN (
  SELECT 
    tenant_id,
    COUNT(*) as instance_count
  FROM whatsapp_instances
  GROUP BY tenant_id
) wi ON t.id = wi.tenant_id;

-- View para histórico de pagamentos
CREATE OR REPLACE VIEW subscription_payment_history AS
SELECT 
  sp.id,
  sp.payment_id,
  sp.amount,
  sp.status,
  sp.payment_method,
  sp.paid_at,
  sp.invoice_url,
  sp.created_at,
  s.plan_type,
  s.quantity,
  t.name as tenant_name,
  t.email as tenant_email
FROM subscription_payments sp
JOIN subscriptions s ON sp.subscription_id = s.id
JOIN tenants t ON s.tenant_id = t.id
ORDER BY sp.created_at DESC;

-- =====================================================
-- 9. CRIAR FUNÇÕES DE UTILIDADE
-- =====================================================

-- Função para obter estatísticas de uso de um tenant
CREATE OR REPLACE FUNCTION get_tenant_usage_stats(p_tenant_id UUID)
RETURNS TABLE(
  tenant_id UUID,
  tenant_name TEXT,
  current_plan TEXT,
  plan_quantity INTEGER,
  allowed_instances INTEGER,
  current_instances BIGINT,
  remaining_instances INTEGER,
  subscription_status TEXT,
  next_due_date DATE,
  monthly_price DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    COALESCE(s.plan_type, 'none'),
    COALESCE(s.quantity, 0),
    COALESCE(s.allowed_instances, 0),
    COALESCE(wi.instance_count, 0),
    COALESCE(s.allowed_instances, 0) - COALESCE(wi.instance_count, 0),
    s.status,
    s.next_due_date,
    s.price
  FROM tenants t
  LEFT JOIN (
    SELECT 
      tenant_id,
      plan_type,
      quantity,
      allowed_instances,
      status,
      next_due_date,
      price
    FROM subscriptions
    WHERE tenant_id = p_tenant_id
      AND status IN ('TRIAL', 'ACTIVE')
    ORDER BY created_at DESC
    LIMIT 1
  ) s ON t.id = s.tenant_id
  LEFT JOIN (
    SELECT 
      tenant_id,
      COUNT(*) as instance_count
    FROM whatsapp_instances
    WHERE tenant_id = p_tenant_id
    GROUP BY tenant_id
  ) wi ON t.id = wi.tenant_id
  WHERE t.id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar pagamento
CREATE OR REPLACE FUNCTION register_subscription_payment(
  p_subscription_id UUID,
  p_payment_id TEXT,
  p_amount DECIMAL(10,2),
  p_status TEXT DEFAULT 'PENDING',
  p_payment_method TEXT DEFAULT NULL,
  p_invoice_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  payment_record_id UUID;
BEGIN
  INSERT INTO subscription_payments (
    subscription_id,
    payment_id,
    amount,
    status,
    payment_method,
    invoice_url,
    paid_at
  ) VALUES (
    p_subscription_id,
    p_payment_id,
    p_amount,
    p_status,
    p_payment_method,
    p_invoice_url,
    CASE WHEN p_status IN ('CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH') THEN NOW() ELSE NULL END
  ) RETURNING id INTO payment_record_id;
  
  -- Se o pagamento foi confirmado, atualizar a assinatura
  IF p_status IN ('CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH') THEN
    UPDATE subscriptions 
    SET 
      status = 'ACTIVE',
      paid_at = NOW(),
      updated_at = NOW()
    WHERE id = p_subscription_id;
  END IF;
  
  RETURN payment_record_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. CRIAR ÍNDICES ADICIONAIS
-- =====================================================

-- Índices para performance em consultas frequentes
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_status ON subscriptions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_due_date ON subscriptions(next_due_date);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_tenant_id ON whatsapp_instances(tenant_id);

-- =====================================================
-- FIM DA MIGRAÇÃO SEGURA
-- ===================================================== 