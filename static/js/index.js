/**
 * 主页JavaScript
 * 处理主页的所有功能
 */

// 主页相关变量
let dashboardData = {};
let statsData = {};
let chartInstances = {};

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('Index page initialized');
    
    // 获取统计数据
    const statsElement = document.getElementById('stats-data');
    if (statsElement) {
        try {
            statsData = JSON.parse(statsElement.textContent) || {};
        } catch (e) {
            console.error('Failed to parse stats data:', e);
            statsData = {};
        }
    }
    
    // 设置全局变量
    window.statsData = statsData;
    
    // 初始化图表
    initializeCharts();
    
    // 设置定时刷新
    setInterval(refreshStats, 60000);
    
    // 初始化快捷操作
    initializeQuickActions();
});

// 初始化图表
function initializeCharts() {
    // 如果有Chart.js可用，初始化统计图表
    if (window.Chart && statsData) {
        initializeStatsChart();
        initializeConfigChart();
    }
}

// 初始化统计图表
function initializeStatsChart() {
    const ctx = document.getElementById('statsChart');
    if (ctx) {
        const chartData = {
            labels: ['书签', '服务', '小工具', 'Docker'],
            datasets: [{
                label: '数量',
                data: [
                    statsData.bookmarks_count || 0,
                    statsData.services_count || 0,
                    statsData.widgets_count || 0,
                    statsData.docker_instances || 0
                ],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(255, 99, 132, 0.2)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        };

        chartInstances.statsChart = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// 初始化配置图表
function initializeConfigChart() {
    const ctx = document.getElementById('configChart');
    if (ctx) {
        const configData = {
            labels: ['已配置', '未配置'],
            datasets: [{
                data: [
                    statsData.configured_settings || 0,
                    5 - (statsData.configured_settings || 0)
                ],
                backgroundColor: [
                    'rgba(40, 167, 69, 0.2)',
                    'rgba(220, 53, 69, 0.2)'
                ],
                borderColor: [
                    'rgba(40, 167, 69, 1)',
                    'rgba(220, 53, 69, 1)'
                ],
                borderWidth: 1
            }]
        };

        chartInstances.configChart = new Chart(ctx, {
            type: 'pie',
            data: configData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// 刷新统计数据
function refreshStats() {
    fetch('/api/stats')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                statsData = data.stats || {};
                updateStatsDisplay();
                updateCharts();
            }
        })
        .catch(error => {
            console.error('Error refreshing stats:', error);
        });
}

// 更新统计显示
function updateStatsDisplay() {
    // 更新统计卡片
    const statsCards = {
        'bookmarks': statsData.bookmarks_count || 0,
        'services': statsData.services_count || 0,
        'widgets': statsData.widgets_count || 0,
        'docker': statsData.docker_instances || 0
    };

    Object.entries(statsCards).forEach(([key, value]) => {
        const element = document.getElementById(`${key}-count`);
        if (element) {
            element.textContent = value;
        }
    });

    // 更新分组统计
    const groupsElement = document.getElementById('bookmarks-groups');
    if (groupsElement) {
        groupsElement.textContent = statsData.bookmarks_groups || 0;
    }

    const servicesGroupsElement = document.getElementById('services-groups');
    if (servicesGroupsElement) {
        servicesGroupsElement.textContent = statsData.services_groups || 0;
    }
}

// 更新图表
function updateCharts() {
    if (chartInstances.statsChart) {
        chartInstances.statsChart.data.datasets[0].data = [
            statsData.bookmarks_count || 0,
            statsData.services_count || 0,
            statsData.widgets_count || 0,
            statsData.docker_instances || 0
        ];
        chartInstances.statsChart.update();
    }

    if (chartInstances.configChart) {
        chartInstances.configChart.data.datasets[0].data = [
            statsData.configured_settings || 0,
            5 - (statsData.configured_settings || 0)
        ];
        chartInstances.configChart.update();
    }
}

// 初始化快捷操作
function initializeQuickActions() {
    // 设置快捷键
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey) {
            switch(e.key) {
                case 'B':
                    e.preventDefault();
                    goToBookmarks();
                    break;
                case 'S':
                    e.preventDefault();
                    goToServices();
                    break;
                case 'C':
                    e.preventDefault();
                    goToConfig();
                    break;
                case 'Y':
                    e.preventDefault();
                    goToYamlEditor();
                    break;
            }
        }
    });

    // 添加快捷键提示
    addKeyboardShortcuts();
}

// 添加快捷键提示
function addKeyboardShortcuts() {
    const shortcutsInfo = document.getElementById('shortcuts-info');
    if (shortcutsInfo) {
        shortcutsInfo.innerHTML = `
            <div class="keyboard-shortcuts">
                <h6><i class="fas fa-keyboard"></i> 快捷键</h6>
                <div class="row">
                    <div class="col-6">
                        <small>Ctrl+Shift+B: 书签管理</small><br>
                        <small>Ctrl+Shift+S: 服务管理</small>
                    </div>
                    <div class="col-6">
                        <small>Ctrl+Shift+C: 配置管理</small><br>
                        <small>Ctrl+Shift+Y: YAML编辑器</small>
                    </div>
                </div>
            </div>
        `;
    }
}

// 页面导航函数
function goToBookmarks() {
    window.location.href = '/bookmarks';
}

function goToServices() {
    window.location.href = '/services';
}

function goToConfig() {
    window.location.href = '/config';
}

function goToYamlEditor() {
    window.location.href = '/yaml-editor';
}

function goToSettings() {
    window.location.href = '/settings';
}

function goToDocker() {
    window.location.href = '/docker';
}

function goToWidgets() {
    window.location.href = '/widgets';
}

// 创建快速备份
function createBackup() {
    const backupName = `quick_backup_${new Date().toISOString().slice(0, 16).replace(/:/g, '-')}`;
    
    const backupBtn = document.getElementById('quickBackupBtn');
    if (backupBtn) {
        const originalText = backupBtn.innerHTML;
        backupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 创建中...';
        backupBtn.disabled = true;
        
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
                showSuccess(`快速备份创建成功: ${backupName}`);
                updateRecentBackups();
            } else {
                showError(`创建备份失败: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Error creating backup:', error);
            showError('创建备份失败');
        })
        .finally(() => {
            backupBtn.innerHTML = originalText;
            backupBtn.disabled = false;
        });
    }
}

// 更新最近备份显示
function updateRecentBackups() {
    fetch('/api/backups?limit=3')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const backups = data.backups || [];
                const recentBackupsElement = document.getElementById('recent-backups');
                if (recentBackupsElement) {
                    if (backups.length === 0) {
                        recentBackupsElement.innerHTML = '<p class="text-muted">暂无备份</p>';
                    } else {
                        recentBackupsElement.innerHTML = backups.map(backup => `
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                    <strong>${backup.name}</strong><br>
                                    <small class="text-muted">${backup.date}</small>
                                </div>
                                <button class="btn btn-sm btn-outline-primary" onclick="restoreQuickBackup('${backup.name}')">
                                    <i class="fas fa-undo"></i>
                                </button>
                            </div>
                        `).join('');
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error updating recent backups:', error);
        });
}

// 快速恢复备份
function restoreQuickBackup(backupName) {
    if (!confirm(`确定要恢复备份"${backupName}"吗？`)) {
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

// 检查系统状态
function checkSystemStatus() {
    fetch('/api/system-status')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const status = data.system_status || {};
                updateSystemStatusDisplay(status);
            }
        })
        .catch(error => {
            console.error('Error checking system status:', error);
        });
}

// 更新系统状态显示
function updateSystemStatusDisplay(status) {
    const statusElement = document.getElementById('system-status');
    if (statusElement) {
        const statusItems = [
            { label: '配置文件', value: status.config_files || 0, total: 5 },
            { label: '磁盘使用', value: status.disk_usage || '0%' },
            { label: '内存使用', value: status.memory_usage || '0%' },
            { label: '运行时间', value: status.uptime || '0分钟' }
        ];

        statusElement.innerHTML = statusItems.map(item => {
            const isPercentage = typeof item.value === 'string' && item.value.includes('%');
            const statusClass = isPercentage && parseInt(item.value) > 80 ? 'text-warning' : 'text-success';
            
            return `
                <div class="d-flex justify-content-between">
                    <span>${item.label}:</span>
                    <span class="${statusClass}">${item.value}${item.total ? `/${item.total}` : ''}</span>
                </div>
            `;
        }).join('');
    }
}

// 显示帮助信息
function showHelp() {
    const helpModal = new bootstrap.Modal(document.getElementById('helpModal'));
    helpModal.show();
}

// 初始化帮助内容
function initializeHelp() {
    const helpContent = document.getElementById('helpContent');
    if (helpContent) {
        helpContent.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>快速开始</h6>
                    <ul>
                        <li>首先在"全局设置"中配置基础信息</li>
                        <li>在"书签管理"中添加常用网站</li>
                        <li>在"服务管理"中添加监控服务</li>
                        <li>使用"配置管理"备份重要配置</li>
                    </ul>
                </div>
                <div class="col-md-6">
                    <h6>常见问题</h6>
                    <ul>
                        <li>配置不生效？检查YAML语法是否正确</li>
                        <li>服务无法连接？检查URL和网络状态</li>
                        <li>备份失败？检查磁盘空间和权限</li>
                        <li>页面加载慢？清理浏览器缓存</li>
                    </ul>
                </div>
            </div>
        `;
    }
}

// 页面加载完成后的初始化
window.addEventListener('load', function() {
    // 检查系统状态
    checkSystemStatus();
    
    // 更新最近备份
    updateRecentBackups();
    
    // 初始化帮助内容
    initializeHelp();
    
    // 设置定时任务
    setInterval(checkSystemStatus, 300000); // 5分钟检查一次系统状态
});

// 页面可见性变化处理
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // 页面重新获得焦点时刷新数据
        refreshStats();
        checkSystemStatus();
    }
});

// 清理资源
window.addEventListener('beforeunload', function() {
    // 销毁图表实例
    Object.values(chartInstances).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
}); 