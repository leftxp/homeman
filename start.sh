#!/bin/bash

# Homeman 启动脚本
echo "🏠 Starting Homeman - Homepage 配置管理器"

# 检查 Python 版本
python_version=$(python3 --version 2>&1 | grep -o '[0-9]\+\.[0-9]\+')
required_version="3.8"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Python 版本需要 3.8 或更高，当前版本: $python_version"
    exit 1
fi

# 创建配置目录
echo "📁 创建配置目录..."
mkdir -p config

# 安装依赖
echo "📦 安装依赖..."
pip3 install -r requirements.txt

# 设置环境变量
export HOMEPAGE_CONFIG_PATH=${HOMEPAGE_CONFIG_PATH:-$(pwd)/config}
export FLASK_ENV=${FLASK_ENV:-development}

echo "🔧 配置路径: $HOMEPAGE_CONFIG_PATH"
echo "🌍 Flask 环境: $FLASK_ENV"

# 启动应用
echo "🚀 启动应用..."
python3 app.py 