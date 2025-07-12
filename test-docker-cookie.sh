#!/bin/bash

# Docker Cookie 测试脚本

echo "=== Docker Cookie 认证测试 ==="
echo ""

# 清理之前的测试容器
docker stop magic_image_cookie_test > /dev/null 2>&1
docker rm magic_image_cookie_test > /dev/null 2>&1

# 设置测试访问令牌
export ACCESS_TOKEN="321"

echo "1. 构建 Docker 镜像..."
docker build -t magic_image_cookie_test:latest . --build-arg BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ") > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Docker 镜像构建成功"
else
    echo "❌ Docker 镜像构建失败"
    exit 1
fi

echo ""
echo "2. 启动测试容器..."
docker run -d \
    --name magic_image_cookie_test \
    -p 3001:3000 \
    -e ACCESS_TOKEN="$ACCESS_TOKEN" \
    -e NODE_ENV=production \
    magic_image_cookie_test:latest > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ 容器启动成功"
else
    echo "❌ 容器启动失败"
    exit 1
fi

echo ""
echo "3. 等待应用启动..."
sleep 15

echo ""
echo "4. 测试 Cookie 设置和验证..."

# 测试登录并保存cookie
echo "步骤 4.1: 测试登录接口..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"token\":\"$ACCESS_TOKEN\"}" \
    -c cookie_test.txt \
    -D headers_test.txt)

echo "登录响应: $LOGIN_RESPONSE"

# 检查响应头中的Set-Cookie
echo ""
echo "步骤 4.2: 检查响应头中的 Set-Cookie..."
if grep -qi "set-cookie" headers_test.txt; then
    echo "✅ 响应头包含 Set-Cookie"
    grep -i "set-cookie" headers_test.txt
else
    echo "❌ 响应头不包含 Set-Cookie"
    echo "完整响应头:"
    cat headers_test.txt
fi

# 检查保存的cookie文件
echo ""
echo "步骤 4.3: 检查保存的 Cookie 文件..."
if [ -f cookie_test.txt ] && [ -s cookie_test.txt ]; then
    echo "✅ Cookie 文件已创建"
    echo "Cookie 内容:"
    cat cookie_test.txt
else
    echo "❌ Cookie 文件为空或不存在"
fi

# 测试使用cookie访问验证接口
echo ""
echo "步骤 4.4: 使用 Cookie 测试验证接口..."
VERIFY_RESPONSE=$(curl -s http://localhost:3001/api/auth/verify \
    -b cookie_test.txt \
    -D verify_headers.txt)

echo "验证响应: $VERIFY_RESPONSE"

# 检查验证是否成功
if echo "$VERIFY_RESPONSE" | grep -q "认证成功"; then
    echo "✅ Cookie 验证成功"
else
    echo "❌ Cookie 验证失败"
    echo "验证接口响应头:"
    cat verify_headers.txt
fi

# 测试使用cookie访问主页
echo ""
echo "步骤 4.5: 使用 Cookie 访问主页..."
HOME_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b cookie_test.txt http://localhost:3001/)
echo "主页访问状态码: $HOME_STATUS"

if [ "$HOME_STATUS" = "200" ]; then
    echo "✅ 使用 Cookie 可以正常访问主页"
else
    echo "❌ 使用 Cookie 访问主页失败"
fi

# 测试不带cookie的访问
echo ""
echo "步骤 4.6: 测试不带 Cookie 的访问..."
NO_COOKIE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/)
echo "无 Cookie 访问状态码: $NO_COOKIE_STATUS"

# 测试浏览器环境的cookie设置
echo ""
echo "步骤 4.7: 模拟浏览器环境测试..."
BROWSER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
    -H "Accept: application/json" \
    -H "Origin: http://localhost:3001" \
    -H "Referer: http://localhost:3001/login" \
    -d "{\"token\":\"$ACCESS_TOKEN\"}" \
    -c browser_cookie.txt \
    -D browser_headers.txt)

echo "浏览器模拟登录响应: $BROWSER_RESPONSE"

if grep -qi "set-cookie" browser_headers.txt; then
    echo "✅ 浏览器环境下 Cookie 设置正常"
    echo "Set-Cookie 详情:"
    grep -i "set-cookie" browser_headers.txt
else
    echo "❌ 浏览器环境下 Cookie 设置失败"
fi

echo ""
echo "5. 清理测试环境..."
docker stop magic_image_cookie_test > /dev/null 2>&1
docker rm magic_image_cookie_test > /dev/null 2>&1
docker rmi magic_image_cookie_test:latest > /dev/null 2>&1
rm -f cookie_test.txt headers_test.txt verify_headers.txt browser_cookie.txt browser_headers.txt

echo "✅ 清理完成"
echo ""
echo "🔍 Cookie 测试总结："
echo "如果所有步骤都显示 ✅，说明 Cookie 功能正常"
echo "如果有 ❌，请检查："
echo "1. Docker 容器是否正常启动"
echo "2. 环境变量是否正确设置"
echo "3. Cookie 安全设置是否适合当前环境"
