-- Script para criar a tabela users se ela não existir
-- Execute este script no seu banco de dados Supabase

-- Verificar se a tabela users existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Criar a tabela users
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
            tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
        );

        -- Criar índices
        CREATE INDEX idx_users_email ON users(email);
        CREATE INDEX idx_users_tenant_id ON users(tenant_id);
        CREATE INDEX idx_users_role ON users(role);

        -- Habilitar RLS (Row Level Security)
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;

        -- Criar políticas RLS
        CREATE POLICY "Users can view their own data" ON users
            FOR SELECT USING (auth.uid() = id);

        CREATE POLICY "Users can update their own data" ON users
            FOR UPDATE USING (auth.uid() = id);

        CREATE POLICY "Admins can view all users" ON users
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'super_admin')
                )
            );

        CREATE POLICY "Super admins can manage all users" ON users
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role = 'super_admin'
                )
            );

        RAISE NOTICE 'Tabela users criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela users já existe.';
    END IF;
END $$;

-- Verificar a estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position; 