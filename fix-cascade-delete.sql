-- =====================================================
-- CORRIGIR CONSTRAINTS PARA EXCLUSÃO EM CASCATA
-- =====================================================

-- 1. Remover constraints existentes que impedem exclusão em cascata
ALTER TABLE subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_tenant_id_fkey;

ALTER TABLE subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_tenant_id_fkey;

-- 2. Recriar constraints com CASCADE DELETE (apenas para tabelas que existem)
ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE users 
ADD CONSTRAINT users_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 3. Verificar e corrigir outras tabelas apenas se existirem

-- Para whatsapp_instances (verificar se existe)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_instances') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_instances' AND column_name = 'tenant_id') THEN
            ALTER TABLE whatsapp_instances DROP CONSTRAINT IF EXISTS whatsapp_instances_tenant_id_fkey;
            ALTER TABLE whatsapp_instances ADD CONSTRAINT whatsapp_instances_tenant_id_fkey 
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Para agents (verificar se existe)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agents') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'tenant_id') THEN
            ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_tenant_id_fkey;
            ALTER TABLE agents ADD CONSTRAINT agents_tenant_id_fkey 
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'user_id') THEN
            ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_user_id_fkey;
            ALTER TABLE agents ADD CONSTRAINT agents_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Para prompt_models (verificar se existe)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prompt_models') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompt_models' AND column_name = 'tenant_id') THEN
            ALTER TABLE prompt_models DROP CONSTRAINT IF EXISTS prompt_models_tenant_id_fkey;
            ALTER TABLE prompt_models ADD CONSTRAINT prompt_models_tenant_id_fkey 
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompt_models' AND column_name = 'user_id') THEN
            ALTER TABLE prompt_models DROP CONSTRAINT IF EXISTS prompt_models_user_id_fkey;
            ALTER TABLE prompt_models ADD CONSTRAINT prompt_models_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Para subscription_payments (verificar se existe)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_payments') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_payments' AND column_name = 'subscription_id') THEN
            ALTER TABLE subscription_payments DROP CONSTRAINT IF EXISTS subscription_payments_subscription_id_fkey;
            ALTER TABLE subscription_payments ADD CONSTRAINT subscription_payments_subscription_id_fkey 
                FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Comentários
COMMENT ON CONSTRAINT subscriptions_tenant_id_fkey ON subscriptions IS 'Foreign key com CASCADE DELETE para tenants';
COMMENT ON CONSTRAINT subscriptions_user_id_fkey ON subscriptions IS 'Foreign key com CASCADE DELETE para users';
COMMENT ON CONSTRAINT users_tenant_id_fkey ON users IS 'Foreign key com CASCADE DELETE para tenants'; 