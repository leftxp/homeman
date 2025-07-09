#!/usr/bin/env python3
"""
Homeman 应用程序测试脚本
"""

import requests
import time
import json

def test_application():
    """测试应用程序的基本功能"""
    base_url = "http://localhost:8000"
    
    print("🧪 开始测试 Homeman 应用程序...")
    
    # 等待应用程序启动
    print("⏳ 等待应用程序启动...")
    time.sleep(3)
    
    tests = [
        ("主页", "/"),
        ("全局设置", "/settings"),
        ("书签管理", "/bookmarks"),
        ("Docker 管理", "/docker"),
        ("服务管理", "/services"),
        ("配置管理", "/config"),
        ("备份API", "/api/backup")
    ]
    
    results = []
    
    for name, path in tests:
        try:
            response = requests.get(f"{base_url}{path}", timeout=5)
            if response.status_code == 200:
                print(f"✅ {name} ({path}) - 正常")
                results.append(True)
            else:
                print(f"❌ {name} ({path}) - 状态码: {response.status_code}")
                results.append(False)
        except Exception as e:
            print(f"❌ {name} ({path}) - 错误: {str(e)}")
            results.append(False)
    
    # 测试设置保存
    print("\n🔧 测试设置保存功能...")
    try:
        settings_data = {
            'title': 'Test Homepage',
            'theme': 'dark',
            'language': 'zh-CN'
        }
        
        response = requests.post(f"{base_url}/settings", data=settings_data, timeout=5)
        if response.status_code in [200, 302]:  # 302 是重定向
            print("✅ 设置保存 - 正常")
            results.append(True)
        else:
            print(f"❌ 设置保存 - 状态码: {response.status_code}")
            results.append(False)
    except Exception as e:
        print(f"❌ 设置保存 - 错误: {str(e)}")
        results.append(False)
    
    # 测试书签保存
    print("\n📖 测试书签保存功能...")
    try:
        bookmarks_data = [
            {
                "测试分组": [
                    {
                        "GitHub": {
                            "href": "https://github.com",
                            "abbr": "GH",
                            "description": "代码托管平台"
                        }
                    }
                ]
            }
        ]
        
        response = requests.post(
            f"{base_url}/bookmarks",
            json=bookmarks_data,
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('status') == 'success':
                print("✅ 书签保存 - 正常")
                results.append(True)
            else:
                print(f"❌ 书签保存 - 响应: {result}")
                results.append(False)
        else:
            print(f"❌ 书签保存 - 状态码: {response.status_code}")
            results.append(False)
    except Exception as e:
        print(f"❌ 书签保存 - 错误: {str(e)}")
        results.append(False)
    
    # 汇总结果
    passed = sum(results)
    total = len(results)
    
    print(f"\n📊 测试结果汇总:")
    print(f"✅ 通过: {passed}/{total}")
    print(f"❌ 失败: {total - passed}/{total}")
    
    if passed == total:
        print("\n🎉 所有测试通过！Homeman 应用程序运行正常。")
        return True
    else:
        print("\n⚠️  部分测试失败，请检查应用程序配置。")
        return False

if __name__ == "__main__":
    success = test_application()
    exit(0 if success else 1) 