@echo off
echo 🏠 Starting Homeman - Homepage 配置管理器

REM 检查 Python 是否安装
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python 未安装或未添加到 PATH
    pause
    exit /b 1
)

REM 创建配置目录
echo 📁 创建配置目录...
if not exist config mkdir config

REM 安装依赖
echo 📦 安装依赖...
pip install -r requirements.txt

REM 设置环境变量
if not defined HOMEPAGE_CONFIG_PATH (
    set HOMEPAGE_CONFIG_PATH=%cd%\config
)
if not defined FLASK_ENV (
    set FLASK_ENV=development
)

echo 🔧 配置路径: %HOMEPAGE_CONFIG_PATH%
echo 🌍 Flask 环境: %FLASK_ENV%

REM 启动应用
echo 🚀 启动应用...
python app.py

pause 