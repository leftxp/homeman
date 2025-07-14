/**
 * Homeman 主要JavaScript文件
 * 包含公共功能和工具函数
 */

// ===== 全局配置 =====
window.HomemanApp = {
    initialized: false,
    
    // 初始化应用
    init: function() {
        if (this.initialized) return;
        
        this.setupGlobalEvents();
        this.setupAutoHideAlerts();
        this.initialized = true;
        
        console.log('Homeman App initialized');
    },
    
    // 设置全局事件
    setupGlobalEvents: function() {
        // 页面加载完成后初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.finishInitialization();
            });
        } else {
            this.finishInitialization();
        }
    },
    
    // 完成初始化
    finishInitialization: function() {
        // 可以在这里添加其他初始化逻辑
    },
    
    // 设置自动隐藏消息提示
    setupAutoHideAlerts: function() {
        setTimeout(() => {
            const alerts = document.querySelectorAll('.alert');
            alerts.forEach((alert) => {
                if (window.bootstrap && window.bootstrap.Alert) {
                    const bsAlert = new bootstrap.Alert(alert);
                    if (bsAlert) {
                        bsAlert.close();
                    }
                }
            });
        }, 5000);
    }
};

// ===== 备份配置功能 =====
function backupConfig() {
    fetch('/api/backup')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showSuccess('配置备份成功！\n备份路径: ' + data.backup_path);
            } else {
                showError('备份失败: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('备份失败: ' + error.message);
        });
}

// ===== 通用提示功能 =====
function showSuccess(message) {
    createToast(message, 'success');
}

function showError(message) {
    createToast(message, 'danger');
}

function showInfo(message) {
    createToast(message, 'info');
}

function showWarning(message) {
    createToast(message, 'warning');
}

function createToast(message, type) {
    // 创建 toast 容器（如果不存在）
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    // 创建 toast
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${escapeHtml(message)}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    toastContainer.appendChild(toast);

    // 显示 toast
    if (window.bootstrap && window.bootstrap.Toast) {
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: type === 'success' ? 3000 : 5000
        });
        bsToast.show();

        // 自动移除
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
}

// ===== 工具函数 =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// URL处理工具
function normalizeUrl(url) {
    if (!url) return url;
    
    url = url.trim();
    
    // 如果已经有协议，直接返回
    if (/^https?:\/\//i.test(url)) {
        return url;
    }
    
    // 如果是本地地址或IP，使用http
    if (/^(localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)/i.test(url)) {
        return 'http://' + url;
    }
    
    // 其他情况使用http
    return 'http://' + url;
}

// 验证Web URL
function isValidWebUrl(url) {
    try {
        const urlObj = new URL(url);
        
        // 必须是http或https协议
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return false;
        }
        
        // 必须有hostname
        if (!urlObj.hostname) {
            return false;
        }
        
        // 检查是否是有效的域名或IP
        const hostname = urlObj.hostname;
        
        // 本地地址总是有效
        if (['localhost', '127.0.0.1'].includes(hostname)) {
            return true;
        }
        
        // IP地址格式检查
        const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
        if (ipRegex.test(hostname)) {
            const parts = hostname.split('.');
            return parts.every(part => {
                const num = parseInt(part, 10);
                return num >= 0 && num <= 255;
            });
        }
        
        // 域名格式检查
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!domainRegex.test(hostname)) {
            return false;
        }
        
        // 必须有顶级域名（除非是IP或localhost）
        if (!hostname.includes('.') && !['localhost'].includes(hostname) && !ipRegex.test(hostname)) {
            return false;
        }
        
        return true;
    } catch (e) {
        return false;
    }
}

// 输入验证工具
function setInputError(input) {
    input.classList.add('is-invalid');
    const errorDiv = input.parentNode.querySelector('.invalid-feedback');
    if (errorDiv) {
        errorDiv.remove();
    }
}

function clearInputError(input) {
    input.classList.remove('is-invalid');
    const errorDiv = input.parentNode.querySelector('.invalid-feedback');
    if (errorDiv) {
        errorDiv.remove();
    }
    
    // 如果validator实例存在，也调用它的清除方法
    if (window.validator && typeof window.validator.clearFieldError === 'function') {
        window.validator.clearFieldError(input);
    }
}

// ===== 自动初始化 =====
// 当脚本加载完成后自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.HomemanApp.init();
    });
} else {
    window.HomemanApp.init();
} 