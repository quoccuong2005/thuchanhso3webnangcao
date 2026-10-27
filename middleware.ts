import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Role } from '@/lib/rbac';
import { AUTH_SECRET } from '@/lib/constants';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Hỗ trợ tự động nhận diện cookie trên cả Localhost (HTTP) và Vercel (HTTPS)
  const isSecure =
    request.nextUrl.protocol === 'https:' ||
    request.headers.get('x-forwarded-proto') === 'https';

  const hasSecureCookie = request.cookies.has('__Secure-next-auth.session-token');
  const cookieName = hasSecureCookie
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token';

  const token = await getToken({
    req: request,
    secret: AUTH_SECRET,
    cookieName,
    secureCookie: hasSecureCookie || isSecure,
  });

  const isAuthenticated = !!token;
  const userRole = (token?.role as Role) || 'guest';

  // 1. Kiểm tra quyền truy cập /dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Kiểm tra quyền truy cập /admin
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    // Đã đăng nhập nhưng không phải admin -> Chuyển hướng tới /403
    if (userRole !== 'admin') {
      const forbiddenUrl = new URL('/403', request.url);
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
