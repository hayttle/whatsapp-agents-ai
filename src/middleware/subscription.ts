import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';



export async function checkSubscriptionAccess(request: NextRequest) {
  console.log('MIDDLEWARE subscription: executando');
  try {
    // Criar cliente Supabase
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value);
            });
          },
        },
      }
    );

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Buscar dados do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Super admin tem acesso total
    if (userData.role === 'super_admin') {
      return NextResponse.next();
    }

    // Verificar se tem assinatura paga ativa
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('tenant_id', userData.tenant_id)
      .in('status', ['ACTIVE', 'PENDING'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subscription) {
      return NextResponse.next(); // Tem assinatura paga ativa
    }

    // Se não tem assinatura paga, verificar trial
    const { data: trial } = await supabase
      .from('trials')
      .select('status, expires_at')
      .eq('tenant_id', userData.tenant_id)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (trial) {
      const now = new Date();
      const expiresAt = new Date(trial.expires_at);
      
      if (expiresAt > now) {
        return NextResponse.next(); // Trial ativo
      } else {
        // Trial expirado, atualizar status
        await supabase
          .from('trials')
          .update({ status: 'EXPIRED' })
          .eq('tenant_id', userData.tenant_id)
          .eq('status', 'ACTIVE');
      }
    }

    // Verificar se há cobrança vencida (OVERDUE) para o tenant
    const { data: overduePayment } = await supabase
      .from('subscription_payments')
      .select('id')
      .eq('tenant_id', userData.tenant_id)
      .eq('status', 'OVERDUE')
      .limit(1)
      .single();

    console.log('MIDDLEWARE subscription: tenant_id:', userData.tenant_id, 'overduePayment:', overduePayment);

    if (overduePayment) {
      // Bloquear acesso e redirecionar para /assinatura
      return NextResponse.redirect(new URL('/assinatura', request.url));
    }

    // Sem acesso - redirecionar para página de assinatura
    return NextResponse.redirect(new URL('/assinatura', request.url));

  } catch (error) {
    console.error('Erro no middleware de assinatura:', error);
    return NextResponse.redirect(new URL('/assinatura', request.url));
  }
} 