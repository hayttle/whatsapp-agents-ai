import { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateCPF, validateCNPJ } from '@/lib/utils';

interface SignupRequest {
  company: {
    type: 'FISICA' | 'JURIDICA';
    name: string;
    cpf_cnpj: string;
    email: string;
    phone: string;
    address: {
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
      zip_code: string;
    };
  };
  user: {
    full_name: string;
    email: string;
    whatsapp: string;
    password: string;
    confirm_password: string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { company, user }: SignupRequest = req.body;

    // Validações básicas
    if (!company || !user) {
      return res.status(400).json({ error: 'Dados da empresa e usuário são obrigatórios.' });
    }

    // Validar documento da empresa
    const isDocumentValid = company.type === 'FISICA' 
      ? validateCPF(company.cpf_cnpj)
      : validateCNPJ(company.cpf_cnpj);

    if (!isDocumentValid) {
      return res.status(400).json({ 
        error: company.type === 'FISICA' ? 'CPF inválido' : 'CNPJ inválido' 
      });
    }

    // Criar clientes Supabase
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return Object.entries(req.cookies).map(([name, value]) => ({ name, value: value || '' }));
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`);
            });
          },
        },
      }
    );

    const adminClient = createAdminClient();

    // 1. Criar usuário no Supabase Auth
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    });

    if (authError || !authUser?.user) {
      // Verificar se é erro de email já existente
      if (authError?.message?.includes('already been registered')) {
        return res.status(422).json({ 
          error: 'Este email já está registrado no sistema. Tente usar um email diferente.' 
        });
      }
      
      // Verificar se é erro de email inválido
      if (authError?.message?.includes('Invalid email')) {
        return res.status(400).json({ 
          error: 'Email inválido. Verifique o formato do email.' 
        });
      }
      
      // Verificar se é erro de senha fraca
      if (authError?.message?.includes('Password should be at least')) {
        return res.status(400).json({ 
          error: 'A senha deve ter pelo menos 6 caracteres.' 
        });
      }
      
      return res.status(500).json({ 
        error: 'Erro ao criar usuário no Auth: ' + (authError?.message || 'Erro desconhecido') 
      });
    }

    // 2. Criar empresa (tenant) no banco
    const tenantData: Record<string, string | undefined> = {
      name: company.name,
      email: company.email,
      cpf_cnpj: company.cpf_cnpj.replace(/\D/g, ''), // Remove formatação
      phone: company.phone.replace(/\D/g, ''), // Remove formatação
      type: company.type,
      status: 'ATIVO',
    };

    // Adicionar campos de endereço se existirem na tabela
    // (após executar a migração database-migration.sql)
    try {
      tenantData.address_street = company.address.street;
      tenantData.address_number = company.address.number;
      tenantData.address_complement = company.address.complement;
      tenantData.address_neighborhood = company.address.neighborhood;
      tenantData.address_city = company.address.city;
      tenantData.address_state = company.address.state;
      tenantData.address_zip_code = company.address.zip_code.replace(/\D/g, '');
    } catch {
      // Se os campos não existirem, continuar sem eles
    }

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert(tenantData)
      .select()
      .single();

    if (tenantError) {
      // Se falhar ao criar tenant, deletar o usuário do Auth
      await adminClient.auth.admin.deleteUser(authUser.user.id);
      return res.status(500).json({ 
        error: 'Erro ao criar empresa: ' + tenantError.message 
      });
    }

    // 3. Inserir dados do usuário na tabela users
    const userData: Record<string, string | undefined> = {
      id: authUser.user.id,
      email: user.email,
      name: user.full_name,
      role: 'user', // Primeiro usuário da empresa é user
      tenant_id: tenant.id,
    };

    // Adicionar campo whatsapp se existir na tabela
    try {
      userData.whatsapp = user.whatsapp.replace(/\D/g, '');
    } catch {
      // Se o campo não existir, continuar sem ele
    }

    const { error: userInsertError } = await supabase
      .from('users')
      .insert(userData);

    if (userInsertError) {
      // Se falhar ao inserir usuário, deletar tenant e usuário do Auth
      await supabase.from('tenants').delete().eq('id', tenant.id);
      await adminClient.auth.admin.deleteUser(authUser.user.id);
      return res.status(500).json({ 
        error: 'Erro ao criar usuário: ' + userInsertError.message 
      });
    }

    // 4. Força o set de cookies de sessão
    await supabase.auth.getUser();

    return res.status(201).json({ 
      success: true,
      user: {
        id: authUser.user.id,
        email: user.email,
        name: user.full_name,
        role: 'user',
        tenant_id: tenant.id,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        type: tenant.type,
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ error: 'Internal server error: ' + errorMessage });
  }
} 