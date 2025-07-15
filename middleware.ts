import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log('MIDDLEWARE: TESTE ABSOLUTO', request.nextUrl.pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api|login|signup|qrcode|assinatura).*)',
  ],
} 