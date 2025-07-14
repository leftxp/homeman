/**
 * 配置管理页面JavaScript
 * 处理配置文件管理的所有功能
 */

// 配置管理页面相关变量
let configStatus = {};
let backupList = [];

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('Config management page initialized');
    
    // 获取配置状态数据
    const statusElement = document.getElementById('config-status-data');
    if (statusElement) {
        try {
            configStatus = JSON.parse(statusElement.textContent) || {};
        } catch (e) {
            console.error('Failed to parse config status:', e);
            configStatus = {};
        }
    }
    
    // 设置全局变量
    window.configStatus = configStatus;
    
    // 加载备份列表
    loadBackupList();
    
    // 设置定时刷新状态
    setInterval(refreshConfigStatus, 30000);
});

// 加载备份列表
function loadBackupList() {
    fetch('/api/backups')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                backupList = data.backups || [];
                updateBackupList();
            } else {
                console.error('Failed to load backups:', data.message);
            }
        })
        .catch(error => {
            console.error('Error loading backups:', error);
        });
}

// 更新备份列表显示
function updateBackupList() {
    const backupContainer = document.getElementById('backup-list');
    if (backupContainer) {
        if (backupList.length === 0) {
            backupContainer.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-archive fa-3x text-muted mb-3"></i>
                    <h5>暂无备份</h5>
                    <p class="text-muted">点击"创建备份"按钮创建第一个备份</p>
                </div>
            `;
        } else {
            backupContainer.innerHTML = backupList.map(backup => `
                <div class="backup-item d-flex justify-content-between align-items-center p-3 border rounded mb-2">
                    <div>
                        <h6 class="mb-1">${backup.name}</h6>
                        <small class="text-muted">
                            <i class="fas fa-calendar"></i> ${backup.date}
                            <span class="ms-3"><i class="fas fa-file-archive"></i> ${backup.size}</span>
                        </small>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-info" onclick="previewBackup('${backup.name}')" title="预览">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="restoreBackup('${backup.name}')" title="恢复">
                            <i class="fas fa-undo"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-primary" onclick="downloadBackup('${backup.name}')" title="下载">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteBackup('${backup.name}')" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }
}

// 刷新配置状态
function refreshConfigStatus() {
    fetch('/api/config-status')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                configStatus = data.config_status || {};
                updateConfigStatusDisplay();
            }
        })
        .catch(error => {
            console.error('Error refreshing config status:', error);
        });
}

// 更新配置状态显示
function updateConfigStatusDisplay() {
    const statusContainer = document.getElementById('config-status-cards');
    if (statusContainer && configStatus) {
        const configs = ['settings', 'bookmarks', 'services', 'widgets', 'docker'];
        
        statusContainer.innerHTML = configs.map(config => {
            const status = configStatus[config] || {};
            const statusClass = status.exists ? 'border-success' : 'border-warning';
            const statusIcon = status.exists ? 'fa-check-circle text-success' : 'fa-exclamation-circle text-warning';
            const statusText = status.exists ? '已配置' : '未配置';
            
            return `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card config-status-card ${statusClass}">
                        <div class="card-body text-center">
                            <i class="fas ${statusIcon} fa-2x mb-3"></i>
                            <h6>${config}.yaml</h6>
                            <p class="text-muted mb-2">${statusText}</p>
                            <small class="text-muted">
                                ${status.size || '0 B'} | 
                                ${status.modified || '未知时间'}
                            </small>
                            <div class="mt-3">
                                <button class="btn btn-sm btn-outline-primary" onclick="editConfig('${config}')" title="编辑">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-info" onclick="viewConfig('${config}')" title="查看">
                                    <i class="fas fa-eye"></i>
                                </button>
                                ${status.exists ? `<button class="btn btn-sm btn-outline-danger" onclick="deleteConfig('${config}')" title="删除">
                                    <i class="fas fa-trash"></i>
                                </button>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// 创建备份
function createBackup() {
    const backupName = prompt('请输入备份名称:', `backup_${new Date().toISOString().slice(0,16).replace(/:/g, '-')}`);
    if (!backupName) return;
    
    if (!/^[a-zA-Z0-9_-]+$/.test(backupName)) {
        showError('备份名称只能包含字母、数字、下划线和横杠');
        return;
    }
    
    const createBtn = document.getElementById('createBackupBtn');
    if (createBtn) {
        const originalText = createBtn.innerHTML;
        createBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 创建中...';
        createBtn.disabled = true;
        
        fetch('/api/backup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: backupName })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showSuccess(`备份"${backupName}"创建成功`);
                loadBackupList();
            } else {
                showError(`创建备份失败: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Error creating backup:', error);
            showError('创建备份失败');
        })
        .finally(() => {
            createBtn.innerHTML = originalText;
            createBtn.disabled = false;
        });
    }
}

// 预览备份
function previewBackup(backupName) {
    fetch(`/api/backup/${backupName}/preview`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const previewModal = new bootstrap.Modal(document.getElementById('backupPreviewModal'));
                document.getElementById('backupPreviewTitle').textContent = `备份预览: ${backupName}`;
                document.getElementById('backupPreviewContent').innerHTML = `
                    <pre>${escapeHtml(data.content)}</pre>
                `;
                previewModal.show();
            } else {
                showError(`预览失败: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Error previewing backup:', error);
            showError('预览失败');
        });
}

// 恢复备份
function restoreBackup(backupName) {
    if (!confirm(`确定要恢复备份"${backupName}"吗？这将覆盖当前的所有配置文件。`)) {
        return;
    }
    
    fetch(`/api/backup/${backupName}/restore`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showSuccess(`备份"${backupName}"恢复成功`);
            setTimeout(() => {
                location.reload();
            }, 2000);
        } else {
            showError(`恢复失败: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Error restoring backup:', error);
        showError('恢复失败');
    });
}

// 下载备份
function downloadBackup(backupName) {
    const link = document.createElement('a');
    link.href = `/api/backup/${backupName}/download`;
    link.download = `${backupName}.tar.gz`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess(`备份"${backupName}"下载开始`);
}

// 删除备份
function deleteBackup(backupName) {
    if (!confirm(`确定要删除备份"${backupName}"吗？此操作不可恢复。`)) {
        return;
    }
    
    fetch(`/api/backup/${backupName}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showSuccess(`备份"${backupName}"删除成功`);
            loadBackupList();
        } else {
            showError(`删除失败: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Error deleting backup:', error);
        showError('删除失败');
    });
}

// 编辑配置文件
function editConfig(configType) {
    window.location.href = `/yaml-editor?config=${configType}`;
}

// 查看配置文件
function viewConfig(configType) {
    fetch(`/api/config/${configType}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const viewModal = new bootstrap.Modal(document.getElementById('configViewModal'));
                document.getElementById('configViewTitle').textContent = `${configType}.yaml`;
                document.getElementById('configViewContent').innerHTML = `
                    <pre class="code-editor" style="height: 400px; overflow: auto;">${escapeHtml(data.content || '# 配置文件为空')}</pre>
                `;
                viewModal.show();
            } else {
                showError(`查看失败: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Error viewing config:', error);
            showError('查看失败');
        });
}

// 删除配置文件
function deleteConfig(configType) {
    if (!confirm(`确定要删除配置文件"${configType}.yaml"吗？此操作不可恢复。`)) {
        return;
    }
    
    fetch(`/api/config/${configType}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showSuccess(`配置文件"${configType}.yaml"删除成功`);
            refreshConfigStatus();
        } else {
            showError(`删除失败: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Error deleting config:', error);
        showError('删除失败');
    });
}

// 导出所有配置
function exportAllConfigs() {
    fetch('/api/export-configs')
        .then(response => {
            if (response.ok) {
                return response.blob();
            } else {
                throw new Error('导出失败');
            }
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `homepage-configs-${new Date().toISOString().slice(0, 10)}.tar.gz`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showSuccess('配置导出成功');
        })
        .catch(error => {
            console.error('Error exporting configs:', error);
            showError('导出失败');
        });
}

// 导入配置
function importConfigs(file) {
    if (!file || !file.name.endsWith('.tar.gz')) {
        showError('请选择有效的配置文件（.tar.gz格式）');
        return;
    }
    
    const formData = new FormData();
    formData.append('config_file', file);
    
    fetch('/api/import-configs', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showSuccess('配置导入成功');
            setTimeout(() => {
                location.reload();
            }, 2000);
        } else {
            showError(`导入失败: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Error importing configs:', error);
        showError('导入失败');
    });
}

// 验证所有配置
function validateAllConfigs() {
    const validateBtn = document.getElementById('validateBtn');
    if (validateBtn) {
        const originalText = validateBtn.innerHTML;
        validateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 验证中...';
        validateBtn.disabled = true;
        
        fetch('/api/validate-all-configs')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    const results = data.results || {};
                    const validCount = Object.values(results).filter(r => r.valid).length;
                    const totalCount = Object.keys(results).length;
                    
                    if (validCount === totalCount) {
                        showSuccess(`所有配置验证通过 (${validCount}/${totalCount})`);
                    } else {
                        showWarning(`配置验证完成，${validCount}/${totalCount} 个通过`);
                    }
                    
                    // 显示详细结果
                    displayValidationResults(results);
                } else {
                    showError(`验证失败: ${data.message}`);
                }
            })
            .catch(error => {
                console.error('Error validating configs:', error);
                showError('验证失败');
            })
            .finally(() => {
                validateBtn.innerHTML = originalText;
                validateBtn.disabled = false;
            });
    }
}

// 显示验证结果
function displayValidationResults(results) {
    const resultsContainer = document.getElementById('validationResults');
    if (resultsContainer) {
        resultsContainer.innerHTML = Object.entries(results).map(([config, result]) => {
            const statusClass = result.valid ? 'text-success' : 'text-danger';
            const statusIcon = result.valid ? 'fa-check-circle' : 'fa-times-circle';
            const statusText = result.valid ? '通过' : '失败';
            
            return `
                <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
                    <div>
                        <strong>${config}.yaml</strong>
                        <span class="${statusClass}">
                            <i class="fas ${statusIcon} ms-2"></i> ${statusText}
                        </span>
                    </div>
                    ${!result.valid ? `<small class="text-danger">${result.message}</small>` : ''}
                </div>
            `;
        }).join('');
        
        resultsContainer.style.display = 'block';
    }
}

// 清理配置缓存
function clearConfigCache() {
    if (!confirm('确定要清理配置缓存吗？这将重新加载所有配置文件。')) {
        return;
    }
    
    fetch('/api/clear-cache', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showSuccess('配置缓存清理成功');
            refreshConfigStatus();
        } else {
            showError(`清理失败: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Error clearing cache:', error);
        showError('清理失败');
    });
}

// 检查配置完整性
function checkConfigIntegrity() {
    fetch('/api/check-integrity')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const issues = data.issues || [];
                if (issues.length === 0) {
                    showSuccess('配置完整性检查通过');
                } else {
                    showWarning(`发现 ${issues.length} 个问题`);
                    displayIntegrityIssues(issues);
                }
            } else {
                showError(`检查失败: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Error checking integrity:', error);
            showError('检查失败');
        });
}

// 显示完整性问题
function displayIntegrityIssues(issues) {
    const issuesContainer = document.getElementById('integrityIssues');
    if (issuesContainer) {
        issuesContainer.innerHTML = issues.map(issue => `
            <div class="alert alert-warning alert-dismissible fade show" role="alert">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>${issue.config}</strong>: ${issue.message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `).join('');
        
        issuesContainer.style.display = 'block';
    }
}

// 重置所有配置
function resetAllConfigs() {
    if (!confirm('确定要重置所有配置吗？这将删除所有配置文件并恢复到初始状态。此操作不可恢复！')) {
        return;
    }
    
    const confirmText = prompt('请输入"RESET"确认重置操作:');
    if (confirmText !== 'RESET') {
        showError('确认文本不正确，操作取消');
        return;
    }
    
    fetch('/api/reset-configs', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showSuccess('配置重置成功');
            setTimeout(() => {
                location.reload();
            }, 2000);
        } else {
            showError(`重置失败: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Error resetting configs:', error);
        showError('重置失败');
    });
} 