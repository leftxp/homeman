@echo off
setlocal enabledelayedexpansion

REM Homeman Docker 构建脚本 (Windows)

set VERSION=%1
if "%VERSION%"=="" set VERSION=latest
set IMAGE_NAME=homeman
set REGISTRY=%REGISTRY%

echo 🐳 开始构建 Homeman Docker 镜像...

REM 检查 Docker 是否安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker 未安装，请先安装 Docker Desktop
    pause
    exit /b 1
)

REM 构建选项
echo.
echo 选择构建类型:
echo 1) 基础构建 (开发/测试)
echo 2) 优化构建 (生产环境)
echo 3) 多架构构建 (AMD64 + ARM64)
set /p choice="请选择 [1-3]: "

if "%choice%"=="1" (
    echo 📦 执行基础构建...
    docker build -t %IMAGE_NAME%:%VERSION% .
) else if "%choice%"=="2" (
    echo 🚀 执行优化构建...
    docker build -f Dockerfile.optimized -t %IMAGE_NAME%:%VERSION% .
) else if "%choice%"=="3" (
    echo 🌐 执行多架构构建...
    docker buildx build --platform linux/amd64,linux/arm64 -t %IMAGE_NAME%:%VERSION% . --load
) else (
    echo ❌ 无效选择
    pause
    exit /b 1
)

REM 验证构建结果
docker images | findstr "%IMAGE_NAME%.*%VERSION%" >nul
if errorlevel 1 (
    echo ❌ 构建失败！
    pause
    exit /b 1
)

echo ✅ 构建成功！

REM 显示镜像信息
echo.
echo 📊 镜像信息:
docker images | findstr "%IMAGE_NAME%.*%VERSION%"

REM 询问是否运行测试
echo.
set /p test_container="是否运行测试容器? [y/N]: "
if /i "%test_container%"=="y" (
    echo 🧪 启动测试容器...
    docker run -d --name homeman-test -p 8000:8000 %IMAGE_NAME%:%VERSION%
    
    REM 等待容器启动
    timeout /t 5 /nobreak >nul
    
    REM 简单的健康检查
    curl -f http://localhost:8000/ >nul 2>&1
    if errorlevel 1 (
        echo ❌ 容器启动失败
        docker logs homeman-test
    ) else (
        echo ✅ 容器运行正常！访问: http://localhost:8000
    )
    
    echo 💡 测试完成后请手动清理: docker rm -f homeman-test
)

REM 询问是否推送到仓库
if not "%REGISTRY%"=="" (
    echo.
    set /p push_image="是否推送到仓库 %REGISTRY%? [y/N]: "
    if /i "!push_image!"=="y" (
        echo 📤 推送镜像到仓库...
        docker tag %IMAGE_NAME%:%VERSION% %REGISTRY%/%IMAGE_NAME%:%VERSION%
        docker push %REGISTRY%/%IMAGE_NAME%:%VERSION%
        echo ✅ 推送完成！
    )
)

echo.
echo 🎉 所有操作完成！
pause 