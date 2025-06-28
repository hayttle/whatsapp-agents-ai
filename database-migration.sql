-- Migração para adicionar campos de endereço à tabela tenants
-- Execute este script no seu banco Supabase

-- Adicionar campos de endereço à tabela tenants
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS address_street TEXT,
ADD COLUMN IF NOT EXISTS address_number TEXT,
ADD COLUMN IF NOT EXISTS address_complement TEXT,
ADD COLUMN IF NOT EXISTS address_neighborhood TEXT,
ADD COLUMN IF NOT EXISTS address_city TEXT,
ADD COLUMN IF NOT EXISTS address_state TEXT,
ADD COLUMN IF NOT EXISTS address_zip_code TEXT;

-- Adicionar campo whatsapp à tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tenants_cpf_cnpj ON tenants(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_tenants_email ON tenants(email);
CREATE INDEX IF NOT EXISTS idx_users_whatsapp ON users(whatsapp);

-- Adicionar comentários para documentação
COMMENT ON COLUMN tenants.address_street IS 'Rua do endereço da empresa';
COMMENT ON COLUMN tenants.address_number IS 'Número do endereço da empresa';
COMMENT ON COLUMN tenants.address_complement IS 'Complemento do endereço da empresa';
COMMENT ON COLUMN tenants.address_neighborhood IS 'Bairro do endereço da empresa';
COMMENT ON COLUMN tenants.address_city IS 'Cidade do endereço da empresa';
COMMENT ON COLUMN tenants.address_state IS 'Estado do endereço da empresa (2 caracteres)';
COMMENT ON COLUMN tenants.address_zip_code IS 'CEP do endereço da empresa';
COMMENT ON COLUMN users.whatsapp IS 'Número de WhatsApp do usuário'; 