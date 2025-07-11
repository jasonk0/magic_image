#!/bin/bash

# 部署脚本 - 当接收到 GitHub webhook 时执行

set -e

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "=== Magic Image 自动部署开始 ==="

# 进入应用目录
cd /app

# 备份当前版本信息
CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
log "当前版本: $CURRENT_COMMIT"

# 拉取最新代码
log "正在拉取最新代码..."
git fetch origin
NEW_COMMIT=$(git rev-parse origin/master)
log "新版本: $NEW_COMMIT"

# 检查是否有更新
if [ "$CURRENT_COMMIT" = "$NEW_COMMIT" ]; then
    log "没有新的更新，跳过部署"
    exit 0
fi

# 重置到最新版本
git reset --hard origin/master

# 检查是否需要重新安装依赖
if git diff --name-only $CURRENT_COMMIT $NEW_COMMIT | grep -q "package.*\.json"; then
    log "检测到依赖变化，重新安装依赖..."
    npm ci
else
    log "依赖无变化，跳过安装"
fi

# 构建应用
log "正在构建应用..."
npm run build

# 重启应用容器
log "正在重启应用..."
docker-compose build magic-image-app
docker-compose up -d magic-image-app

# 等待应用启动
log "等待应用启动..."
sleep 10

# 健康检查
log "执行健康检查..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    log "✅ 应用启动成功"
else
    log "❌ 应用启动失败，回滚到上一版本"
    git reset --hard $CURRENT_COMMIT
    docker-compose build magic-image-app
    docker-compose up -d magic-image-app
    exit 1
fi

log "=== 部署完成 ==="
log "版本更新: $CURRENT_COMMIT -> $NEW_COMMIT"

# 发送通知（可选）
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"🚀 Magic Image 应用已成功部署更新\\n版本: $NEW_COMMIT\"}" \
      "$SLACK_WEBHOOK_URL" || log "通知发送失败"
fi
