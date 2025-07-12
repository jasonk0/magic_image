#!/bin/bash

# Docker Compose 测试脚本

echo "=== Docker Compose Cookie 认证测试 ==="
echo ""

# 检查是否有.env文件
if [ ! -f .env ]; then
    echo "创建 .env 文件..."
    echo "ACCESS_TOKEN=321" > .env
    echo "NODE_ENV=production" >> .env
fi

echo "当前 .env 配置:"
cat .env
echo ""

echo "1. 停止现有服务..."
docker-compose down > /dev/null 2>&1

echo ""
echo "2. 构建并启动服务..."
docker-compose up -d --build

if [ $? -eq 0 ]; then
    echo "✅ Docker Compose 服务启动成功"
else
    echo "❌ Docker Compose 服务启动失败"
    exit 1
fi

echo ""
echo "3. 等待应用启动..."
sleep 20

# 检查容器状态
echo ""
echo "4. 检查容器状态..."
docker-compose ps

echo ""
echo "5. 测试应用连接..."
for i in {1..30}; do
    if curl -s http://localhost:3002/login > /dev/null; then
        echo "✅ 应用连接成功"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ 应用连接超时"
        echo "容器日志:"
        docker-compose logs
        exit 1
    fi
    echo "等待应用启动... ($i/30)"
    sleep 2
done

echo ""
echo "6. 测试 Cookie 认证流程..."

# 测试登录
echo "步骤 6.1: 测试登录..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3002/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"token":"321"}' \
    -c compose_cookies.txt \
    -D compose_headers.txt)

echo "登录响应: $LOGIN_RESPONSE"

# 检查cookie设置
if grep -qi "set-cookie" compose_headers.txt; then
    echo "✅ Cookie 设置成功"
    grep -i "set-cookie" compose_headers.txt
else
    echo "❌ Cookie 设置失败"
    echo "响应头:"
    cat compose_headers.txt
fi

# 测试验证
echo ""
echo "步骤 6.2: 测试验证接口..."
VERIFY_RESPONSE=$(curl -s http://localhost:3002/api/auth/verify -b compose_cookies.txt)
echo "验证响应: $VERIFY_RESPONSE"

if echo "$VERIFY_RESPONSE" | grep -q "认证成功"; then
    echo "✅ 验证成功"
else
    echo "❌ 验证失败"
fi

# 测试主页访问
echo ""
echo "步骤 6.3: 测试主页访问..."
HOME_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b compose_cookies.txt http://localhost:3002/)
echo "主页状态码: $HOME_STATUS"

if [ "$HOME_STATUS" = "200" ]; then
    echo "✅ 主页访问成功"
else
    echo "❌ 主页访问失败"
fi

# 测试退出登录
echo ""
echo "步骤 6.4: 测试退出登录..."
LOGOUT_RESPONSE=$(curl -s -X POST http://localhost:3002/api/auth/logout \
    -b compose_cookies.txt \
    -c compose_cookies.txt)
echo "退出响应: $LOGOUT_RESPONSE"

# 测试退出后访问
echo ""
echo "步骤 6.5: 测试退出后访问..."
AFTER_LOGOUT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b compose_cookies.txt http://localhost:3002/)
echo "退出后访问状态码: $AFTER_LOGOUT_STATUS"

echo ""
echo "7. 清理测试文件..."
rm -f compose_cookies.txt compose_headers.txt

echo ""
echo "🎉 Docker Compose 测试完成！"
echo ""
echo "如果所有步骤都显示 ✅，说明 Docker Compose 环境下的认证功能正常工作"
echo ""
echo "访问地址: http://localhost:3002"
echo "测试令牌: 321"
echo ""
echo "要停止服务，请运行: docker-compose down"
