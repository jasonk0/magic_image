import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 创建响应
    const response = NextResponse.json(
      { message: '退出登录成功' },
      { status: 200 }
    );
    
    // 清除cookie
    // 在Docker环境中，即使是生产模式也可能使用HTTP，所以不强制要求HTTPS
    const isSecure = process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS === 'true';

    response.cookies.set('access_token', '', {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 0, // 立即过期
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: '服务器错误' },
      { status: 500 }
    );
  }
}
