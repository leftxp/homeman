#!/bin/bash

# Homeman Docker 构建脚本 (Linux/macOS)

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 版本信息
VERSION=${1:-latest}
IMAGE_NAME="homeman"
REGISTRY=${REGISTRY:-""}

echo -e "${BLUE}🐳 开始构建 Homeman Docker 镜像...${NC}"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装，请先安装 Docker${NC}"
    exit 1
fi

# 构建选项
echo
echo -e "${YELLOW}🏗️ 选择构建类型:${NC}"
echo "1) 基础构建 (开发/测试)"
echo "2) 优化构建 (生产环境)"
echo "3) 多架构构建 (AMD64 + ARM64)"
read -p "请选择 [1-3]: " choice

case $choice in
    1)
        echo -e "${BLUE}📦 执行基础构建...${NC}"
        docker build -t ${IMAGE_NAME}:${VERSION} .
        ;;
    2)
        echo -e "${BLUE}🚀 执行优化构建...${NC}"
        docker build -f Dockerfile.optimized -t ${IMAGE_NAME}:${VERSION} .
        ;;
    3)
        echo -e "${BLUE}🌐 执行多架构构建...${NC}"
        docker buildx build --platform linux/amd64,linux/arm64 -t ${IMAGE_NAME}:${VERSION} . --load
        ;;
    *)
        echo -e "${RED}❌ 无效选择${NC}"
        exit 1
        ;;
esac

# 验证构建结果
if docker images | grep -q "${IMAGE_NAME}.*${VERSION}"; then
    echo -e "${GREEN}✅ 构建成功！${NC}"
    
    # 显示镜像信息
    echo
    echo -e "${CYAN}📊 镜像信息:${NC}"
    docker images | grep "${IMAGE_NAME}.*${VERSION}"
    
    # 询问是否运行测试
    read -p "是否运行测试容器? [y/N]: " test_container
    if [[ $test_container =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🧪 启动测试容器...${NC}"
        docker run -d --name homeman-test -p 3100:3100 ${IMAGE_NAME}:${VERSION}
        
        # 等待容器启动
        sleep 5
        
        # 健康检查
        if curl -f http://localhost:3100/ &> /dev/null; then
            echo -e "${GREEN}✅ 容器运行正常！访问: http://localhost:3100${NC}"
        else
            echo -e "${RED}❌ 容器启动失败${NC}"
            docker logs homeman-test
        fi
        
        echo -e "${YELLOW}💡 测试完成后请手动清理: docker rm -f homeman-test${NC}"
    fi
    
    # 询问是否推送到仓库
    if [[ -n "$REGISTRY" ]]; then
        read -p "是否推送到仓库 ${REGISTRY}? [y/N]: " push_image
        if [[ $push_image =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}📤 推送镜像到仓库...${NC}"
            docker tag ${IMAGE_NAME}:${VERSION} ${REGISTRY}/${IMAGE_NAME}:${VERSION}
            docker push ${REGISTRY}/${IMAGE_NAME}:${VERSION}
            echo -e "${GREEN}✅ 推送完成！${NC}"
        fi
    fi
    
else
    echo -e "${RED}❌ 构建失败！${NC}"
    exit 1
fi

echo
echo -e "${PURPLE}🎉 所有操作完成！${NC}" 