import { NextRequest, NextResponse } from 'next/server';
import { getEnvApiConfigs, hasEnvApiConfigs, getEnvConfigSummary } from '@/lib/env-api-config';

// 获取环境变量中的 API 配置
export async function GET(request: NextRequest) {
  try {
    const configs = getEnvApiConfigs();
    
    // 隐藏敏感信息（API Key）
    const safeConfigs = configs.map(config => ({
      ...config,
      apiKey: config.apiKey.substring(0, 8) + '...' + config.apiKey.slice(-4),
    }));

    return NextResponse.json({
      success: true,
      data: {
        configs: safeConfigs,
        count: configs.length,
        hasConfigs: hasEnvApiConfigs(),
        summary: getEnvConfigSummary(),
      }
    });
  } catch (error) {
    console.error('获取环境变量 API 配置失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '获取环境变量 API 配置失败',
        data: {
          configs: [],
          count: 0,
          hasConfigs: false,
          summary: '获取配置时发生错误',
        }
      },
      { status: 500 }
    );
  }
}

// 验证特定的环境变量 API 配置
export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json();
    
    if (!type) {
      return NextResponse.json(
        { success: false, error: '请指定 API 类型' },
        { status: 400 }
      );
    }

    const configs = getEnvApiConfigs();
    const config = configs.find(c => c.type === type);
    
    if (!config) {
      return NextResponse.json(
        { success: false, error: `未找到类型为 ${type} 的环境变量配置` },
        { status: 404 }
      );
    }

    // 这里可以添加实际的 API 连接测试
    // 目前只返回配置存在的信息
    return NextResponse.json({
      success: true,
      data: {
        type: config.type,
        name: config.name,
        baseUrl: config.baseUrl,
        available: true,
        message: '环境变量配置可用'
      }
    });
  } catch (error) {
    console.error('验证环境变量 API 配置失败:', error);
    return NextResponse.json(
      { success: false, error: '验证配置失败' },
      { status: 500 }
    );
  }
}
