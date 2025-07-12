import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// 获取配置的访问令牌
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

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { message: '请提供访问令牌' },
        { status: 400 }
      );
    }
    
    // 获取配置的访问令牌
    const requiredToken = getAccessToken();
    
    // 如果没有配置访问令牌，则不启用认证
    if (!requiredToken) {
      return NextResponse.json(
        { message: '认证系统未启用' },
        { status: 400 }
      );
    }
    
    // 验证令牌
    if (!validateToken(token)) {
      return NextResponse.json(
        { message: '访问令牌无效' },
        { status: 401 }
      );
    }
    
    // 创建响应
    const response = NextResponse.json(
      { message: '登录成功' },
      { status: 200 }
    );
    
    // 设置cookie（有效期7天）
    // 在Docker环境中，即使是生产模式也可能使用HTTP，所以不强制要求HTTPS
    const isSecure = process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS === 'true';

    response.cookies.set('access_token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7天
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: '服务器错误' },
      { status: 500 }
    );
  }
}
