/**
 * 服务管理页面JavaScript
 * 处理服务管理页面的所有功能
 */

// 服务页面相关变量
let servicesData = [];
let currentEditingGroup = null;
let currentEditingService = null;

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('Services page initialized');
    
    // 获取服务数据
    const dataElement = document.getElementById('services-data');
    if (dataElement) {
        try {
            servicesData = JSON.parse(dataElement.textContent) || [];
        } catch (e) {
            console.error('Failed to parse services data:', e);
            servicesData = [];
        }
    }
    
    // 设置全局变量
    window.servicesData = servicesData;
    
    // 初始化拖拽功能
    setTimeout(() => {
        if (window.Sortable) {
            initializeDragAndDrop();
        }
    }, 200);
});

// 初始化拖拽功能
function initializeDragAndDrop() {
    if (!window.Sortable) {
        console.warn('SortableJS not available');
        return;
    }

    // 分组拖拽排序
    const container = document.getElementById('services-container');
    if (container) {
        Sortable.create(container, {
            handle: '.group-handle',
            animation: 150,
            onEnd: function(evt) {
                const item = servicesData.splice(evt.oldIndex, 1)[0];
                servicesData.splice(evt.newIndex, 0, item);
                saveServicesWithoutReload();
            }
        });
    }

    // 服务拖拽排序
    document.querySelectorAll('.service-items').forEach(container => {
        Sortable.create(container, {
            group: 'services',
            animation: 150,
            onEnd: function(evt) {
                const oldGroupName = evt.from.dataset.group;
                const newGroupName = evt.to.dataset.group;
                
                const oldGroupIndex = servicesData.findIndex(g => Object.keys(g)[0] === oldGroupName);
                const newGroupIndex = servicesData.findIndex(g => Object.keys(g)[0] === newGroupName);
                
                if (oldGroupIndex !== -1 && newGroupIndex !== -1) {
                    const service = servicesData[oldGroupIndex][oldGroupName].splice(evt.oldIndex, 1)[0];
                    servicesData[newGroupIndex][newGroupName].splice(evt.newIndex, 0, service);
                    saveServicesWithoutReload();
                }
            }
        });
    });
}

// 分组管理
function showAddGroupModal() {
    currentEditingGroup = null;
    document.getElementById('groupModalTitle').textContent = '添加分组';
    document.getElementById('groupName').value = '';
    new bootstrap.Modal(document.getElementById('groupModal')).show();
    setTimeout(() => document.getElementById('groupName').focus(), 100);
}

function editGroup(groupName) {
    currentEditingGroup = groupName;
    document.getElementById('groupModalTitle').textContent = '编辑分组';
    document.getElementById('groupName').value = groupName;
    new bootstrap.Modal(document.getElementById('groupModal')).show();
    setTimeout(() => document.getElementById('groupName').focus(), 100);
}

function saveGroup(event) {
    if (event) event.preventDefault();
    
    const groupName = document.getElementById('groupName').value.trim();
    if (!groupName) {
        showError('请输入分组名称');
        return false;
    }

    if (currentEditingGroup) {
        // 编辑现有分组
        const groupIndex = servicesData.findIndex(group => Object.keys(group)[0] === currentEditingGroup);
        if (groupIndex !== -1) {
            const items = servicesData[groupIndex][currentEditingGroup];
            servicesData[groupIndex] = { [groupName]: items };
        }
    } else {
        // 添加新分组
        servicesData.push({ [groupName]: [] });
    }

    saveServices();
    const modal = bootstrap.Modal.getInstance(document.getElementById('groupModal'));
    modal.hide();
    return false;
}

function deleteGroup(groupName) {
    if (confirm(`确定要删除分组"${groupName}"吗？该操作将删除分组内的所有服务。`)) {
        servicesData = servicesData.filter(group => Object.keys(group)[0] !== groupName);
        saveServices();
    }
}

// 服务管理
function showAddServiceModal(groupName) {
    currentEditingGroup = groupName;
    currentEditingService = null;
    
    document.getElementById('serviceModalTitle').textContent = '添加服务';
    document.getElementById('serviceGroup').value = groupName;
    document.getElementById('originalServiceName').value = '';
    
    // 清空表单
    document.getElementById('serviceName').value = '';
    document.getElementById('serviceUrl').value = '';
    document.getElementById('serviceIcon').value = '';
    document.getElementById('serviceDescription').value = '';
    document.getElementById('serviceWidget').value = '';
    document.getElementById('serviceWidgetUrl').value = '';
    document.getElementById('serviceWidgetFields').value = '';
    
    new bootstrap.Modal(document.getElementById('serviceModal')).show();
    setTimeout(() => document.getElementById('serviceName').focus(), 100);
}

function editService(groupName, serviceName) {
    currentEditingGroup = groupName;
    currentEditingService = serviceName;
    
    const group = servicesData.find(g => Object.keys(g)[0] === groupName);
    const service = group[groupName].find(s => Object.keys(s)[0] === serviceName);
    const serviceData = service[serviceName];
    
    document.getElementById('serviceModalTitle').textContent = '编辑服务';
    document.getElementById('serviceGroup').value = groupName;
    document.getElementById('originalServiceName').value = serviceName;
    
    document.getElementById('serviceName').value = serviceName;
    document.getElementById('serviceUrl').value = serviceData.href || '';
    document.getElementById('serviceIcon').value = serviceData.icon || '';
    document.getElementById('serviceDescription').value = serviceData.description || '';
    document.getElementById('serviceWidget').value = serviceData.widget?.type || '';
    document.getElementById('serviceWidgetUrl').value = serviceData.widget?.url || '';
    document.getElementById('serviceWidgetFields').value = serviceData.widget?.fields ? JSON.stringify(serviceData.widget.fields, null, 2) : '';
    
    new bootstrap.Modal(document.getElementById('serviceModal')).show();
    setTimeout(() => document.getElementById('serviceName').focus(), 100);
}

function saveService(event) {
    if (event) event.preventDefault();

    const groupName = document.getElementById('serviceGroup').value;
    const originalName = document.getElementById('originalServiceName').value;
    const name = document.getElementById('serviceName').value.trim();
    const url = document.getElementById('serviceUrl').value.trim();
    const icon = document.getElementById('serviceIcon').value.trim();
    const description = document.getElementById('serviceDescription').value.trim();
    const widget = document.getElementById('serviceWidget').value.trim();
    const widgetUrl = document.getElementById('serviceWidgetUrl').value.trim();
    const widgetFields = document.getElementById('serviceWidgetFields').value.trim();

    if (!name || !url) {
        showError('请填写服务名称和URL');
        return false;
    }

    // 验证URL格式
    if (!isValidWebUrl(url)) {
        showError('请输入有效的URL地址');
        return false;
    }

    // 构建服务数据
    const serviceData = { href: url };
    if (icon) serviceData.icon = icon;
    if (description) serviceData.description = description;
    
    // 添加小工具配置
    if (widget) {
        serviceData.widget = { type: widget };
        if (widgetUrl) serviceData.widget.url = widgetUrl;
        if (widgetFields) {
            try {
                serviceData.widget.fields = JSON.parse(widgetFields);
            } catch (e) {
                showError('小工具字段格式错误，请输入有效的JSON');
                return false;
            }
        }
    }

    const groupIndex = servicesData.findIndex(group => Object.keys(group)[0] === groupName);
    if (groupIndex === -1) {
        showError('分组不存在');
        return false;
    }

    if (currentEditingService) {
        // 编辑现有服务
        const serviceIndex = servicesData[groupIndex][groupName].findIndex(s => Object.keys(s)[0] === originalName);
        if (serviceIndex !== -1) {
            servicesData[groupIndex][groupName][serviceIndex] = { [name]: serviceData };
        }
    } else {
        // 添加新服务
        servicesData[groupIndex][groupName].push({ [name]: serviceData });
    }

    saveServices();
    const modal = bootstrap.Modal.getInstance(document.getElementById('serviceModal'));
    modal.hide();
    return false;
}

function deleteService(groupName, serviceName) {
    if (confirm(`确定要删除服务"${serviceName}"吗？`)) {
        const groupIndex = servicesData.findIndex(group => Object.keys(group)[0] === groupName);
        if (groupIndex !== -1) {
            servicesData[groupIndex][groupName] = servicesData[groupIndex][groupName]
                .filter(s => Object.keys(s)[0] !== serviceName);
            saveServices();
        }
    }
}

// 服务测试
function testService(url) {
    showInfo('正在测试服务连接...');
    
    fetch(url, { method: 'HEAD', mode: 'no-cors' })
        .then(() => {
            showSuccess('服务连接正常');
        })
        .catch(() => {
            showWarning('无法连接到服务，请检查URL是否正确');
        });
}

// 自动填充服务信息
function autoFillServiceInfo() {
    const urlField = document.getElementById('serviceUrl');
    const nameField = document.getElementById('serviceName');
    const url = urlField.value.trim();
    
    if (url && !nameField.value) {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.replace(/^www\./, '');
            const serviceName = hostname.split('.')[0];
            nameField.value = serviceName.charAt(0).toUpperCase() + serviceName.slice(1);
        } catch (e) {
            console.warn('Auto-fill failed:', e);
        }
    }
}

// 小工具类型切换
function onWidgetTypeChange(type) {
    const urlGroup = document.getElementById('widgetUrlGroup');
    const fieldsGroup = document.getElementById('widgetFieldsGroup');
    
    if (type) {
        urlGroup.style.display = 'block';
        fieldsGroup.style.display = 'block';
    } else {
        urlGroup.style.display = 'none';
        fieldsGroup.style.display = 'none';
    }
}

// 保存服务
function saveServices() {
    fetch('/services', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(servicesData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            location.reload();
        } else {
            showError('保存失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('保存失败: ' + error.message);
    });
}

// 保存但不刷新页面
function saveServicesWithoutReload() {
    return fetch('/services', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(servicesData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            console.log('Services saved successfully');
            setTimeout(() => initializeDragAndDrop(), 100);
        } else {
            showError('保存失败: ' + data.message);
        }
        return data;
    })
    .catch(error => {
        console.error('Error:', error);
        showError('保存失败: ' + error.message);
        throw error;
    });
}

// 批量导入服务
function importServices(data) {
    try {
        const importedServices = JSON.parse(data);
        if (Array.isArray(importedServices)) {
            servicesData = importedServices;
            saveServices();
            showSuccess('服务导入成功');
        } else {
            showError('导入数据格式错误');
        }
    } catch (e) {
        showError('导入失败：' + e.message);
    }
}

// 导出服务配置
function exportServices() {
    const blob = new Blob([JSON.stringify(servicesData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'services.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess('服务配置已导出');
} 