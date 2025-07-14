/**
 * 书签页面JavaScript
 * 处理书签管理页面的所有功能
 */

// 全局变量
let bookmarksData = [];
let currentEditingGroup = null;
let currentEditingBookmark = null;
let isMultiSelectMode = false;

// 等待所有脚本加载完成后再初始化
function initBookmarksPage() {
    console.log('Initializing bookmarks page...');
    
    // 获取书签数据
    const dataElement = document.getElementById('bookmarks-data');
    if (dataElement) {
        try {
            bookmarksData = JSON.parse(dataElement.textContent) || [];
            console.log('Bookmarks data loaded:', bookmarksData.length, 'groups');
        } catch (e) {
            console.error('Failed to parse bookmarks data:', e);
            bookmarksData = [];
        }
    } else {
        console.warn('bookmarks-data element not found');
        bookmarksData = [];
    }
    
    // 设置全局变量
    window.bookmarksData = bookmarksData;
    
    // 延迟初始化拖拽功能，确保DOM完全渲染
    setTimeout(() => {
        if (window.Sortable) {
            initializeDragAndDrop();
        } else {
            console.warn('SortableJS not available, drag and drop disabled');
        }
    }, 200);
    
    console.log('Bookmarks page initialized successfully');
}

// 简化的拖拽初始化
function initializeDragAndDrop() {
    if (!window.Sortable) {
        console.warn('SortableJS not loaded, skipping drag and drop');
        return;
    }

    // 分组拖拽排序
    const container = document.getElementById('bookmarks-container');
    if (container) {
        Sortable.create(container, {
            handle: '.group-handle',
            animation: 150,
            onEnd: function(evt) {
                const item = bookmarksData.splice(evt.oldIndex, 1)[0];
                bookmarksData.splice(evt.newIndex, 0, item);
                saveBookmarksWithoutReload();
            }
        });
    }

    // 书签拖拽排序和移动
    document.querySelectorAll('.bookmark-items').forEach(container => {
        Sortable.create(container, {
            group: 'bookmarks',
            handle: '.bookmark-title-area',
            animation: 150,
            onEnd: function(evt) {
                const oldGroupName = evt.from.dataset.group;
                const newGroupName = evt.to.dataset.group;
                
                const oldGroupIndex = bookmarksData.findIndex(g => Object.keys(g)[0] === oldGroupName);
                const newGroupIndex = bookmarksData.findIndex(g => Object.keys(g)[0] === newGroupName);
                
                if (oldGroupIndex !== -1 && newGroupIndex !== -1) {
                    const bookmark = bookmarksData[oldGroupIndex][oldGroupName].splice(evt.oldIndex, 1)[0];
                    bookmarksData[newGroupIndex][newGroupName].splice(evt.newIndex, 0, bookmark);
                    saveBookmarksWithoutReload();
                }
            }
        });
    });
    
    console.log('Drag and drop initialized successfully');
}

// 显示提示消息的简化版本
function showMessage(message, type = 'info') {
    // 优先使用全局函数
    if (type === 'success' && window.showSuccess) {
        window.showSuccess(message);
    } else if (type === 'error' && window.showError) {
        window.showError(message);
    } else {
        // 创建简单的toast提示
        createSimpleToast(message, type);
    }
}

// 简单的toast提示
function createSimpleToast(message, type) {
    // 创建toast容器
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }

    // 创建toast
    const toast = document.createElement('div');
    const bgClass = type === 'error' ? 'bg-danger' : type === 'success' ? 'bg-success' : 'bg-info';
    toast.className = `toast align-items-center text-white ${bgClass} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${escapeHtml(message)}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    container.appendChild(toast);

    // 显示toast
    if (window.bootstrap && window.bootstrap.Toast) {
        const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 3000 });
        bsToast.show();
        toast.addEventListener('hidden.bs.toast', () => toast.remove());
    } else {
        // 备用方案
        setTimeout(() => toast.remove(), 3000);
    }
}

// HTML转义函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// URL验证函数
function validateUrl(url) {
    if (!url) return false;
    
    // 基本的 URL 格式检查，与后端保持一致
    const urlPattern = /^https?:\/\/(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::\d+)?(?:\/?|[\/\?]\S+)$/i;
    
    // 也支持相对路径
    if (url.startsWith('/')) {
        return true;
    }
    
    return urlPattern.test(url);
}

// 快速添加功能
function handleQuickAddKeypress(event, groupName) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const input = event.target;
        const url = input.value.trim();
        
        if (!url) {
            input.classList.add('is-invalid');
            showMessage('请输入网址', 'error');
            return;
        }

        // URL处理和验证
        let normalizedUrl = url;
        if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://') && !normalizedUrl.startsWith('/')) {
            normalizedUrl = 'http://' + normalizedUrl;
        }

        // 验证URL格式
        if (!validateUrl(normalizedUrl)) {
            input.classList.add('is-invalid');
            showMessage('无效的网址格式，请输入有效的网址（如：example.com 或 https://example.com）', 'error');
            return;
        }

        // 清除错误状态
        input.classList.remove('is-invalid');

        // 网站名称提取
        let siteName = 'New Bookmark';
        let abbr = 'NB';
        try {
            const urlObj = new URL(normalizedUrl);
            const hostname = urlObj.hostname.replace(/^www\./, '');
            const domainParts = hostname.split('.');
            if (domainParts.length >= 2) {
                siteName = domainParts[0];
                siteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
                abbr = siteName.substring(0, 2).toUpperCase();
            }
        } catch (e) {
            console.warn('URL parsing failed:', e);
            // 如果URL解析失败，提示用户
            input.classList.add('is-invalid');
            showMessage('无法解析网址，请检查网址格式', 'error');
            return;
        }

        // 构建书签数据
        const bookmarkData = { href: normalizedUrl };
        if (abbr && abbr !== 'NB') bookmarkData.abbr = abbr;

        // 找到分组并添加书签
        const groupIndex = bookmarksData.findIndex(group => Object.keys(group)[0] === groupName);
        if (groupIndex !== -1) {
            // 先添加到数据
            bookmarksData[groupIndex][groupName].push({ [siteName]: [bookmarkData] });
            
            // 动态添加到页面
            addBookmarkToDOM(groupName, siteName, bookmarkData);
            
            // 清空输入框并清除错误状态
            input.value = '';
            input.classList.remove('is-invalid');
            
            // 保存到后端，如果失败则撤销更改
            saveBookmarksWithoutReload()
                .then(data => {
                    if (data.status === 'success') {
                        showMessage(`已添加书签 "${siteName}" 到分组 "${groupName}"`, 'success');
                    } else {
                        // 保存失败，撤销更改
                        rollbackBookmarkAdd(groupName, siteName);
                        showMessage('保存失败: ' + data.message, 'error');
                    }
                })
                .catch(error => {
                    // 保存出错，撤销更改
                    rollbackBookmarkAdd(groupName, siteName);
                    showMessage('保存失败: ' + error.message, 'error');
                });
        } else {
            showMessage('分组不存在', 'error');
        }
    }
}

// 撤销书签添加的函数
function rollbackBookmarkAdd(groupName, bookmarkName) {
    // 从数据中移除
    const groupIndex = bookmarksData.findIndex(group => Object.keys(group)[0] === groupName);
    if (groupIndex !== -1) {
        bookmarksData[groupIndex][groupName] = bookmarksData[groupIndex][groupName]
            .filter(b => Object.keys(b)[0] !== bookmarkName);
    }
    
    // 从DOM中移除 - 查找书签卡片
    const bookmarkElement = document.querySelector(`.bookmark-card[data-group="${groupName}"][data-bookmark="${bookmarkName}"]`);
    if (bookmarkElement) {
        // 移除整个列容器（col-lg-2 col-md-3 col-sm-4 col-6）
        const colContainer = bookmarkElement.closest('.col-lg-2, .col-md-3, .col-sm-4, .col-6');
        if (colContainer) {
            colContainer.remove();
        } else {
            // 备用方案：移除卡片本身
            bookmarkElement.remove();
        }
    }
}

function handleQuickAddBlur(event, groupName) {
    event.target.placeholder = '输入网址快速添加';
}

// 分组管理
function showAddGroupModal() {
    currentEditingGroup = null;
    document.getElementById('groupModalTitle').textContent = '添加分组';
    document.getElementById('groupName').value = '';
    new bootstrap.Modal(document.getElementById('groupModal')).show();
    setTimeout(() => document.getElementById('groupName').focus(), 100);
}

function saveGroup(event) {
    if (event) event.preventDefault();
    
    const groupName = document.getElementById('groupName').value.trim();
    if (!groupName) {
        showMessage('请输入分组名称', 'error');
        return false;
    }

    if (currentEditingGroup) {
        // 编辑现有分组
        const groupIndex = bookmarksData.findIndex(group => Object.keys(group)[0] === currentEditingGroup);
        if (groupIndex !== -1) {
            const items = bookmarksData[groupIndex][currentEditingGroup];
            bookmarksData[groupIndex] = { [groupName]: items };
        }
    } else {
        // 添加新分组
        bookmarksData.push({ [groupName]: [] });
    }

    saveBookmarks();
    const modal = bootstrap.Modal.getInstance(document.getElementById('groupModal'));
    modal.hide();
    return false;
}

function deleteGroup(groupName) {
    if (confirm(`确定要删除分组"${groupName}"吗？该操作将删除分组内的所有书签。`)) {
        bookmarksData = bookmarksData.filter(group => Object.keys(group)[0] !== groupName);
        saveBookmarks();
    }
}

// 分组名称内联编辑（简化版本）
function startEditGroupName(element) {
    const currentName = element.textContent.trim();
    const originalName = element.dataset.group;
    
    // 防止重复编辑
    if (element.querySelector('input')) {
        return;
    }
    
    // 创建输入框
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'form-control form-control-sm d-inline-block';
    input.style.width = 'auto';
    input.style.minWidth = '150px';
    
    // 添加标志，用于控制是否应该保存编辑
    let shouldSave = true;
    
    // 清空元素内容并添加输入框
    element.textContent = '';
    element.appendChild(input);
    
    // 选中输入框文本
    input.focus();
    input.select();
    
    // 绑定事件
    input.addEventListener('blur', () => {
        if (shouldSave) {
            finishEditGroupName(element, input, originalName);
        }
    });
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            finishEditGroupName(element, input, originalName);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            // 设置不保存标志
            shouldSave = false;
            // 直接取消编辑，恢复到原始名称
            element.innerHTML = '';
            element.textContent = originalName;
            element.dataset.group = originalName;
            console.log('Esc pressed: restored to', originalName);
        }
    });
}

// 取消分组名称编辑
function cancelEditGroupName(element, originalName) {
    // 清空元素内容
    element.innerHTML = '';
    // 恢复到原始名称
    element.textContent = originalName;
    // 确保data-group属性正确
    element.dataset.group = originalName;
}

function finishEditGroupName(element, input, originalName) {
    const newName = input.value.trim();
    
    if (!newName) {
        showMessage('分组名称不能为空', 'error');
        input.focus();
        return;
    }
    
    // 检查是否有重名分组
    const existingGroup = bookmarksData.find(group => {
        const groupName = Object.keys(group)[0];
        return groupName === newName && groupName !== originalName;
    });
    
    if (existingGroup) {
        showMessage('分组名称已存在', 'error');
        input.focus();
        return;
    }
    
    // 如果名称没有变化，直接取消编辑
    if (newName === originalName) {
        element.textContent = originalName;
        return;
    }
    
    // 更新数据
    const groupIndex = bookmarksData.findIndex(group => Object.keys(group)[0] === originalName);
    if (groupIndex !== -1) {
        const groupItems = bookmarksData[groupIndex][originalName];
        bookmarksData[groupIndex] = { [newName]: groupItems };
        
        // 更新UI
        element.textContent = newName;
        element.dataset.group = newName;
        
        // 更新页面引用
        updateGroupReferences(originalName, newName);
        
        // 保存
        saveBookmarks();
        
        showMessage(`分组名称已更改为"${newName}"`, 'success');
    } else {
        showMessage('分组不存在', 'error');
        element.textContent = originalName;
    }
}

function updateGroupReferences(oldName, newName) {
    // 更新各种DOM元素的group引用
    document.querySelectorAll(`[data-group="${oldName}"]`).forEach(el => {
        el.dataset.group = newName;
    });
    
    // 更新按钮onclick属性
    const addBtn = document.querySelector(`button[onclick="showAddBookmarkModal('${oldName}')"]`);
    if (addBtn) addBtn.setAttribute('onclick', `showAddBookmarkModal('${newName}')`);
    
    const deleteBtn = document.querySelector(`button[onclick="deleteGroup('${oldName}')"]`);
    if (deleteBtn) deleteBtn.setAttribute('onclick', `deleteGroup('${newName}')`);
    
    // 更新快速添加输入框
    const quickInput = document.querySelector(`input[onkeypress*="${oldName}"]`);
    if (quickInput) {
        quickInput.dataset.group = newName;
        quickInput.setAttribute('onkeypress', `handleQuickAddKeypress(event, '${newName}')`);
        quickInput.setAttribute('onblur', `handleQuickAddBlur(event, '${newName}')`);
    }
}

// 书签管理
function showAddBookmarkModal(groupName) {
    currentEditingGroup = groupName;
    currentEditingBookmark = null;
    document.getElementById('bookmarkModalTitle').textContent = '添加书签';
    document.getElementById('bookmarkGroup').value = groupName;
    document.getElementById('originalBookmarkName').value = '';
    
    // 清空表单
    document.getElementById('bookmarkName').value = '';
    document.getElementById('bookmarkHref').value = '';
    document.getElementById('bookmarkIcon').value = '';
    document.getElementById('bookmarkAbbr').value = '';
    document.getElementById('bookmarkDescription').value = '';
    
    new bootstrap.Modal(document.getElementById('bookmarkModal')).show();
    setTimeout(() => document.getElementById('bookmarkName').focus(), 100);
}

function editBookmark(groupName, bookmarkName) {
    currentEditingGroup = groupName;
    currentEditingBookmark = bookmarkName;
    
    const group = bookmarksData.find(g => Object.keys(g)[0] === groupName);
    const bookmark = group[groupName].find(b => Object.keys(b)[0] === bookmarkName);
    const bookmarkConfig = bookmark[bookmarkName];
    const bookmarkData = bookmarkConfig && bookmarkConfig.length > 0 ? bookmarkConfig[0] : {};
    
    document.getElementById('bookmarkModalTitle').textContent = '编辑书签';
    document.getElementById('bookmarkGroup').value = groupName;
    document.getElementById('originalBookmarkName').value = bookmarkName;
    
    document.getElementById('bookmarkName').value = bookmarkName;
    document.getElementById('bookmarkHref').value = bookmarkData.href || '';
    document.getElementById('bookmarkIcon').value = bookmarkData.icon || '';
    document.getElementById('bookmarkAbbr').value = bookmarkData.abbr || '';
    document.getElementById('bookmarkDescription').value = bookmarkData.description || '';
    
    new bootstrap.Modal(document.getElementById('bookmarkModal')).show();
    setTimeout(() => document.getElementById('bookmarkName').focus(), 100);
}

function saveBookmark(event) {
    if (event) event.preventDefault();

    const groupName = document.getElementById('bookmarkGroup').value;
    const originalName = document.getElementById('originalBookmarkName').value;
    const name = document.getElementById('bookmarkName').value.trim();
    let href = document.getElementById('bookmarkHref').value.trim();
    const icon = document.getElementById('bookmarkIcon').value.trim();
    const abbr = document.getElementById('bookmarkAbbr').value.trim();
    const description = document.getElementById('bookmarkDescription').value.trim();

    if (!name || !href) {
        showMessage('请填写书签名称和链接地址', 'error');
        return false;
    }

    // URL处理和验证
    if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('/')) {
        href = 'http://' + href;
    }

    // 验证URL格式
    if (!validateUrl(href)) {
        showMessage('无效的网址格式，请输入有效的网址（如：example.com 或 https://example.com）', 'error');
        document.getElementById('bookmarkHref').classList.add('is-invalid');
        return false;
    }

    document.getElementById('bookmarkHref').classList.remove('is-invalid');

    const bookmarkData = { href };
    if (icon) bookmarkData.icon = icon;
    if (abbr) bookmarkData.abbr = abbr;
    if (description) bookmarkData.description = description;

    const groupIndex = bookmarksData.findIndex(group => Object.keys(group)[0] === groupName);
    if (groupIndex === -1) {
        showMessage('分组不存在', 'error');
        return false;
    }

    if (currentEditingBookmark) {
        // 编辑现有书签
        const bookmarkIndex = bookmarksData[groupIndex][groupName].findIndex(b => Object.keys(b)[0] === originalName);
        if (bookmarkIndex !== -1) {
            bookmarksData[groupIndex][groupName][bookmarkIndex] = { [name]: [bookmarkData] };
        }
    } else {
        // 添加新书签
        bookmarksData[groupIndex][groupName].push({ [name]: [bookmarkData] });
    }

    saveBookmarks();
    const modal = bootstrap.Modal.getInstance(document.getElementById('bookmarkModal'));
    modal.hide();
    return false;
}

function deleteBookmark(groupName, bookmarkName) {
    if (confirm(`确定要删除书签"${bookmarkName}"吗？`)) {
        const groupIndex = bookmarksData.findIndex(group => Object.keys(group)[0] === groupName);
        if (groupIndex !== -1) {
            bookmarksData[groupIndex][groupName] = bookmarksData[groupIndex][groupName]
                .filter(b => Object.keys(b)[0] !== bookmarkName);
            saveBookmarks();
        }
    }
}

function autoFillBookmarkInfo() {
    // 自动填充功能，包含URL验证
    const hrefField = document.getElementById('bookmarkHref');
    const nameField = document.getElementById('bookmarkName');
    const href = hrefField.value.trim();
    
    if (href && !nameField.value) {
        try {
            let normalizedUrl = href;
            if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://') && !normalizedUrl.startsWith('/')) {
                normalizedUrl = 'http://' + normalizedUrl;
            }
            
            // 验证URL格式
            if (!validateUrl(normalizedUrl)) {
                hrefField.classList.add('is-invalid');
                showMessage('无效的网址格式，请输入有效的网址', 'error');
                return;
            }
            
            hrefField.classList.remove('is-invalid');
            const urlObj = new URL(normalizedUrl);
            const hostname = urlObj.hostname.replace(/^www\./, '');
            const domainParts = hostname.split('.');
            if (domainParts.length >= 2) {
                const siteName = domainParts[0];
                nameField.value = siteName.charAt(0).toUpperCase() + siteName.slice(1);
            }
            
            hrefField.value = normalizedUrl;
        } catch (e) {
            console.warn('Auto-fill failed:', e);
            hrefField.classList.add('is-invalid');
            showMessage('无法解析网址，请检查网址格式', 'error');
        }
    }
}

// 多选功能
function toggleMultiSelect() {
    isMultiSelectMode = !isMultiSelectMode;
    const checkboxes = document.querySelectorAll('.bookmark-checkbox');
    const multiSelectBtn = document.getElementById('multiSelectBtn');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    
    if (isMultiSelectMode) {
        checkboxes.forEach(cb => cb.classList.remove('d-none'));
        multiSelectBtn.innerHTML = '<i class="fas fa-times"></i> 退出多选';
        multiSelectBtn.classList.remove('btn-warning');
        multiSelectBtn.classList.add('btn-secondary');
        deleteSelectedBtn.classList.remove('d-none');
    } else {
        checkboxes.forEach(cb => {
            cb.classList.add('d-none');
            cb.checked = false;
        });
        multiSelectBtn.innerHTML = '<i class="fas fa-check-square"></i> 多选模式';
        multiSelectBtn.classList.remove('btn-secondary');
        multiSelectBtn.classList.add('btn-warning');
        deleteSelectedBtn.classList.add('d-none');
    }
}

function deleteSelected() {
    const selectedCheckboxes = document.querySelectorAll('.bookmark-checkbox:checked');
    if (selectedCheckboxes.length === 0) {
        showMessage('请选择要删除的书签', 'error');
        return;
    }

    if (confirm(`确定要删除选中的 ${selectedCheckboxes.length} 个书签吗？`)) {
        selectedCheckboxes.forEach(checkbox => {
            const groupName = checkbox.dataset.group;
            const bookmarkName = checkbox.dataset.bookmark;
            
            const groupIndex = bookmarksData.findIndex(group => Object.keys(group)[0] === groupName);
            if (groupIndex !== -1) {
                bookmarksData[groupIndex][groupName] = bookmarksData[groupIndex][groupName]
                    .filter(b => Object.keys(b)[0] !== bookmarkName);
            }
        });
        
        saveBookmarks();
        toggleMultiSelect();
    }
}

// 保存功能
function saveBookmarks() {
    fetch('/bookmarks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookmarksData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            location.reload();
        } else {
            showMessage('保存失败: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('保存失败: ' + error.message, 'error');
    });
}

// 保存但不刷新页面
function saveBookmarksWithoutReload() {
    return fetch('/bookmarks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookmarksData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            console.log('Bookmarks saved successfully');
            // 重新初始化拖拽功能
            setTimeout(() => initializeDragAndDrop(), 100);
        } else {
            showMessage('保存失败: ' + data.message, 'error');
        }
        return data;
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('保存失败: ' + error.message, 'error');
        throw error;
    });
}

// 动态添加书签到DOM
function addBookmarkToDOM(groupName, bookmarkName, bookmarkData) {
    const groupContainer = document.querySelector(`[data-group="${groupName}"] .bookmark-items`);
    if (!groupContainer) return;

    // 构建图标HTML
    let iconHtml = '';
    if (bookmarkData.icon) {
        iconHtml = `<img src="${bookmarkData.icon}" alt="${bookmarkName}" class="bookmark-icon" style="width: 16px; height: 16px; object-fit: cover;">`;
    } else if (bookmarkData.abbr) {
        iconHtml = `<span class="badge bg-primary" style="font-size: 0.6rem; padding: 2px 4px;">${bookmarkData.abbr}</span>`;
    } else {
        iconHtml = `<i class="fas fa-globe text-muted" style="font-size: 0.8rem;"></i>`;
    }

    const newBookmarkHtml = `
        <div class="col-lg-2 col-md-3 col-sm-4 col-6">
            <div class="card bookmark-item bookmark-card h-100" data-bookmark="${bookmarkName}" data-group="${groupName}">
                <div class="card-body p-2 position-relative">
                    <input type="checkbox" class="bookmark-checkbox position-absolute d-none multi-select-checkbox" 
                           style="top: 4px; left: 4px;"
                           data-group="${groupName}" data-bookmark="${bookmarkName}" data-id="${groupName}-${bookmarkName}">
                    
                    <div class="bookmark-actions">
                        <div class="btn-group-vertical">
                            <button class="btn btn-outline-warning" 
                                    onclick="editBookmark('${groupName}', '${bookmarkName}')" 
                                    title="编辑" 
                                    style="font-size: 0.7rem; padding: 2px 4px; line-height: 1.2; min-width: 22px; height: 22px;">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger" 
                                    onclick="deleteBookmark('${groupName}', '${bookmarkName}')" 
                                    title="删除" 
                                    style="font-size: 0.7rem; padding: 2px 4px; line-height: 1.2; min-width: 22px; height: 22px;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="bookmark-content">
                        <div class="d-flex align-items-center mb-2 bookmark-title-area" style="cursor: grab;">
                            <div class="bookmark-icon-wrapper me-2">
                                ${iconHtml}
                            </div>
                            <a href="${bookmarkData.href}" target="_blank" 
                               class="text-decoration-none text-dark text-truncate bookmark-title-link" 
                               style="font-size: 0.85rem; line-height: 1.2; font-weight: bold;" 
                               title="${bookmarkName} - 点击打开链接">${bookmarkName}</a>
                        </div>
                        
                        <div class="mb-2">
                            <a href="${bookmarkData.href}" target="_blank" 
                               class="text-muted text-decoration-none bookmark-url-link"
                               style="font-size: 0.75rem; line-height: 1.3;" 
                               title="点击打开: ${bookmarkData.description || bookmarkData.href}">
                                <small class="text-truncate d-block">${bookmarkData.description || bookmarkData.href}</small>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    groupContainer.insertAdjacentHTML('beforeend', newBookmarkHtml);
}

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing bookmarks page...');
    // 延迟一点时间确保所有脚本都加载完成
    setTimeout(initBookmarksPage, 150);
});

// 如果DOM已经加载完成
if (document.readyState !== 'loading') {
    console.log('DOM already ready, initializing immediately...');
    setTimeout(initBookmarksPage, 50);
}

// 输入错误处理的简化版本
function clearInputError(input) {
    // 移除输入框的错误状态
    input.classList.remove('is-invalid');
    
    // 查找并移除相关的错误提示元素
    const container = input.closest('.form-group') || input.parentNode;
    const errorElements = container.querySelectorAll('.invalid-feedback, .text-danger');
    errorElements.forEach(el => el.remove());
    
    // 如果输入框获得焦点，也清除错误状态
    if (input === document.activeElement) {
        input.classList.remove('is-invalid');
    }
} 