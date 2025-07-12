import { NextRequest, NextResponse } from 'next/server';

// 需要保护的路径
const protectedPaths = ['/'];

// 不需要保护的路径（登录页面和静态资源）
const publicPaths = ['/login', '/api', '/_next', '/favicon.ico', '/public'];

// 获取访问令牌（从环境变量）
function getAccessToken(): string | undefined {
  return process.env.ACCESS_TOKEN || process.env.NEXT_PUBLIC_ACCESS_TOKEN;
}

// 验证令牌
function validateToken(token: string): boolean {
  const validToken = getAccessToken();
  if (!validToken) {
    // 如果没有设置访问令牌，则不启用认证
    return true;
  }
  return token === validToken;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 检查是否是公共路径
  const isPublicPath = publicPaths.some(path =>
    pathname.startsWith(path)
  );

  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // 检查是否是受保护的路径
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(path)
  );
  
  if (!isProtectedPath) {
    return NextResponse.next();
  }
  
  // 获取访问令牌配置
  const requiredToken = getAccessToken();

  // 如果没有配置访问令牌，则不启用认证
  if (!requiredToken) {
    return NextResponse.next();
  }

  // 从cookie中获取令牌
  const token = request.cookies.get('access_token')?.value;

  // 验证令牌
  if (!token || !validateToken(token)) {
    // 重定向到登录页面
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/((?!api|_next|favicon.ico).*)',
  ],
};
