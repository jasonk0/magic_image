# Magic Image 升级指南

## 🎉 新功能概览

### 1. IndexedDB 存储升级
- ✅ **更大存储容量**: 从localStorage的5-10MB限制升级到IndexedDB的几GB容量
- ✅ **更好性能**: 异步操作，不阻塞UI
- ✅ **自动迁移**: 现有localStorage数据会自动迁移到IndexedDB
- ✅ **向后兼容**: 无需手动操作，升级后自动生效

### 2. Docker 自动部署
- ✅ **一键部署**: 使用 `./start.sh` 快速启动
- ✅ **自动更新**: 每60秒检查Git仓库更新，自动拉取并重新部署
- ✅ **Webhook支持**: 支持GitHub Webhook即时更新
- ✅ **健康检查**: 自动检测应用状态，失败时自动回滚
- ✅ **完整管理**: 提供管理脚本进行服务管理

## 🚀 快速开始

### 方式一：直接使用（推荐）
```bash
# 正常使用，IndexedDB会自动启用
npm run dev
```

### 方式二：Docker部署
```bash
# 一键启动Docker部署
chmod +x start.sh
./start.sh

# 或使用管理脚本
chmod +x manage.sh
./manage.sh start
```

## 📋 升级说明

### 存储升级
- **无需手动操作**: 首次访问时会自动将localStorage数据迁移到IndexedDB
- **数据保留**: 所有历史记录、API配置、自定义模型都会保留
- **性能提升**: 大量图片存储时性能显著提升

### Docker部署功能
- **自动更新**: 应用会自动检测仓库更新并重新部署
- **零停机**: 更新过程中服务保持可用
- **回滚保护**: 更新失败时自动回滚到上一版本

## 🛠️ 管理命令

```bash
# 查看所有可用命令
./manage.sh help

# 常用命令
./manage.sh start     # 启动服务
./manage.sh status    # 查看状态
./manage.sh logs      # 查看日志
./manage.sh monitor   # 系统监控
./manage.sh update    # 手动更新
./manage.sh stop      # 停止服务
```

## 🔧 配置选项

### 环境变量配置
```bash
# 复制配置文件
cp .env.example .env

# 编辑配置
vim .env
```

主要配置项：
- `GIT_REPO`: Git仓库地址
- `GIT_BRANCH`: 监控的分支（默认master）
- `CHECK_INTERVAL`: 检查更新间隔（默认60秒）
- `WEBHOOK_SECRET`: GitHub Webhook密钥

### Webhook配置（可选）
```bash
# 启用Webhook服务
docker-compose --profile webhook up -d

# Webhook地址
http://your-domain:9000/hooks/magic-image-deploy
```

## 📊 监控和日志

### 系统监控
```bash
# 运行完整的系统检查
./manage.sh monitor
```

### 查看日志
```bash
# 查看应用日志
./manage.sh logs magic-image-app

# 查看自动更新日志
./manage.sh logs auto-updater

# 查看所有日志
./manage.sh logs
```

## 🔒 安全建议

1. **生产环境**:
   - 使用正式的SSL证书
   - 设置防火墙规则
   - 配置Webhook密钥

2. **监控**:
   - 定期检查服务状态
   - 监控磁盘和内存使用
   - 设置告警通知

## 🐛 故障排除

### 常见问题

1. **IndexedDB不工作**
   - 检查浏览器是否支持IndexedDB
   - 清除浏览器缓存后重试
   - 查看浏览器控制台错误信息

2. **Docker服务启动失败**
   - 检查端口是否被占用: `netstat -tlnp | grep :3000`
   - 查看Docker日志: `./manage.sh logs`
   - 重新构建镜像: `docker-compose build --no-cache`

3. **自动更新不工作**
   - 检查Git仓库连接: `git fetch origin`
   - 查看更新服务日志: `./manage.sh logs auto-updater`
   - 验证环境变量配置

### 获取帮助
- 查看详细日志: `./manage.sh logs`
- 运行系统检查: `./manage.sh monitor`
- 查看服务状态: `./manage.sh status`

## 📈 性能优化

### IndexedDB优化
- 大量数据时使用分页加载
- 定期清理过期数据
- 使用索引加速查询

### Docker优化
- 定期清理无用镜像: `./manage.sh clean`
- 监控资源使用: `./manage.sh monitor`
- 配置合适的内存限制

## 🎯 下一步

1. **体验新功能**: 上传更多图片测试IndexedDB存储
2. **配置自动部署**: 设置Docker环境享受自动更新
3. **监控系统**: 使用监控脚本了解系统状态
4. **自定义配置**: 根据需要调整环境变量

---

🎉 **恭喜！您已成功升级到最新版本的Magic Image！**

如有问题，请查看 `DOCKER-DEPLOY.md` 获取详细部署说明。
