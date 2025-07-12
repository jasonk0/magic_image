#!/bin/bash

# Magic Image Docker 部署脚本
# 使用方法: ./docker-deploy.sh [build|start|stop|restart|logs|clean]

set -e

# 配置变量
IMAGE_NAME="magic_image"
CONTAINER_NAME="magic_image_app"
PORT="3000"
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
APP_VERSION="1.0.0"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker是否运行
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker 未运行或未安装"
        exit 1
    fi
}

# 构建镜像
build_image() {
    log_info "开始构建 Docker 镜像..."
    
    # 检查是否存在旧镜像
    if docker images | grep -q "$IMAGE_NAME"; then
        log_warning "发现旧镜像，将被替换"
    fi
    
    # 构建镜像
    docker build \
        --build-arg BUILD_TIME="$BUILD_TIME" \
        --build-arg APP_VERSION="$APP_VERSION" \
        -t "$IMAGE_NAME:latest" \
        -t "$IMAGE_NAME:$APP_VERSION" \
        .
    
    log_success "镜像构建完成: $IMAGE_NAME:latest"
}

# 停止并删除现有容器
stop_container() {
    if docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
        log_info "停止现有容器..."
        docker stop "$CONTAINER_NAME"
        docker rm "$CONTAINER_NAME"
        log_success "容器已停止并删除"
    else
        log_info "没有运行中的容器需要停止"
    fi
}

# 启动容器
start_container() {
    log_info "启动新容器..."
    
    docker run -d \
        --name "$CONTAINER_NAME" \
        -p "$PORT:3000" \
        --restart unless-stopped \
        "$IMAGE_NAME:latest"
    
    log_success "容器已启动: $CONTAINER_NAME"
    log_info "应用访问地址: http://localhost:$PORT"
    
    # 等待应用启动
    log_info "等待应用启动..."
    sleep 5
    
    # 检查容器状态
    if docker ps | grep -q "$CONTAINER_NAME"; then
        log_success "应用启动成功！"
        docker logs --tail 10 "$CONTAINER_NAME"
    else
        log_error "应用启动失败"
        docker logs "$CONTAINER_NAME"
        exit 1
    fi
}

# 查看日志
show_logs() {
    if docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
        log_info "显示容器日志..."
        docker logs -f "$CONTAINER_NAME"
    else
        log_error "容器未运行"
        exit 1
    fi
}

# 清理资源
clean_resources() {
    log_info "清理 Docker 资源..."
    
    # 停止容器
    stop_container
    
    # 删除镜像
    if docker images | grep -q "$IMAGE_NAME"; then
        log_info "删除镜像..."
        docker rmi "$IMAGE_NAME:latest" "$IMAGE_NAME:$APP_VERSION" 2>/dev/null || true
        log_success "镜像已删除"
    fi
    
    # 清理未使用的资源
    docker system prune -f
    log_success "清理完成"
}

# 显示帮助信息
show_help() {
    echo "Magic Image Docker 部署脚本"
    echo ""
    echo "使用方法:"
    echo "  $0 build     - 构建 Docker 镜像"
    echo "  $0 start     - 启动容器"
    echo "  $0 stop      - 停止容器"
    echo "  $0 restart   - 重启容器"
    echo "  $0 logs      - 查看容器日志"
    echo "  $0 clean     - 清理所有资源"
    echo "  $0 deploy    - 完整部署（构建+启动）"
    echo ""
    echo "示例:"
    echo "  $0 deploy    # 完整部署"
    echo "  $0 logs      # 查看日志"
}

# 主函数
main() {
    check_docker
    
    case "${1:-}" in
        build)
            build_image
            ;;
        start)
            start_container
            ;;
        stop)
            stop_container
            ;;
        restart)
            stop_container
            start_container
            ;;
        logs)
            show_logs
            ;;
        clean)
            clean_resources
            ;;
        deploy)
            build_image
            stop_container
            start_container
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: ${1:-}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
