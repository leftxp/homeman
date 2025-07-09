@echo off
setlocal enabledelayedexpansion

REM Homeman DockerHub 构建和推送脚本

echo 🐳 Homeman -> DockerHub 构建推送工具
echo ==========================================

REM 配置变量
set DOCKERHUB_USERNAME=%1
set VERSION=%2
if "%DOCKERHUB_USERNAME%"=="" (
    set /p DOCKERHUB_USERNAME="请输入你的DockerHub用户名: "
)
if "%VERSION%"=="" set VERSION=latest

set IMAGE_NAME=homeman
set FULL_IMAGE_NAME=%DOCKERHUB_USERNAME%/%IMAGE_NAME%

echo.
echo 📋 构建配置:
echo   - DockerHub用户名: %DOCKERHUB_USERNAME%
echo   - 镜像名称: %FULL_IMAGE_NAME%:%VERSION%
echo   - 目标平台: Linux (amd64/arm64)
echo.

REM 检查 Docker 是否安装并运行
echo 🔍 检查Docker环境...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker 未安装或未运行，请先安装 Docker Desktop
    echo 💡 下载地址: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

REM 检查 Docker 是否在Linux容器模式
docker system info | findstr "OSType: linux" >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker 当前不是Linux容器模式
    echo 💡 请在Docker Desktop中切换到Linux容器模式
    pause
    exit /b 1
)

echo ✅ Docker环境检查通过

REM 登录 DockerHub
echo.
echo 🔐 登录DockerHub...
docker login
if errorlevel 1 (
    echo ❌ DockerHub登录失败
    pause
    exit /b 1
)

echo ✅ DockerHub登录成功

REM 构建选项
echo.
echo 🏗️ 选择构建类型:
echo 1) 优化构建 (推荐，生产就绪)
echo 2) 基础构建 (开发测试)
echo 3) 多架构构建 (AMD64 + ARM64，推荐)
set /p choice="请选择 [1-3]: "

if "%choice%"=="1" (
    echo 🚀 执行优化构建 (Linux amd64)...
    docker build -f Dockerfile.optimized -t %FULL_IMAGE_NAME%:%VERSION% --platform linux/amd64 .
    set BUILD_SUCCESS=1
) else if "%choice%"=="2" (
    echo 📦 执行基础构建 (Linux amd64)...
    docker build -t %FULL_IMAGE_NAME%:%VERSION% --platform linux/amd64 .
    set BUILD_SUCCESS=1
) else if "%choice%"=="3" (
    echo 🌐 执行多架构构建 (Linux amd64/arm64)...
    REM 创建 buildx builder
    docker buildx create --use --name homeman-builder >nul 2>&1
    docker buildx build --platform linux/amd64,linux/arm64 -f Dockerfile.optimized -t %FULL_IMAGE_NAME%:%VERSION% . --push
    set BUILD_SUCCESS=1
    set MULTI_ARCH=1
) else (
    echo ❌ 无效选择
    pause
    exit /b 1
)

REM 验证构建结果 (单架构构建)
if not "%MULTI_ARCH%"=="1" (
    docker images | findstr "%FULL_IMAGE_NAME%.*%VERSION%" >nul
    if errorlevel 1 (
        echo ❌ 构建失败！
        pause
        exit /b 1
    )
    
    echo ✅ 构建成功！
    
    REM 显示镜像信息
    echo.
    echo 📊 镜像信息:
    docker images | findstr "%FULL_IMAGE_NAME%.*%VERSION%"
    
    REM 推送到 DockerHub
    echo.
    echo 📤 推送镜像到 DockerHub...
    docker push %FULL_IMAGE_NAME%:%VERSION%
    if errorlevel 1 (
        echo ❌ 推送失败！
        pause
        exit /b 1
    )
    
    echo ✅ 推送成功！
) else (
    echo ✅ 多架构构建和推送完成！
)

REM 如果版本不是latest，同时推送latest标签
if not "%VERSION%"=="latest" (
    echo.
    set /p tag_latest="是否同时创建 latest 标签? [y/N]: "
    if /i "!tag_latest!"=="y" (
        echo 🏷️ 创建 latest 标签...
        if not "%MULTI_ARCH%"=="1" (
            docker tag %FULL_IMAGE_NAME%:%VERSION% %FULL_IMAGE_NAME%:latest
            docker push %FULL_IMAGE_NAME%:latest
        ) else (
            docker buildx build --platform linux/amd64,linux/arm64 -f Dockerfile.optimized -t %FULL_IMAGE_NAME%:latest . --push
        )
        echo ✅ latest 标签推送完成！
    )
)

REM 显示最终结果
echo.
echo 🎉 ==========================================
echo    DockerHub 发布完成！
echo ==========================================
echo.
echo 📦 镜像地址: 
echo    docker pull %FULL_IMAGE_NAME%:%VERSION%
if not "%VERSION%"=="latest" (
    echo    docker pull %FULL_IMAGE_NAME%:latest
)
echo.
echo 🌐 DockerHub页面: 
echo    https://hub.docker.com/r/%DOCKERHUB_USERNAME%/%IMAGE_NAME%
echo.
echo 🚀 运行命令:
echo    docker run -d -p 8000:8000 %FULL_IMAGE_NAME%:%VERSION%
echo.

REM 询问是否本地测试
set /p test_local="是否在本地测试刚推送的镜像? [y/N]: "
if /i "%test_local%"=="y" (
    echo 🧪 启动测试容器...
    docker run -d --name homeman-dockerhub-test -p 8001:8000 %FULL_IMAGE_NAME%:%VERSION%
    
    echo 💡 容器已启动在端口 8001
    echo 💡 访问: http://localhost:8001
    echo 💡 测试完成后请清理: docker rm -f homeman-dockerhub-test
)

echo 🎊 所有操作完成！
pause 