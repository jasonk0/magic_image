import { NextRequest, NextResponse } from 'next/server';
import { getEnvApiConfigs } from '@/lib/env-api-config';

// 获取完整的环境变量 API 配置（包含完整的 API Key）
// 这个接口只用于内部API调用，不对外暴露完整的API Key
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

    // 返回完整的配置信息（包含完整的API Key）
    // 注意：这个接口只应该被内部调用，不应该暴露给前端
    return NextResponse.json({
      success: true,
      data: {
        name: config.name,
        apiKey: config.apiKey, // 完整的API Key
        baseUrl: config.baseUrl,
        type: config.type,
        description: config.description,
        enabled: config.enabled,
        modelName: config.modelName,
      }
    });
  } catch (error) {
    console.error('获取完整环境变量 API 配置失败:', error);
    return NextResponse.json(
      { success: false, error: '获取配置失败' },
      { status: 500 }
    );
  }
}
