/**
 * 设置页面JavaScript
 * 处理设置页面的所有功能
 */

// 设置页面相关变量
let settingsData = {};
let hasUnsavedChanges = false;

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('Settings page initialized');
    
    // 初始化设置管理器
    if (window.SettingsManager) {
        window.SettingsManager.init();
    }
    
    // 监听表单变化
    setupFormChangeTracking();
    
    // 设置页面特有的事件监听
    setupSettingsEventListeners();
});

// 设置表单变化跟踪
function setupFormChangeTracking() {
    const form = document.getElementById('settingsForm');
    if (form) {
        form.addEventListener('change', function() {
            hasUnsavedChanges = true;
            updateSaveButtonState();
        });
        
        form.addEventListener('input', function() {
            hasUnsavedChanges = true;
            updateSaveButtonState();
        });
    }
}

// 设置页面事件监听
function setupSettingsEventListeners() {
    // 监听页面离开事件
    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '你有未保存的更改，确定要离开吗？';
        }
    });
    
    // 监听Ctrl+S快捷键
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveSettings();
        }
    });
}

// 更新保存按钮状态
function updateSaveButtonState() {
    const saveButton = document.querySelector('button[type="submit"]');
    if (saveButton) {
        if (hasUnsavedChanges) {
            saveButton.classList.add('btn-warning');
            saveButton.classList.remove('btn-primary');
            saveButton.innerHTML = '<i class="fas fa-save"></i> 保存更改';
        } else {
            saveButton.classList.add('btn-primary');
            saveButton.classList.remove('btn-warning');
            saveButton.innerHTML = '<i class="fas fa-save"></i> 保存设置';
        }
    }
}

// 重置表单
function resetForm() {
    if (confirm('确定要重置所有设置吗？这将清空所有未保存的更改。')) {
        const form = document.getElementById('settingsForm');
        if (form) {
            form.reset();
            hasUnsavedChanges = false;
            updateSaveButtonState();
            showSuccess('表单已重置');
        }
    }
}

// 保存设置
function saveSettings() {
    const form = document.getElementById('settingsForm');
    if (form) {
        // 显示加载状态
        const saveButton = document.querySelector('button[type="submit"]');
        if (saveButton) {
            const originalText = saveButton.innerHTML;
            saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 保存中...';
            saveButton.disabled = true;
            
            // 提交表单
            form.submit();
            
            // 标记为已保存
            hasUnsavedChanges = false;
            
            // 恢复按钮状态（如果提交失败）
            setTimeout(() => {
                saveButton.innerHTML = originalText;
                saveButton.disabled = false;
            }, 2000);
        }
    }
}

// 颜色方案预览
function previewColorScheme(scheme) {
    const preview = document.getElementById('colorSchemePreview');
    if (preview) {
        preview.innerHTML = `
            <div class="color-preview-item">
                <div class="color-swatch" style="background-color: var(--${scheme}-primary, #007bff)"></div>
                <span>${scheme}</span>
            </div>
        `;
    }
}

// 主题切换预览
function previewTheme(theme) {
    const preview = document.getElementById('themePreview');
    if (preview) {
        preview.innerHTML = `
            <div class="theme-preview-item ${theme}">
                <div class="preview-card">
                    <div class="preview-header">Header</div>
                    <div class="preview-content">Content Area</div>
                </div>
            </div>
        `;
    }
}

// 页眉样式预览
function previewHeaderStyle(style) {
    const preview = document.getElementById('headerStylePreview');
    if (preview) {
        preview.innerHTML = `
            <div class="header-preview-item ${style}">
                <div class="preview-header">Homepage Header (${style})</div>
            </div>
        `;
    }
}

// 折叠功能预览
function previewCollapseFeature(enabled) {
    const preview = document.getElementById('collapsePreview');
    if (preview) {
        preview.innerHTML = enabled ? 
            '<i class="fas fa-chevron-down"></i> 分组可折叠' : 
            '<i class="fas fa-expand"></i> 分组展开';
    }
}

// 布局预览
function previewLayout(maxColumns, useEqualHeight) {
    const preview = document.getElementById('layoutPreview');
    if (preview) {
        const gridClass = `grid-cols-${maxColumns}`;
        const heightClass = useEqualHeight ? 'equal-height' : '';
        
        preview.innerHTML = `
            <div class="layout-preview ${gridClass} ${heightClass}">
                ${Array(maxColumns).fill(0).map((_, i) => 
                    `<div class="preview-column">列 ${i + 1}</div>`
                ).join('')}
            </div>
        `;
    }
}

// 搜索提供商切换
function onSearchProviderChange(provider) {
    const customUrlGroup = document.getElementById('customSearchUrlGroup');
    if (customUrlGroup) {
        if (provider === 'custom') {
            customUrlGroup.style.display = 'block';
            customUrlGroup.querySelector('input').required = true;
        } else {
            customUrlGroup.style.display = 'none';
            customUrlGroup.querySelector('input').required = false;
        }
    }
}

// 验证URL格式
function validateUrl(input) {
    const url = input.value.trim();
    if (url && !isValidWebUrl(url)) {
        setInputError(input, '请输入有效的URL地址');
        return false;
    }
    clearInputError(input);
    return true;
}

// 验证数字范围
function validateNumberRange(input, min, max) {
    const value = parseInt(input.value);
    if (isNaN(value) || value < min || value > max) {
        setInputError(input, `请输入 ${min} 到 ${max} 之间的数字`);
        return false;
    }
    clearInputError(input);
    return true;
}

// 表单验证
function validateSettingsForm() {
    let isValid = true;
    
    // 验证基础URL
    const baseUrlInput = document.getElementById('baseUrl');
    if (baseUrlInput && !validateUrl(baseUrlInput)) {
        isValid = false;
    }
    
    // 验证自定义图标URL
    const faviconInput = document.getElementById('favicon');
    if (faviconInput && faviconInput.value.trim() && !validateUrl(faviconInput)) {
        isValid = false;
    }
    
    // 验证背景图片URL
    const backgroundImageInput = document.getElementById('backgroundImage');
    if (backgroundImageInput && backgroundImageInput.value.trim() && !validateUrl(backgroundImageInput)) {
        isValid = false;
    }
    
    // 验证列数设置
    const columnsInput = document.getElementById('columns');
    if (columnsInput && !validateNumberRange(columnsInput, 1, 8)) {
        isValid = false;
    }
    
    // 验证书签列数设置
    const bookmarkColumnsInput = document.getElementById('bookmarkColumns');
    if (bookmarkColumnsInput && !validateNumberRange(bookmarkColumnsInput, 1, 8)) {
        isValid = false;
    }
    
    // 验证自定义搜索URL
    const customSearchInput = document.getElementById('customSearchUrl');
    if (customSearchInput && customSearchInput.style.display !== 'none' && !validateUrl(customSearchInput)) {
        isValid = false;
    }
    
    return isValid;
}

// 高级设置提示
function showAdvancedTip(setting) {
    const tips = {
        'widgets': '小工具配置需要在"小工具管理"页面进行详细设置',
        'services': '服务配置需要在"服务管理"页面进行详细设置',
        'docker': 'Docker配置需要在"Docker管理"页面进行详细设置',
        'yaml': '复杂配置建议使用"YAML编辑器"进行直接编辑'
    };
    
    const tip = tips[setting] || '此设置需要在相应的管理页面进行详细配置';
    showInfo(tip);
}

// 导出设置
function exportSettings() {
    const form = document.getElementById('settingsForm');
    if (form) {
        const formData = new FormData(form);
        const settings = {};
        
        for (let [key, value] of formData.entries()) {
            settings[key] = value;
        }
        
        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'homepage-settings.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showSuccess('设置已导出为JSON文件');
    }
}

// 导入设置
function importSettings(file) {
    if (file && file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const settings = JSON.parse(e.target.result);
                const form = document.getElementById('settingsForm');
                
                if (form) {
                    // 填充表单
                    for (let [key, value] of Object.entries(settings)) {
                        const input = form.querySelector(`[name="${key}"]`);
                        if (input) {
                            if (input.type === 'checkbox') {
                                input.checked = value === 'on' || value === true;
                            } else {
                                input.value = value;
                            }
                        }
                    }
                    
                    hasUnsavedChanges = true;
                    updateSaveButtonState();
                    showSuccess('设置已导入，请检查后保存');
                }
            } catch (error) {
                showError('导入失败：JSON格式错误');
            }
        };
        reader.readAsText(file);
    } else {
        showError('请选择有效的JSON文件');
    }
}

// 页面离开清理
window.addEventListener('beforeunload', function() {
    // 清理资源
    hasUnsavedChanges = false;
}); 