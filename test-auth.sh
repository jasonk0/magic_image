#!/bin/bash

# 访问令牌认证功能测试脚本

echo "=== 魔法AI绘画 - 访问令牌认证功能测试 ==="
echo ""

BASE_URL="http://localhost:3000"

echo "1. 测试未认证访问主页（应该重定向到登录页面）"
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" "$BASE_URL/"
echo ""

echo "2. 测试登录页面访问"
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" "$BASE_URL/login"
echo ""

echo "3. 测试错误的访问令牌"
curl -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"token":"wrong_token"}' \
  -s | jq -r '.message'
echo ""

echo "4. 测试正确的访问令牌"
RESPONSE=$(curl -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"token":"test123456"}' \
  -c cookies.txt \
  -s)
echo "$RESPONSE" | jq -r '.message'
echo ""

echo "5. 测试使用有效cookie访问主页"
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" -b cookies.txt "$BASE_URL/"
echo ""

echo "6. 测试验证API"
curl -s -b cookies.txt "$BASE_URL/api/auth/verify" | jq -r '.message'
echo ""

echo "7. 测试退出登录"
curl -X POST "$BASE_URL/api/auth/logout" \
  -b cookies.txt \
  -c cookies.txt \
  -s | jq -r '.message'
echo ""

echo "8. 测试退出后访问主页（应该返回401或重定向）"
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" -b cookies.txt "$BASE_URL/"
echo ""

# 清理临时文件
rm -f cookies.txt

echo "测试完成！"
echo ""
echo "使用说明："
echo "1. 如果设置了 ACCESS_TOKEN 环境变量，访问应用需要输入正确的令牌"
echo "2. 如果未设置 ACCESS_TOKEN，应用将正常运行，不启用认证"
echo "3. 令牌验证成功后，会在浏览器中保存7天"
echo "4. 可以通过应用内的'退出'按钮清除令牌"
