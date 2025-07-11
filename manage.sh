#!/bin/bash

# Magic Image 管理脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 显示帮助信息
show_help() {
    echo "Magic Image 管理脚本"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "可用命令:"
    echo "  start     - 启动所有服务"
    echo "  stop      - 停止所有服务"
    echo "  restart   - 重启所有服务"
    echo "  status    - 查看服务状态"
    echo "  logs      - 查看服务日志"
    echo "  monitor   - 运行系统监控"
    echo "  update    - 手动更新应用"
    echo "  backup    - 备份数据"
    echo "  restore   - 恢复数据"
    echo "  clean     - 清理无用的Docker资源"
    echo "  setup     - 初始化环境"
    echo "  help      - 显示此帮助信息"
    echo ""
}

# 启动服务
start_services() {
    echo -e "${GREEN}启动 Magic Image 服务...${NC}"
    
    # 检查环境
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}创建环境变量文件...${NC}"
        cp .env.example .env
    fi
    
    # 生成SSL证书
    if [ ! -f "ssl/nginx-selfsigned.crt" ]; then
        echo -e "${YELLOW}生成SSL证书...${NC}"
        chmod +x scripts/generate-ssl.sh
        ./scripts/generate-ssl.sh
    fi
    
    # 启动服务
    docker-compose up -d --build
    
    echo -e "${GREEN}服务启动完成！${NC}"
    echo "应用地址: http://localhost:3000"
}

# 停止服务
stop_services() {
    echo -e "${YELLOW}停止 Magic Image 服务...${NC}"
    docker-compose down
    echo -e "${GREEN}服务已停止${NC}"
}

# 重启服务
restart_services() {
    echo -e "${YELLOW}重启 Magic Image 服务...${NC}"
    docker-compose restart
    echo -e "${GREEN}服务重启完成${NC}"
}

# 查看状态
show_status() {
    echo -e "${BLUE}服务状态:${NC}"
    docker-compose ps
    echo ""
    echo -e "${BLUE}系统资源:${NC}"
    docker stats --no-stream
}

# 查看日志
show_logs() {
    if [ -n "$2" ]; then
        docker-compose logs -f "$2"
    else
        echo "选择要查看的服务日志:"
        echo "1) magic-image-app"
        echo "2) auto-updater"
        echo "3) webhook-receiver"
        echo "4) 所有服务"
        read -p "请选择 (1-4): " choice
        
        case $choice in
            1) docker-compose logs -f magic-image-app ;;
            2) docker-compose logs -f auto-updater ;;
            3) docker-compose logs -f webhook-receiver ;;
            4) docker-compose logs -f ;;
            *) echo "无效选择" ;;
        esac
    fi
}

# 运行监控
run_monitor() {
    chmod +x scripts/monitor.sh
    ./scripts/monitor.sh
}

# 手动更新
manual_update() {
    echo -e "${YELLOW}手动更新应用...${NC}"
    
    # 拉取最新代码
    git fetch origin
    git reset --hard origin/master
    
    # 重新构建并启动
    docker-compose build magic-image-app
    docker-compose up -d magic-image-app
    
    echo -e "${GREEN}更新完成${NC}"
}

# 备份数据
backup_data() {
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    echo -e "${YELLOW}备份数据到 $BACKUP_DIR...${NC}"
    
    # 备份环境变量
    cp .env "$BACKUP_DIR/" 2>/dev/null || true
    
    # 备份SSL证书
    cp -r ssl "$BACKUP_DIR/" 2>/dev/null || true
    
    # 备份webhook配置
    cp -r webhook-config "$BACKUP_DIR/" 2>/dev/null || true
    
    # 导出Docker镜像
    docker save magic_image_magic-image-app:latest | gzip > "$BACKUP_DIR/app-image.tar.gz"
    
    echo -e "${GREEN}备份完成: $BACKUP_DIR${NC}"
}

# 恢复数据
restore_data() {
    echo "可用的备份:"
    ls -la backups/ 2>/dev/null || echo "没有找到备份"
    
    read -p "请输入要恢复的备份目录名: " backup_name
    
    if [ -d "backups/$backup_name" ]; then
        echo -e "${YELLOW}恢复数据从 backups/$backup_name...${NC}"
        
        # 恢复文件
        cp "backups/$backup_name/.env" . 2>/dev/null || true
        cp -r "backups/$backup_name/ssl" . 2>/dev/null || true
        cp -r "backups/$backup_name/webhook-config" . 2>/dev/null || true
        
        # 恢复Docker镜像
        if [ -f "backups/$backup_name/app-image.tar.gz" ]; then
            docker load < "backups/$backup_name/app-image.tar.gz"
        fi
        
        echo -e "${GREEN}恢复完成${NC}"
    else
        echo -e "${RED}备份目录不存在${NC}"
    fi
}

# 清理资源
clean_resources() {
    echo -e "${YELLOW}清理Docker资源...${NC}"
    
    # 清理未使用的镜像
    docker image prune -f
    
    # 清理未使用的容器
    docker container prune -f
    
    # 清理未使用的网络
    docker network prune -f
    
    # 清理未使用的卷
    docker volume prune -f
    
    echo -e "${GREEN}清理完成${NC}"
}

# 初始化环境
setup_environment() {
    echo -e "${GREEN}初始化 Magic Image 环境...${NC}"
    
    # 创建必要的目录
    mkdir -p ssl scripts webhook-config backups
    
    # 设置脚本权限
    chmod +x scripts/*.sh
    
    # 检查依赖
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}错误: Docker 未安装${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}错误: Docker Compose 未安装${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}环境初始化完成${NC}"
}

# 主函数
main() {
    case "${1:-help}" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$@"
            ;;
        monitor)
            run_monitor
            ;;
        update)
            manual_update
            ;;
        backup)
            backup_data
            ;;
        restore)
            restore_data
            ;;
        clean)
            clean_resources
            ;;
        setup)
            setup_environment
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}未知命令: $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
