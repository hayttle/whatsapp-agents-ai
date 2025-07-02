// Script para criar um usuário super_admin inicial
// Execute com: node create-super-admin.js

// Carregar variáveis de ambiente do Next.js
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas');
  console.log('Verifique se existe um arquivo .env.local ou .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSuperAdmin() {
  try {
    // Verificar se já existe um super_admin
    const { data: existingSuperAdmin, error: checkError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('role', 'super_admin')
      .limit(1);

    if (checkError) {
      console.error('❌ Erro ao verificar super_admin existente:', checkError);
      return;
    }

    if (existingSuperAdmin && existingSuperAdmin.length > 0) {
      return;
    }

    // Dados do super_admin
    const superAdminData = {
      email: 'admin@whatsapp-agent-ai.com',
      password: 'admin123456',
      name: 'Super Administrador',
      role: 'super_admin'
    };

    // 1. Criar usuário no Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: superAdminData.email,
      password: superAdminData.password,
      email_confirm: true,
    });

    if (authError || !authUser?.user) {
      return;
    }

    // 2. Inserir dados do usuário na tabela users
    const userData = {
      id: authUser.user.id,
      email: superAdminData.email,
      name: superAdminData.name,
      role: superAdminData.role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (dbError) {
      // Tentar deletar o usuário do Auth se falhou na tabela
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return;
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar criação
createSuperAdmin(); 