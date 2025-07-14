/**
 * YAML编辑器页面JavaScript
 * 处理YAML编辑器的所有功能
 */

// YAML编辑器相关变量
let yamlEditor = null;
let currentConfigType = 'settings';
let hasUnsavedChanges = false;
let validationTimer = null;

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('YAML Editor page initialized');
    
    // 初始化CodeMirror编辑器
    initializeEditor();
    
    // 设置事件监听
    setupEventListeners();
    
    // 加载默认配置
    loadDefaultConfig();
});

// 初始化编辑器
function initializeEditor() {
    const textarea = document.getElementById('yamlContent');
    if (textarea && window.CodeMirror) {
        yamlEditor = CodeMirror.fromTextArea(textarea, {
            mode: 'yaml',
            theme: 'monokai',
            lineNumbers: true,
            lineWrapping: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 2,
            tabSize: 2,
            indentWithTabs: false,
            extraKeys: {
                'Ctrl-S': function(cm) {
                    saveConfig();
                },
                'Ctrl-Enter': function(cm) {
                    validateYaml();
                }
            }
        });

        // 监听内容变化
        yamlEditor.on('change', function() {
            hasUnsavedChanges = true;
            updateSaveButtonState();
            
            // 延迟验证
            if (validationTimer) {
                clearTimeout(validationTimer);
            }
            validationTimer = setTimeout(validateYaml, 1000);
        });

        // 编辑器获得焦点时清除验证结果
        yamlEditor.on('focus', function() {
            clearValidationResult();
        });
    }
}

// 设置事件监听
function setupEventListeners() {
    // 页面离开提示
    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '你有未保存的更改，确定要离开吗？';
        }
    });

    // Tab键切换配置类型
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab' && e.ctrlKey) {
            e.preventDefault();
            switchToNextConfig();
        }
    });
}

// 加载默认配置
function loadDefaultConfig() {
    const firstTab = document.querySelector('.config-tab');
    if (firstTab) {
        const configType = firstTab.dataset.config;
        switchToConfig(configType);
    }
}

// 切换配置类型
function switchToConfig(configType) {
    if (hasUnsavedChanges) {
        if (!confirm('你有未保存的更改，确定要切换吗？')) {
            return;
        }
    }

    currentConfigType = configType;
    
    // 更新标签页状态
    document.querySelectorAll('.config-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`tab-${configType}`).classList.add('active');

    // 加载配置内容
    loadConfigContent(configType);
    
    // 更新编辑器信息
    updateEditorInfo(configType);
    
    // 重置保存状态
    hasUnsavedChanges = false;
    updateSaveButtonState();
}

// 切换到下一个配置
function switchToNextConfig() {
    const tabs = document.querySelectorAll('.config-tab');
    const currentIndex = Array.from(tabs).findIndex(tab => tab.classList.contains('active'));
    const nextIndex = (currentIndex + 1) % tabs.length;
    const nextTab = tabs[nextIndex];
    if (nextTab) {
        switchToConfig(nextTab.dataset.config);
    }
}

// 加载配置内容
function loadConfigContent(configType) {
    showLoadingSpinner();
    
    fetch(`/api/config/${configType}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                yamlEditor.setValue(data.content || '');
                updateFileStatus(configType, data.exists);
                yamlEditor.clearHistory();
            } else {
                showError(`加载配置失败: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Error loading config:', error);
            showError('加载配置失败');
        })
        .finally(() => {
            hideLoadingSpinner();
        });
}

// 更新编辑器信息
function updateEditorInfo(configType) {
    const infoElement = document.getElementById('editorInfo');
    if (infoElement) {
        infoElement.innerHTML = `
            <i class="fas fa-file-code"></i> 当前编辑: ${configType}.yaml
            <span class="ms-3"><i class="fas fa-keyboard"></i> Ctrl+S 保存 | Ctrl+Enter 验证</span>
        `;
    }
}

// 更新文件状态
function updateFileStatus(configType, exists) {
    const statusElement = document.getElementById(`status-${configType}`);
    if (statusElement) {
        statusElement.innerHTML = exists ? 
            '<i class="fas fa-check" title="文件存在"></i>' : 
            '<i class="fas fa-times" title="文件不存在"></i>';
        statusElement.className = `file-status ${exists ? 'status-exists' : 'status-missing'}`;
    }
}

// 更新保存按钮状态
function updateSaveButtonState() {
    const saveButton = document.getElementById('saveButton');
    if (saveButton) {
        if (hasUnsavedChanges) {
            saveButton.classList.add('btn-warning');
            saveButton.classList.remove('btn-primary');
            saveButton.innerHTML = '<i class="fas fa-save"></i> 保存更改';
        } else {
            saveButton.classList.add('btn-primary');
            saveButton.classList.remove('btn-warning');
            saveButton.innerHTML = '<i class="fas fa-save"></i> 保存配置';
        }
    }
}

// 验证YAML
function validateYaml() {
    const content = yamlEditor.getValue();
    
    if (!content.trim()) {
        showValidationResult('warning', '配置内容为空');
        return;
    }

    const validationResult = document.getElementById('validationResult');
    if (validationResult) {
        validationResult.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 验证中...';
        validationResult.className = 'validation-result';
    }

    fetch('/api/validate-yaml', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            content: content,
            config_type: currentConfigType
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            if (data.valid) {
                showValidationResult('success', '✓ YAML语法正确');
                updateSyntaxIndicator('valid');
            } else {
                showValidationResult('error', `✗ YAML语法错误: ${data.message}`);
                updateSyntaxIndicator('invalid');
            }
        } else {
            showValidationResult('error', `验证失败: ${data.message}`);
            updateSyntaxIndicator('invalid');
        }
    })
    .catch(error => {
        console.error('Validation error:', error);
        showValidationResult('error', '验证失败，请检查网络连接');
        updateSyntaxIndicator('invalid');
    });
}

// 显示验证结果
function showValidationResult(type, message) {
    const validationResult = document.getElementById('validationResult');
    if (validationResult) {
        validationResult.innerHTML = message;
        validationResult.className = `validation-result ${type}`;
    }
}

// 清除验证结果
function clearValidationResult() {
    const validationResult = document.getElementById('validationResult');
    if (validationResult) {
        validationResult.innerHTML = '';
        validationResult.className = 'validation-result';
    }
}

// 更新语法指示器
function updateSyntaxIndicator(status) {
    const indicator = document.getElementById('syntaxIndicator');
    if (indicator) {
        indicator.className = `syntax-indicator syntax-${status}`;
    }
}

// 预览配置
function previewConfig() {
    const content = yamlEditor.getValue();
    
    if (!content.trim()) {
        showWarning('配置内容为空，无法预览');
        return;
    }

    const previewElement = document.getElementById('configPreview');
    if (previewElement) {
        previewElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成预览中...';
    }

    fetch('/api/preview-config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            content: content,
            config_type: currentConfigType
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            if (previewElement) {
                previewElement.innerHTML = `<pre>${escapeHtml(data.preview)}</pre>`;
            }
            showSuccess('配置预览生成成功');
        } else {
            if (previewElement) {
                previewElement.innerHTML = `<div class="text-danger">预览失败: ${data.message}</div>`;
            }
            showError(`预览失败: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Preview error:', error);
        if (previewElement) {
            previewElement.innerHTML = '<div class="text-danger">预览失败，请检查网络连接</div>';
        }
        showError('预览失败，请检查网络连接');
    });
}

// 保存配置
function saveConfig() {
    const content = yamlEditor.getValue();
    
    // 保存前验证
    const saveButton = document.getElementById('saveButton');
    if (saveButton) {
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 保存中...';
        saveButton.disabled = true;
        
        fetch('/api/save-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: content,
                config_type: currentConfigType
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                hasUnsavedChanges = false;
                updateSaveButtonState();
                updateFileStatus(currentConfigType, true);
                showSuccess('配置保存成功');
            } else {
                showError(`保存失败: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Save error:', error);
            showError('保存失败，请检查网络连接');
        })
        .finally(() => {
            saveButton.innerHTML = originalText;
            saveButton.disabled = false;
        });
    }
}

// 重置配置
function resetConfig() {
    if (confirm('确定要重置当前配置吗？这将丢失所有未保存的更改。')) {
        loadConfigContent(currentConfigType);
    }
}

// 导出配置
function exportConfig() {
    const content = yamlEditor.getValue();
    if (!content.trim()) {
        showWarning('配置内容为空，无法导出');
        return;
    }

    const blob = new Blob([content], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentConfigType}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess('配置已导出');
}

// 导入配置
function importConfig(file) {
    if (file && file.name.endsWith('.yaml')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (hasUnsavedChanges) {
                if (!confirm('你有未保存的更改，确定要导入吗？')) {
                    return;
                }
            }
            
            yamlEditor.setValue(e.target.result);
            hasUnsavedChanges = true;
            updateSaveButtonState();
            showSuccess('配置已导入，请检查后保存');
        };
        reader.readAsText(file);
    } else {
        showError('请选择有效的YAML文件');
    }
}

// 显示加载动画
function showLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'block';
    }
}

// 隐藏加载动画
function hideLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

// 格式化YAML
function formatYaml() {
    const content = yamlEditor.getValue();
    if (!content.trim()) {
        showWarning('配置内容为空，无法格式化');
        return;
    }

    fetch('/api/format-yaml', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: content })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            yamlEditor.setValue(data.formatted);
            showSuccess('YAML格式化成功');
        } else {
            showError(`格式化失败: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Format error:', error);
        showError('格式化失败');
    });
}

// 查找和替换
function showFindReplace() {
    if (yamlEditor) {
        yamlEditor.execCommand('find');
    }
}

// 全屏切换
function toggleFullscreen() {
    const container = document.querySelector('.yaml-editor-container');
    if (container) {
        if (container.classList.contains('fullscreen')) {
            container.classList.remove('fullscreen');
            document.exitFullscreen?.();
        } else {
            container.classList.add('fullscreen');
            container.requestFullscreen?.();
        }
    }
}

// 主题切换
function switchTheme(theme) {
    if (yamlEditor) {
        yamlEditor.setOption('theme', theme);
        localStorage.setItem('yamlEditorTheme', theme);
    }
}

// 恢复编辑器设置
function restoreEditorSettings() {
    const savedTheme = localStorage.getItem('yamlEditorTheme');
    if (savedTheme && yamlEditor) {
        yamlEditor.setOption('theme', savedTheme);
    }
}

// 页面离开时清理
window.addEventListener('beforeunload', function() {
    if (validationTimer) {
        clearTimeout(validationTimer);
    }
    hasUnsavedChanges = false;
}); 