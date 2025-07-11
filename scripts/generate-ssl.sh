#!/bin/bash

# 生成自签名SSL证书用于测试

echo "正在生成自签名SSL证书..."

# 创建SSL目录
mkdir -p ssl

# 生成私钥
openssl genrsa -out ssl/nginx-selfsigned.key 2048

# 生成证书
openssl req -new -x509 -key ssl/nginx-selfsigned.key -out ssl/nginx-selfsigned.crt -days 365 -subj "/C=CN/ST=Beijing/L=Beijing/O=Magic Image/OU=IT Department/CN=localhost"

echo "SSL证书生成完成！"
echo "证书文件: ssl/nginx-selfsigned.crt"
echo "私钥文件: ssl/nginx-selfsigned.key"
echo ""
echo "注意：这是自签名证书，仅用于测试。生产环境请使用正式的SSL证书。"
