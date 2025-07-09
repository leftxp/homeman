#!/bin/bash

# Homeman DockerHub 构建和推送脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Homeman -> DockerHub 构建推送工具${NC}"
echo "=========================================="

# 配置变量
DOCKERHUB_USERNAME=${1:-""}
VERSION=${2:-"latest"}

if [[ -z "$DOCKERHUB_USERNAME" ]]; then
    read -p "请输入你的DockerHub用户名: " DOCKERHUB_USERNAME
fi

IMAGE_NAME="homeman"
FULL_IMAGE_NAME="$DOCKERHUB_USERNAME/$IMAGE_NAME"

echo
echo -e "${CYAN}📋 构建配置:${NC}"
echo "  - DockerHub用户名: $DOCKERHUB_USERNAME"
echo "  - 镜像名称: $FULL_IMAGE_NAME:$VERSION"
echo "  - 目标平台: Linux (amd64/arm64)"
echo

# 检查 Docker 是否安装并运行
echo -e "${BLUE}🔍 检查Docker环境...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装或未运行，请先安装 Docker${NC}"
    echo -e "${YELLOW}💡 安装指南: https://docs.docker.com/engine/install/${NC}"
    exit 1
fi

# 检查 Docker 是否运行
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker 服务未运行，请启动 Docker 服务${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker环境检查通过${NC}"

# 登录 DockerHub
echo
echo -e "${BLUE}🔐 登录DockerHub...${NC}"
if ! docker login; then
    echo -e "${RED}❌ DockerHub登录失败${NC}"
    exit 1
fi

echo -e "${GREEN}✅ DockerHub登录成功${NC}"

# 构建选项
echo
echo -e "${YELLOW}🏗️ 选择构建类型:${NC}"
echo "1) 优化构建 (推荐，生产就绪)"
echo "2) 基础构建 (开发测试)"
echo "3) 多架构构建 (AMD64 + ARM64，推荐)"
read -p "请选择 [1-3]: " choice

BUILD_SUCCESS=0
MULTI_ARCH=0

case $choice in
    1)
        echo -e "${BLUE}🚀 执行优化构建 (Linux amd64)...${NC}"
        docker build -f Dockerfile.optimized -t "$FULL_IMAGE_NAME:$VERSION" --platform linux/amd64 .
        BUILD_SUCCESS=1
        ;;
    2)
        echo -e "${BLUE}📦 执行基础构建 (Linux amd64)...${NC}"
        docker build -t "$FULL_IMAGE_NAME:$VERSION" --platform linux/amd64 .
        BUILD_SUCCESS=1
        ;;
    3)
        echo -e "${BLUE}🌐 执行多架构构建 (Linux amd64/arm64)...${NC}"
        # 创建 buildx builder
        docker buildx create --use --name homeman-builder &> /dev/null || true
        docker buildx build --platform linux/amd64,linux/arm64 -f Dockerfile.optimized -t "$FULL_IMAGE_NAME:$VERSION" . --push
        BUILD_SUCCESS=1
        MULTI_ARCH=1
        ;;
    *)
        echo -e "${RED}❌ 无效选择${NC}"
        exit 1
        ;;
esac

# 验证构建结果 (单架构构建)
if [[ $MULTI_ARCH -eq 0 ]]; then
    if ! docker images | grep -q "$FULL_IMAGE_NAME.*$VERSION"; then
        echo -e "${RED}❌ 构建失败！${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 构建成功！${NC}"
    
    # 显示镜像信息
    echo
    echo -e "${CYAN}📊 镜像信息:${NC}"
    docker images | grep "$FULL_IMAGE_NAME.*$VERSION"
    
    # 推送到 DockerHub
    echo
    echo -e "${BLUE}📤 推送镜像到 DockerHub...${NC}"
    if ! docker push "$FULL_IMAGE_NAME:$VERSION"; then
        echo -e "${RED}❌ 推送失败！${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 推送成功！${NC}"
else
    echo -e "${GREEN}✅ 多架构构建和推送完成！${NC}"
fi

# 如果版本不是latest，同时推送latest标签
if [[ "$VERSION" != "latest" ]]; then
    echo
    read -p "是否同时创建 latest 标签? [y/N]: " tag_latest
    if [[ $tag_latest =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🏷️ 创建 latest 标签...${NC}"
        if [[ $MULTI_ARCH -eq 0 ]]; then
            docker tag "$FULL_IMAGE_NAME:$VERSION" "$FULL_IMAGE_NAME:latest"
            docker push "$FULL_IMAGE_NAME:latest"
        else
            docker buildx build --platform linux/amd64,linux/arm64 -f Dockerfile.optimized -t "$FULL_IMAGE_NAME:latest" . --push
        fi
        echo -e "${GREEN}✅ latest 标签推送完成！${NC}"
    fi
fi

# 显示最终结果
echo
echo -e "${PURPLE}🎉 ==========================================${NC}"
echo -e "${PURPLE}   DockerHub 发布完成！${NC}"
echo -e "${PURPLE}==========================================${NC}"
echo
echo -e "${CYAN}📦 镜像地址:${NC}"
echo "   docker pull $FULL_IMAGE_NAME:$VERSION"
if [[ "$VERSION" != "latest" ]]; then
    echo "   docker pull $FULL_IMAGE_NAME:latest"
fi
echo
echo -e "${CYAN}🌐 DockerHub页面:${NC}"
echo "   https://hub.docker.com/r/$DOCKERHUB_USERNAME/$IMAGE_NAME"
echo
echo -e "${CYAN}🚀 运行命令:${NC}"
echo "   docker run -d -p 8000:8000 $FULL_IMAGE_NAME:$VERSION"
echo

# 询问是否本地测试
read -p "是否在本地测试刚推送的镜像? [y/N]: " test_local
if [[ $test_local =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🧪 启动测试容器...${NC}"
    docker run -d --name homeman-dockerhub-test -p 8001:8000 "$FULL_IMAGE_NAME:$VERSION"
    
    echo -e "${YELLOW}💡 容器已启动在端口 8001${NC}"
    echo -e "${YELLOW}💡 访问: http://localhost:8001${NC}"
    echo -e "${YELLOW}💡 测试完成后请清理: docker rm -f homeman-dockerhub-test${NC}"
fi

echo -e "${GREEN}🎊 所有操作完成！${NC}" 