#!/bin/bash

# 服务监控脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 检查Docker服务
check_docker() {
    info "检查 Docker 服务状态..."
    if docker info > /dev/null 2>&1; then
        success "Docker 服务运行正常"
    else
        error "Docker 服务未运行"
        return 1
    fi
}

# 检查容器状态
check_containers() {
    info "检查容器状态..."
    
    # 检查应用容器
    if docker-compose ps magic-image-app | grep -q "Up"; then
        success "应用容器运行正常"
    else
        error "应用容器未运行"
        docker-compose logs --tail=10 magic-image-app
    fi
    
    # 检查自动更新容器
    if docker-compose ps auto-updater | grep -q "Up"; then
        success "自动更新服务运行正常"
    else
        warning "自动更新服务未运行"
        docker-compose logs --tail=10 auto-updater
    fi
    
    # 检查webhook容器（如果存在）
    if docker-compose ps webhook-receiver 2>/dev/null | grep -q "Up"; then
        success "Webhook 服务运行正常"
    else
        warning "Webhook 服务未运行或未配置"
    fi
}

# 检查应用健康状态
check_app_health() {
    info "检查应用健康状态..."
    
    # 检查HTTP响应
    if curl -f -s http://localhost:3000 > /dev/null; then
        success "应用HTTP服务正常"
    else
        error "应用HTTP服务异常"
        return 1
    fi
    
    # 检查响应时间
    RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:3000)
    if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
        success "应用响应时间正常 (${RESPONSE_TIME}s)"
    else
        warning "应用响应时间较慢 (${RESPONSE_TIME}s)"
    fi
}

# 检查磁盘空间
check_disk_space() {
    info "检查磁盘空间..."
    
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -lt 80 ]; then
        success "磁盘空间充足 (已使用 ${DISK_USAGE}%)"
    elif [ "$DISK_USAGE" -lt 90 ]; then
        warning "磁盘空间不足 (已使用 ${DISK_USAGE}%)"
    else
        error "磁盘空间严重不足 (已使用 ${DISK_USAGE}%)"
    fi
}

# 检查内存使用
check_memory() {
    info "检查内存使用..."
    
    MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ "$MEMORY_USAGE" -lt 80 ]; then
        success "内存使用正常 (已使用 ${MEMORY_USAGE}%)"
    elif [ "$MEMORY_USAGE" -lt 90 ]; then
        warning "内存使用较高 (已使用 ${MEMORY_USAGE}%)"
    else
        error "内存使用过高 (已使用 ${MEMORY_USAGE}%)"
    fi
}

# 检查Git仓库状态
check_git_status() {
    info "检查Git仓库状态..."
    
    if [ -d .git ]; then
        CURRENT_BRANCH=$(git branch --show-current)
        CURRENT_COMMIT=$(git rev-parse --short HEAD)
        success "当前分支: $CURRENT_BRANCH"
        success "当前提交: $CURRENT_COMMIT"
        
        # 检查是否有未提交的更改
        if git diff --quiet && git diff --cached --quiet; then
            success "工作目录干净"
        else
            warning "工作目录有未提交的更改"
        fi
    else
        warning "不是Git仓库"
    fi
}

# 显示服务信息
show_service_info() {
    info "服务信息:"
    echo "----------------------------------------"
    docker-compose ps
    echo "----------------------------------------"
    
    info "最近的日志:"
    echo "--- 应用日志 ---"
    docker-compose logs --tail=5 magic-image-app
    echo "--- 更新服务日志 ---"
    docker-compose logs --tail=5 auto-updater
}

# 主函数
main() {
    log "开始系统监控检查..."
    echo "========================================"
    
    check_docker
    check_containers
    check_app_health
    check_disk_space
    check_memory
    check_git_status
    
    echo "========================================"
    show_service_info
    
    log "监控检查完成"
}

# 如果脚本被直接执行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
