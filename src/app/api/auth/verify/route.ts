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

export async function GET(request: NextRequest) {
  try {
    // 获取配置的访问令牌
    const requiredToken = getAccessToken();

    // 如果没有配置访问令牌，则认证通过
    if (!requiredToken) {
      return NextResponse.json(
        { authenticated: true, message: '认证系统未启用' },
        { status: 200 }
      );
    }

    // 从cookie中获取令牌
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { authenticated: false, message: '未找到访问令牌' },
        { status: 401 }
      );
    }
    
    // 验证令牌
    if (!validateToken(token)) {
      return NextResponse.json(
        { authenticated: false, message: '访问令牌无效' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { authenticated: true, message: '认证成功' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { authenticated: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}
