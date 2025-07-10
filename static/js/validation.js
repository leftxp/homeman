/**
 * Homeman 前端验证和错误处理工具
 */

class Validator {
    constructor() {
        this.init();
    }

    init() {
        // 为所有表单添加验证
        document.addEventListener('DOMContentLoaded', () => {
            this.setupFormValidation();
            this.setupErrorHandling();
        });
    }

    setupFormValidation() {
        // 为所有带有 data-validate 属性的表单添加验证
        const forms = document.querySelectorAll('form[data-validate]');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                }
            });
        });

        // 实时验证输入框
        document.addEventListener('input', (e) => {
            if (e.target.matches('input[required], input[type="url"], input[type="email"]') && 
                !e.target.hasAttribute('data-no-validate')) {
                this.validateField(e.target);
            }
        });
    }

    setupErrorHandling() {
        // 全局错误处理
        window.addEventListener('unhandledrejection', (e) => {
            console.error('未处理的 Promise 错误:', e.reason);
            this.showError('发生了意外错误，请稍后重试');
        });

        window.addEventListener('error', (e) => {
            console.error('JavaScript 错误:', e.error);
            this.showError('页面出现错误，建议刷新重试');
        });
    }

    validateForm(form) {
        let isValid = true;
        const fields = form.querySelectorAll('input[required], select[required], textarea[required]');
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateField(field) {
        // 跳过带有 data-no-validate 属性的字段
        if (field.hasAttribute('data-no-validate')) {
            return true;
        }

        const value = field.value.trim();
        const type = field.type;
        const required = field.hasAttribute('required');
        let isValid = true;
        let message = '';

        // 清除之前的错误样式
        this.clearFieldError(field);

        // 必填字段验证
        if (required && !value) {
            isValid = false;
            message = '此字段为必填项';
        }
        // URL 验证
        else if (type === 'url' && value && !this.isValidUrl(value)) {
            isValid = false;
            message = '请输入有效的 URL 地址';
        }
        // 邮箱验证
        else if (type === 'email' && value && !this.isValidEmail(value)) {
            isValid = false;
            message = '请输入有效的邮箱地址';
        }
        // 数字验证
        else if (type === 'number' && value) {
            const min = field.getAttribute('min');
            const max = field.getAttribute('max');
            const numValue = parseFloat(value);
            
            if (isNaN(numValue)) {
                isValid = false;
                message = '请输入有效的数字';
            } else if (min && numValue < parseFloat(min)) {
                isValid = false;
                message = `数值不能小于 ${min}`;
            } else if (max && numValue > parseFloat(max)) {
                isValid = false;
                message = `数值不能大于 ${max}`;
            }
        }
        // JSON 验证（自定义属性）
        else if (field.hasAttribute('data-validate-json') && value) {
            try {
                JSON.parse(value);
            } catch (e) {
                isValid = false;
                message = '请输入有效的 JSON 格式';
            }
        }

        if (!isValid) {
            this.showFieldError(field, message);
        }

        return isValid;
    }

    showFieldError(field, message) {
        field.classList.add('is-invalid');
        
        // 移除现有的错误消息
        const existingError = field.parentNode.querySelector('.invalid-feedback');
        if (existingError) {
            existingError.remove();
        }

        // 添加错误消息
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('is-invalid');
        const errorDiv = field.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // 通用的成功/错误提示
    showSuccess(message, duration = 3000) {
        this.showToast(message, 'success', duration);
    }

    showError(message, duration = 5000) {
        this.showToast(message, 'danger', duration);
    }

    showWarning(message, duration = 4000) {
        this.showToast(message, 'warning', duration);
    }

    showInfo(message, duration = 3000) {
        this.showToast(message, 'info', duration);
    }

    showToast(message, type = 'info', duration = 3000) {
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
                    ${this.escapeHtml(message)}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toast);

        // 显示 toast
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: duration
        });
        bsToast.show();

        // 自动移除
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 加载状态管理
    showLoading(element, text = '加载中...') {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (!element) return;

        element.disabled = true;
        element.setAttribute('data-original-text', element.innerHTML);
        element.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            ${text}
        `;
    }

    hideLoading(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (!element) return;

        element.disabled = false;
        const originalText = element.getAttribute('data-original-text');
        if (originalText) {
            element.innerHTML = originalText;
            element.removeAttribute('data-original-text');
        }
    }

    // API 请求封装
    async apiRequest(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        try {
            const response = await fetch(url, defaultOptions);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API 请求失败:', error);
            throw error;
        }
    }

    // 确认对话框
    async confirm(message, title = '确认操作') {
        return new Promise((resolve) => {
            // 如果存在现有的确认框，先移除
            const existingModal = document.getElementById('confirm-modal');
            if (existingModal) {
                existingModal.remove();
            }

            // 创建确认框
            const modal = document.createElement('div');
            modal.id = 'confirm-modal';
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${this.escapeHtml(title)}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${this.escapeHtml(message)}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-danger" id="confirm-btn">确认</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();

            // 处理确认按钮
            modal.querySelector('#confirm-btn').addEventListener('click', () => {
                bsModal.hide();
                resolve(true);
            });

            // 处理取消（包括关闭）
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
                resolve(false);
            });
        });
    }
}

// 创建全局实例
window.validator = new Validator();

// 导出一些常用方法到全局
window.showSuccess = (message, duration) => validator.showSuccess(message, duration);
window.showError = (message, duration) => validator.showError(message, duration);
window.showWarning = (message, duration) => validator.showWarning(message, duration);
window.showInfo = (message, duration) => validator.showInfo(message, duration);
window.showLoading = (element, text) => validator.showLoading(element, text);
window.hideLoading = (element) => validator.hideLoading(element);
window.apiRequest = (url, options) => validator.apiRequest(url, options);
window.confirmAction = (message, title) => validator.confirm(message, title);

/**
 * 书签相关的工具函数
 */
class BookmarkUtils {
    /**
     * 从URL提取网站信息
     * @param {string} url - 网址
     * @returns {object} 包含名称、缩写、域名等信息
     */
    static extractSiteInfo(url) {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;
            
            // 去掉 www. 前缀
            const domain = hostname.replace(/^www\./, '');
            
            // 获取主域名（去掉子域名）
            const parts = domain.split('.');
            let siteName = parts[0];
            
            // 常见网站的特殊处理
            const siteNameMap = {
                'github': 'GitHub',
                'gitlab': 'GitLab',
                'stackoverflow': 'Stack Overflow',
                'youtube': 'YouTube',
                'google': 'Google',
                'microsoft': 'Microsoft',
                'apple': 'Apple',
                'amazon': 'Amazon',
                'facebook': 'Facebook',
                'twitter': 'Twitter',
                'linkedin': 'LinkedIn',
                'instagram': 'Instagram',
                'reddit': 'Reddit',
                'wikipedia': 'Wikipedia',
                'medium': 'Medium',
                'netflix': 'Netflix',
                'spotify': 'Spotify',
                'dropbox': 'Dropbox',
                'slack': 'Slack',
                'discord': 'Discord',
                'telegram': 'Telegram',
                'whatsapp': 'WhatsApp',
                'zoom': 'Zoom',
                'notion': 'Notion',
                'trello': 'Trello',
                'figma': 'Figma',
                'canva': 'Canva',
                'adobe': 'Adobe',
                'atlassian': 'Atlassian',
                'jetbrains': 'JetBrains',
                'docker': 'Docker',
                'kubernetes': 'Kubernetes',
                'aws': 'AWS',
                'azure': 'Azure',
                'gcp': 'Google Cloud',
                'digitalocean': 'DigitalOcean',
                'heroku': 'Heroku',
                'vercel': 'Vercel',
                'netlify': 'Netlify',
                'cloudflare': 'Cloudflare'
            };
            
            // 使用映射表或首字母大写
            const displayName = siteNameMap[siteName.toLowerCase()] || 
                               siteName.charAt(0).toUpperCase() + siteName.slice(1);
            
            // 生成缩写
            let abbr = '';
            if (displayName.includes(' ')) {
                // 多个单词：取每个单词的首字母
                abbr = displayName.split(' ')
                    .map(word => word.charAt(0))
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();
            } else {
                // 单个单词：取前两个字符
                abbr = displayName.substring(0, 2).toUpperCase();
            }
            
            return {
                name: displayName,
                abbr: abbr,
                domain: domain,
                hostname: hostname,
                protocol: urlObj.protocol,
                port: urlObj.port
            };
        } catch (e) {
            console.warn('URL 解析失败:', e);
            return {
                name: '',
                abbr: '',
                domain: '',
                hostname: '',
                protocol: '',
                port: ''
            };
        }
    }
    
    /**
     * 验证图标格式
     * @param {string} icon - 图标字符串
     * @returns {boolean} 是否有效
     */
    static validateIcon(icon) {
        if (!icon) return true;  // 空值允许
        
        // 文件名格式
        if (/^[a-zA-Z0-9_-]+\.(png|jpg|jpeg|gif|svg|webp)$/i.test(icon)) {
            return true;
        }
        
        // MDI 图标格式
        if (/^mdi-[a-zA-Z0-9_-]+$/i.test(icon)) {
            return true;
        }
        
        // Simple Icons 格式
        if (/^si-[a-zA-Z0-9_-]+$/i.test(icon)) {
            return true;
        }
        
        // selfh.st icons 格式
        if (/^sh-[a-zA-Z0-9_-]+(\.(svg|png|webp))?$/i.test(icon)) {
            return true;
        }
        
        // 完整 URL
        try {
            new URL(icon);
            return true;
        } catch (e) {
            // 不是有效 URL
        }
        
        // 本地路径
        if (icon.startsWith('/') || icon.startsWith('./') || icon.startsWith('../')) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 获取网站图标URL
     * @param {string} url - 网址
     * @returns {string} 图标URL
     */
    static getFaviconUrl(url) {
        try {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`;
        } catch (e) {
            return '';
        }
    }
    
    /**
     * 批量验证书签数据
     * @param {Array} bookmarks - 书签数组
     * @returns {object} 验证结果
     */
    static validateBookmarks(bookmarks) {
        const errors = [];
        const warnings = [];
        
        if (!Array.isArray(bookmarks)) {
            errors.push('书签数据必须是数组格式');
            return { valid: false, errors, warnings };
        }
        
        bookmarks.forEach((group, groupIndex) => {
            if (typeof group !== 'object' || Array.isArray(group)) {
                errors.push(`分组 #${groupIndex + 1} 格式错误：必须是对象`);
                return;
            }
            
            const groupKeys = Object.keys(group);
            if (groupKeys.length !== 1) {
                errors.push(`分组 #${groupIndex + 1} 应该只包含一个分组名称`);
                return;
            }
            
            const groupName = groupKeys[0];
            const items = group[groupName];
            
            if (!Array.isArray(items)) {
                errors.push(`分组 "${groupName}" 的内容必须是数组`);
                return;
            }
            
            items.forEach((item, itemIndex) => {
                if (typeof item !== 'object' || Array.isArray(item)) {
                    errors.push(`分组 "${groupName}" 中的项目 #${itemIndex + 1} 格式错误`);
                    return;
                }
                
                const itemKeys = Object.keys(item);
                if (itemKeys.length !== 1) {
                    errors.push(`分组 "${groupName}" 中的项目 #${itemIndex + 1} 应该只包含一个书签名称`);
                    return;
                }
                
                const bookmarkName = itemKeys[0];
                const config = item[bookmarkName];
                
                if (!Array.isArray(config) || config.length === 0) {
                    errors.push(`书签 "${bookmarkName}" 的配置无效`);
                    return;
                }
                
                const bookmarkData = config[0];
                if (!bookmarkData.href) {
                    errors.push(`书签 "${bookmarkName}" 缺少链接地址`);
                }
                
                // 验证 URL
                try {
                    new URL(bookmarkData.href);
                } catch (e) {
                    errors.push(`书签 "${bookmarkName}" 的链接地址格式无效`);
                }
                
                // 验证图标
                if (bookmarkData.icon && !this.validateIcon(bookmarkData.icon)) {
                    warnings.push(`书签 "${bookmarkName}" 的图标格式可能无效`);
                }
                
                // 验证缩写长度
                if (bookmarkData.abbr && bookmarkData.abbr.length > 2) {
                    warnings.push(`书签 "${bookmarkName}" 的缩写过长，建议不超过2个字符`);
                }
            });
        });
        
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
}

// 导出到全局
window.BookmarkUtils = BookmarkUtils;

// 创建全局Validator实例
document.addEventListener('DOMContentLoaded', function() {
    window.validator = new Validator();
    window.validator.init();
}); 