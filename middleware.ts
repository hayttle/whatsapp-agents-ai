import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/signup', '/favicon.ico', '/api', '/_next', '/public', '/design-system'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir acesso a rotas públicas
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'))) {
    return NextResponse.next();
  }

  // Verificar autenticação pelo cookie do Supabase
  const supabaseAuthToken = request.cookies.get('sb-access-token') || 
                           request.cookies.get('supabase-auth-token') ||
                           request.cookies.get('sb-auth-token');

  if (!supabaseAuthToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|public|favicon.ico).*)'],
}; 