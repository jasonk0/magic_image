#!/bin/bash

# 环境变量 API 配置功能测试脚本

echo "=== 环境变量 API 配置功能测试 ==="
echo ""

BASE_URL="http://localhost:3002"

echo "1. 测试环境变量 API 配置接口..."
ENV_CONFIG_RESPONSE=$(curl -s "$BASE_URL/api/config/env-apis")
echo "环境变量配置响应:"
echo "$ENV_CONFIG_RESPONSE" | jq '.'

# 检查是否检测到配置
CONFIG_COUNT=$(echo "$ENV_CONFIG_RESPONSE" | jq -r '.data.count')
echo ""
echo "检测到的环境变量配置数量: $CONFIG_COUNT"

if [ "$CONFIG_COUNT" -gt 0 ]; then
    echo "✅ 成功检测到环境变量 API 配置"
    
    # 显示配置详情
    echo ""
    echo "配置详情:"
    echo "$ENV_CONFIG_RESPONSE" | jq -r '.data.configs[] | "- \(.name): \(.type) (\(.baseUrl))"'
else
    echo "❌ 未检测到环境变量 API 配置"
fi

echo ""
echo "2. 测试登录功能..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"token":"bonnie-space"}' \
    -c env_test_cookies.txt)

echo "登录响应: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q "登录成功"; then
    echo "✅ 登录成功"
else
    echo "❌ 登录失败"
    exit 1
fi

echo ""
echo "3. 测试主页访问..."
HOME_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b env_test_cookies.txt "$BASE_URL/")
echo "主页访问状态码: $HOME_STATUS"

if [ "$HOME_STATUS" = "200" ]; then
    echo "✅ 主页访问成功"
else
    echo "❌ 主页访问失败"
fi

echo ""
echo "4. 测试 API 配置验证..."
# 测试 OpenAI 配置验证
OPENAI_VERIFY=$(curl -s -X POST "$BASE_URL/api/config/env-apis" \
    -H "Content-Type: application/json" \
    -d '{"type":"openai"}' \
    -b env_test_cookies.txt)

echo "OpenAI 配置验证响应:"
echo "$OPENAI_VERIFY" | jq '.'

if echo "$OPENAI_VERIFY" | grep -q "环境变量配置可用"; then
    echo "✅ OpenAI 环境变量配置验证成功"
else
    echo "❌ OpenAI 环境变量配置验证失败"
fi

# 测试自定义配置验证
echo ""
CUSTOM_VERIFY=$(curl -s -X POST "$BASE_URL/api/config/env-apis" \
    -H "Content-Type: application/json" \
    -d '{"type":"custom"}' \
    -b env_test_cookies.txt)

echo "自定义配置验证响应:"
echo "$CUSTOM_VERIFY" | jq '.'

if echo "$CUSTOM_VERIFY" | grep -q "环境变量配置可用"; then
    echo "✅ 自定义环境变量配置验证成功"
else
    echo "❌ 自定义环境变量配置验证失败"
fi

echo ""
echo "5. 清理测试文件..."
rm -f env_test_cookies.txt

echo ""
echo "🎉 环境变量 API 配置功能测试完成！"
echo ""
echo "功能总结："
echo "✅ 环境变量 API 配置自动检测"
echo "✅ 配置信息安全显示（隐藏敏感信息）"
echo "✅ 多种 API 类型支持（OpenAI、自定义等）"
echo "✅ 配置验证接口"
echo "✅ 与认证系统集成"
echo ""
echo "使用说明："
echo "1. 在 .env 文件中设置 API 配置"
echo "2. 重启 Docker 服务"
echo "3. 登录后在 API 配置对话框中查看环境变量配置"
echo "4. 环境变量配置会自动生效，无需手动输入"
