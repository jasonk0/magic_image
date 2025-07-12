#!/bin/bash

# Docker 构建和测试脚本

echo "=== 魔法AI绘画 - Docker 构建测试 ==="
echo ""

# 设置测试访问令牌
export ACCESS_TOKEN="docker_test_token_123456"

echo "1. 构建 Docker 镜像..."
docker build -t magic_image_test:latest . --build-arg BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

if [ $? -eq 0 ]; then
    echo "✅ Docker 镜像构建成功"
else
    echo "❌ Docker 镜像构建失败"
    exit 1
fi

echo ""
echo "2. 启动测试容器..."
docker run -d \
    --name magic_image_test_container \
    -p 3001:3000 \
    -e ACCESS_TOKEN="$ACCESS_TOKEN" \
    -e NODE_ENV=production \
    magic_image_test:latest

if [ $? -eq 0 ]; then
    echo "✅ 容器启动成功"
else
    echo "❌ 容器启动失败"
    exit 1
fi

echo ""
echo "3. 等待应用启动..."
sleep 10

echo ""
echo "4. 测试应用健康状态..."
for i in {1..30}; do
    if curl -s http://localhost:3001/login > /dev/null; then
        echo "✅ 应用启动成功"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ 应用启动超时"
        docker logs magic_image_test_container
        exit 1
    fi
    echo "等待应用启动... ($i/30)"
    sleep 2
done

echo ""
echo "5. 测试认证功能..."

# 测试登录页面
echo "测试登录页面访问..."
LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/login)
if [ "$LOGIN_STATUS" = "200" ]; then
    echo "✅ 登录页面正常"
else
    echo "❌ 登录页面异常 (状态码: $LOGIN_STATUS)"
fi

# 测试错误令牌
echo "测试错误令牌..."
ERROR_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"token":"wrong_token"}')
if echo "$ERROR_RESPONSE" | grep -q "访问令牌无效"; then
    echo "✅ 错误令牌被正确拒绝"
else
    echo "❌ 错误令牌处理异常"
fi

# 测试正确令牌
echo "测试正确令牌..."
SUCCESS_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"token\":\"$ACCESS_TOKEN\"}" \
    -c test_cookies.txt)
if echo "$SUCCESS_RESPONSE" | grep -q "登录成功"; then
    echo "✅ 正确令牌登录成功"
else
    echo "❌ 正确令牌登录失败"
fi

# 测试认证后访问
echo "测试认证后访问主页..."
AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b test_cookies.txt http://localhost:3001/)
if [ "$AUTH_STATUS" = "200" ]; then
    echo "✅ 认证后可正常访问主页"
else
    echo "❌ 认证后访问主页失败 (状态码: $AUTH_STATUS)"
fi

echo ""
echo "6. 清理测试环境..."
docker stop magic_image_test_container > /dev/null 2>&1
docker rm magic_image_test_container > /dev/null 2>&1
docker rmi magic_image_test:latest > /dev/null 2>&1
rm -f test_cookies.txt

echo "✅ 清理完成"
echo ""
echo "🎉 Docker 构建和认证功能测试完成！"
echo ""
echo "部署说明："
echo "1. 设置环境变量: ACCESS_TOKEN=your_secret_token"
echo "2. 构建镜像: docker build -t magic_image:latest ."
echo "3. 运行容器: docker run -d -p 3000:3000 -e ACCESS_TOKEN=your_token magic_image:latest"
echo "4. 访问应用: http://localhost:3000"
