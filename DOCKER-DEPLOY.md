# Magic Image Docker 部署指南

本指南将帮助您使用 Docker 部署 Magic Image 应用，并配置自动更新功能。

## 功能特性

- 🚀 **一键部署**: 使用 Docker Compose 快速部署
- 🔄 **自动更新**: 监控 Git 仓库变化，自动拉取更新并重新部署
- 🔒 **HTTPS 支持**: 内置 Nginx 反向代理和 SSL 支持
- 📡 **Webhook 支持**: 支持 GitHub Webhook 触发即时更新
- 💾 **数据持久化**: IndexedDB 存储，支持大容量图片存储

## 快速开始

### 1. 环境要求

- Docker 20.10+
- Docker Compose 2.0+
- Git

### 2. 克隆仓库

```bash
git clone https://github.com/jasonk0/magic_image.git
cd magic_image
```

### 3. 一键启动

```bash
chmod +x start.sh
./start.sh
```

### 4. 访问应用

- 应用地址: http://localhost:3000
- HTTPS 地址: https://localhost (需要配置 SSL 证书)

## 详细配置

### 环境变量配置

复制并编辑环境变量文件：

```bash
cp .env.example .env
```

主要配置项：

```env
# GitHub 仓库配置
GIT_REPO_URL=https://github.com/jasonk0/magic_image.git
GIT_BRANCH=master

# Webhook 配置
WEBHOOK_SECRET=your-webhook-secret-here

# 应用配置
NODE_ENV=production
PORT=3000
```

### 自动更新配置

应用支持两种自动更新方式：

#### 1. 定时检查更新（默认启用）

- 每 600 秒检查一次仓库更新
- 发现新提交时自动拉取并重新部署
- 可通过 `CHECK_INTERVAL` 环境变量调整检查间隔

#### 2. Webhook 即时更新

在 GitHub 仓库设置中添加 Webhook：

1. 进入仓库设置 → Webhooks
2. 添加新的 Webhook
3. Payload URL: `http://your-domain:9000/hooks/magic-image-deploy`
4. Content type: `application/json`
5. Secret: 设置与 `.env` 文件中 `WEBHOOK_SECRET` 相同的值
6. 选择 "Just the push event"

### SSL 证书配置

#### 开发环境（自签名证书）

脚本会自动生成自签名证书用于测试：

```bash
./scripts/generate-ssl.sh
```

#### 生产环境（正式证书）

1. 将您的 SSL 证书文件放置在 `ssl/` 目录下
2. 修改 `nginx.conf` 中的证书路径
3. 重启服务

## 服务管理

### 查看服务状态

```bash
docker-compose ps
```

### 查看日志

```bash
# 查看应用日志
docker-compose logs -f magic-image-app

# 查看自动更新服务日志
docker-compose logs -f auto-updater

# 查看所有服务日志
docker-compose logs -f
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart magic-image-app
```

### 停止服务

```bash
docker-compose down
```

### 更新应用

```bash
# 手动触发更新
docker-compose build magic-image-app
docker-compose up -d magic-image-app
```

## 故障排除

### 常见问题

1. **端口冲突**

   - 修改 `docker-compose.yml` 中的端口映射
   - 确保 3000 和 9000 端口未被占用

2. **权限问题**

   - 确保脚本有执行权限: `chmod +x scripts/*.sh`
   - 确保 Docker 服务正在运行

3. **SSL 证书问题**

   - 检查证书文件路径是否正确
   - 确保证书文件权限正确

4. **自动更新不工作**
   - 检查 Git 仓库 URL 是否正确
   - 确保网络连接正常
   - 查看 auto-updater 服务日志

### 日志分析

```bash
# 查看详细的构建日志
docker-compose build --no-cache magic-image-app

# 查看容器内部状态
docker-compose exec magic-image-app sh
```

## 生产环境建议

1. **使用正式的 SSL 证书**（Let's Encrypt 或购买的证书）
2. **配置防火墙**，只开放必要的端口
3. **设置监控和告警**
4. **定期备份数据**
5. **使用环境变量管理敏感信息**

## 技术架构

- **应用层**: Next.js 应用 (端口 3000)
- **代理层**: Nginx 反向代理 (端口 80/443)
- **更新服务**: Git 监控和自动部署
- **Webhook**: GitHub 集成 (端口 9000)
- **存储**: IndexedDB (浏览器端)

## 支持

如有问题，请提交 Issue 或查看项目文档。
