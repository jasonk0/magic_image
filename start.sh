#!/bin/bash

# Magic Image 一键启动脚本

set -e

echo "=== Magic Image 部署脚本 ==="
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "错误: Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 生成SSL证书（如果不存在）
if [ ! -f "ssl/nginx-selfsigned.crt" ]; then
    echo "正在生成SSL证书..."
    chmod +x scripts/generate-ssl.sh
    ./scripts/generate-ssl.sh
fi

# 创建环境变量文件（如果不存在）
if [ ! -f ".env" ]; then
    echo "正在创建环境变量文件..."
    cp .env.example .env
    echo "请编辑 .env 文件配置您的环境变量"
fi

# 给脚本添加执行权限
chmod +x scripts/*.sh

echo "正在启动服务..."

# 构建并启动服务
docker-compose up -d --build

echo ""
echo "=== 部署完成 ==="
echo ""
echo "服务状态:"
docker-compose ps

echo ""
echo "🎉 应用访问地址:"
echo "  📱 HTTP:  http://localhost:3000"
echo ""
echo "🔧 管理命令:"
echo "  查看状态: ./manage.sh status"
echo "  查看日志: ./manage.sh logs"
echo "  系统监控: ./manage.sh monitor"
echo "  手动更新: ./manage.sh update"
echo "  停止服务: ./manage.sh stop"
echo "  重启服务: ./manage.sh restart"
echo ""
echo "📚 更多帮助: ./manage.sh help"
echo ""
echo "🔄 自动更新功能已启用，每60秒检查一次仓库更新"
echo "📝 如需启用Webhook，请运行: docker-compose --profile webhook up -d"
