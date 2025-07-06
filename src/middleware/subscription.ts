import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

// Rotas que não precisam de verificação de assinatura
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/api',
  '/_next',
  '/public',
  '/favicon.ico',
  '/design-system',
];

// Rotas que são permitidas mesmo com assinatura suspensa
const ALLOWED_WHEN_SUSPENDED = [
  '/assinatura',
  '/api/subscriptions',
];

export async function checkSubscriptionStatus(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rotas públicas
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

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
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
            });
          },
        },
      }
    );

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Buscar tenant_id do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      // Se não conseguir buscar o tenant_id, permitir acesso à página de assinatura
      if (pathname === '/assinatura') {
        return NextResponse.next();
      }
      const subscriptionUrl = new URL('/assinatura', request.url);
      return NextResponse.redirect(subscriptionUrl);
    }

    // Buscar assinatura ativa do tenant
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .in('status', ['TRIAL', 'ACTIVE'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Se não há assinatura ou está suspensa/vencida
    if (subscriptionError || !subscription) {
      // Verificar se o usuário está no período trial (7 dias após cadastro)
      const { data: userData } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', user.id)
        .single();

      if (userData?.created_at) {
        const userCreatedAt = new Date(userData.created_at);
        const trialEnd = new Date(userCreatedAt);
        trialEnd.setDate(trialEnd.getDate() + 7);
        const now = new Date();

        // Se ainda está no período trial, permitir acesso total
        if (now <= trialEnd) {
          return NextResponse.next();
        }
      }

      // Permitir acesso à página de assinatura
      if (pathname === '/assinatura') {
        return NextResponse.next();
      }

      // Bloquear acesso à página de QR Code se não há assinatura ativa
      if (pathname.startsWith('/qrcode')) {
        const subscriptionUrl = new URL('/assinatura', request.url);
        subscriptionUrl.searchParams.set('from', 'qrcode');
        return NextResponse.redirect(subscriptionUrl);
      }

      // Redirecionar para página de assinatura se tentar acessar outras rotas
      if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
        const subscriptionUrl = new URL('/assinatura', request.url);
        return NextResponse.redirect(subscriptionUrl);
      }

      return NextResponse.next();
    }

    // Verificar se a assinatura trial expirou
    if (subscription.status === 'TRIAL') {
      const trialEndDate = new Date(subscription.next_due_date);
      const now = new Date();
      
      if (now > trialEndDate) {
        // Atualizar status para SUSPENDED
        await supabase
          .from('subscriptions')
          .update({ 
            status: 'SUSPENDED',
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);

        // Permitir acesso à página de assinatura
        if (pathname === '/assinatura') {
          return NextResponse.next();
        }

        // Bloquear acesso à página de QR Code se assinatura trial expirou
        if (pathname.startsWith('/qrcode')) {
          const subscriptionUrl = new URL('/assinatura', request.url);
          subscriptionUrl.searchParams.set('from', 'qrcode');
          return NextResponse.redirect(subscriptionUrl);
        }

        // Redirecionar para página de assinatura
        const subscriptionUrl = new URL('/assinatura', request.url);
        return NextResponse.redirect(subscriptionUrl);
      }
    }

    // Assinatura ativa, permitir acesso
    return NextResponse.next();

  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    // Em caso de erro, permitir acesso (fail-safe)
    return NextResponse.next();
  }
} 