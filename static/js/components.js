/**
 * Homeman 组件JavaScript文件
 * 包含各种通用组件的功能
 */

// ===== 书签管理组件 =====
window.BookmarkManager = {
    data: [],
    currentEditingGroup: null,
    currentEditingBookmark: null,
    isMultiSelectMode: false,
    groupSortable: null,
    bookmarkSortables: [],
    
    // 初始化书签管理器
    init: function(bookmarksData) {
        this.data = bookmarksData || [];
        this.initializeDragAndDrop();
    },
    
    // 初始化拖拽功能
    initializeDragAndDrop: function() {
        // 销毁现有的sortable实例
        if (this.groupSortable) {
            this.groupSortable.destroy();
        }
        this.bookmarkSortables.forEach(sortable => sortable.destroy());
        this.bookmarkSortables = [];

        // 分组拖拽排序
        const container = document.getElementById('bookmarks-container');
        if (container && window.Sortable) {
            this.groupSortable = Sortable.create(container, {
                handle: '.group-handle',
                animation: 150,
                onEnd: (evt) => {
                    const item = this.data.splice(evt.oldIndex, 1)[0];
                    this.data.splice(evt.newIndex, 0, item);
                    this.save();
                }
            });
        }

        // 书签拖拽排序和移动
        document.querySelectorAll('.bookmark-items').forEach(container => {
            if (window.Sortable) {
                const sortable = Sortable.create(container, {
                    group: 'bookmarks',
                    handle: '.bookmark-title-area',
                    animation: 150,
                    onEnd: (evt) => {
                        const oldGroupName = evt.from.dataset.group;
                        const newGroupName = evt.to.dataset.group;
                        
                        const oldGroupIndex = this.data.findIndex(g => Object.keys(g)[0] === oldGroupName);
                        const newGroupIndex = this.data.findIndex(g => Object.keys(g)[0] === newGroupName);
                        
                        if (oldGroupIndex !== -1 && newGroupIndex !== -1) {
                            const bookmark = this.data[oldGroupIndex][oldGroupName].splice(evt.oldIndex, 1)[0];
                            this.data[newGroupIndex][newGroupName].splice(evt.newIndex, 0, bookmark);
                            this.save();
                        }
                    }
                });
                this.bookmarkSortables.push(sortable);
            }
        });
    },
    
    // 提取网站信息
    extractSiteInfo: function(url) {
        try {
            const normalizedUrl = normalizeUrl(url);
            const urlObj = new URL(normalizedUrl);
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
                'reddit': 'Reddit',
                'twitter': 'Twitter',
                'facebook': 'Facebook',
                'linkedin': 'LinkedIn',
                'instagram': 'Instagram',
                'medium': 'Medium',
                'netflix': 'Netflix',
                'spotify': 'Spotify'
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
                normalizedUrl: normalizedUrl
            };
        } catch (e) {
            console.warn('URL 解析失败:', e);
            return {
                name: '',
                abbr: '',
                domain: '',
                normalizedUrl: normalizeUrl(url)
            };
        }
    },
    
    // 保存书签数据
    save: function() {
        fetch('/bookmarks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(this.data)
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
    },
    
    // 保存但不刷新页面
    saveWithoutReload: function() {
        return fetch('/bookmarks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(this.data)
        })
        .then(response => response.json());
    }
};

// ===== 表单管理组件 =====
window.FormManager = {
    // 显示模态框
    showModal: function(modalId, title, data = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        const titleElement = modal.querySelector('.modal-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
        
        // 填充表单数据
        Object.keys(data).forEach(key => {
            const input = modal.querySelector(`#${key}`);
            if (input) {
                input.value = data[key] || '';
            }
        });
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        // 自动聚焦第一个输入框
        setTimeout(() => {
            const firstInput = modal.querySelector('input:not([type="hidden"]), textarea, select');
            if (firstInput) {
                firstInput.focus();
            }
        }, 150);
        
        return bsModal;
    },
    
    // 验证表单
    validateForm: function(formElement) {
        const inputs = formElement.querySelectorAll('input[required], textarea[required], select[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            const value = input.value.trim();
            if (!value) {
                setInputError(input);
                isValid = false;
            } else {
                clearInputError(input);
                
                // URL验证
                if (input.type === 'url' && value) {
                    const normalizedUrl = normalizeUrl(value);
                    if (!isValidWebUrl(normalizedUrl)) {
                        setInputError(input);
                        isValid = false;
                    } else {
                        input.value = normalizedUrl;
                    }
                }
            }
        });
        
        return isValid;
    },
    
    // 清空表单
    clearForm: function(formElement) {
        const inputs = formElement.querySelectorAll('input:not([type="hidden"]), textarea, select');
        inputs.forEach(input => {
            input.value = '';
            clearInputError(input);
        });
    }
};

// ===== 拖拽排序组件 =====
window.SortableManager = {
    instances: [],
    
    // 创建排序实例
    create: function(element, options = {}) {
        if (!window.Sortable || !element) return null;
        
        const defaultOptions = {
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag'
        };
        
        const sortable = Sortable.create(element, { ...defaultOptions, ...options });
        this.instances.push(sortable);
        return sortable;
    },
    
    // 销毁所有实例
    destroyAll: function() {
        this.instances.forEach(instance => {
            if (instance && typeof instance.destroy === 'function') {
                instance.destroy();
            }
        });
        this.instances = [];
    }
};

// ===== 编辑功能组件 =====
window.InlineEditor = {
    // 开始编辑
    startEdit: function(element, options = {}) {
        const currentText = element.textContent.trim();
        const originalData = element.dataset;
        
        // 防止重复编辑
        if (element.querySelector('input')) {
            return;
        }
        
        // 创建输入框
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.className = options.inputClass || 'form-control';
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('spellcheck', 'false');
        
        // 添加编辑状态样式
        element.classList.add(options.editingClass || 'editing');
        
        // 清空元素内容并添加输入框
        element.textContent = '';
        element.appendChild(input);
        
        // 选中输入框文本
        input.focus();
        input.select();
        
        // 添加取消标志
        let isCancelled = false;
        
        // 绑定事件
        const finish = () => {
            if (!isCancelled) {
                this.finishEdit(element, input, options);
            }
        };
        
        const cancel = () => {
            isCancelled = true;
            this.cancelEdit(element, input, currentText, options);
        };
        
        input.addEventListener('blur', finish);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finish();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
            }
        });
        
        // 防止换行
        input.addEventListener('input', () => {
            input.value = input.value.replace(/\n/g, '');
        });
        
        input.addEventListener('click', (e) => e.stopPropagation());
    },
    
    // 完成编辑
    finishEdit: function(element, input, options = {}) {
        const newValue = input.value.trim();
        const originalValue = element.dataset.original || '';
        
        if (!newValue) {
            showError(options.emptyMessage || '内容不能为空');
            input.focus();
            return;
        }
        
        // 如果值没有变化，取消编辑
        if (newValue === originalValue) {
            this.cancelEdit(element, input, originalValue, options);
            return;
        }
        
        // 调用保存回调
        if (options.onSave) {
            const result = options.onSave(newValue, originalValue, element);
            if (result === false) {
                input.focus();
                return;
            }
        }
        
        // 更新显示
        element.classList.remove(options.editingClass || 'editing');
        element.textContent = newValue;
        
        if (options.onSuccess) {
            options.onSuccess(newValue, element);
        }
    },
    
    // 取消编辑
    cancelEdit: function(element, input, originalValue, options = {}) {
        element.classList.remove(options.editingClass || 'editing');
        element.textContent = originalValue;
        
        if (options.onCancel) {
            options.onCancel(element);
        }
    }
};

// ===== 多选管理组件 =====
window.MultiSelectManager = {
    isActive: false,
    selectedItems: new Set(),
    
    // 切换多选模式
    toggle: function(containerSelector = '.multi-select-container') {
        this.isActive = !this.isActive;
        const container = document.querySelector(containerSelector);
        
        if (this.isActive) {
            this.activate(container);
        } else {
            this.deactivate(container);
        }
        
        return this.isActive;
    },
    
    // 激活多选模式
    activate: function(container) {
        if (container) {
            container.classList.add('multi-select-mode');
        }
        
        document.querySelectorAll('.multi-select-checkbox').forEach(cb => {
            cb.classList.remove('d-none');
            cb.checked = false;
        });
        
        this.selectedItems.clear();
        this.updateUI();
    },
    
    // 停用多选模式
    deactivate: function(container) {
        if (container) {
            container.classList.remove('multi-select-mode');
        }
        
        document.querySelectorAll('.multi-select-checkbox').forEach(cb => {
            cb.classList.add('d-none');
            cb.checked = false;
        });
        
        this.selectedItems.clear();
        this.updateUI();
    },
    
    // 更新UI状态
    updateUI: function() {
        const deleteBtn = document.getElementById('deleteSelectedBtn');
        const multiSelectBtn = document.getElementById('multiSelectBtn');
        
        if (this.isActive) {
            if (deleteBtn) deleteBtn.classList.remove('d-none');
            if (multiSelectBtn) {
                multiSelectBtn.innerHTML = '<i class="fas fa-times"></i> 退出多选';
                multiSelectBtn.classList.remove('btn-warning');
                multiSelectBtn.classList.add('btn-secondary');
            }
        } else {
            if (deleteBtn) deleteBtn.classList.add('d-none');
            if (multiSelectBtn) {
                multiSelectBtn.innerHTML = '<i class="fas fa-check-square"></i> 多选模式';
                multiSelectBtn.classList.remove('btn-secondary');
                multiSelectBtn.classList.add('btn-warning');
            }
        }
    },
    
    // 处理选择变化
    handleSelectionChange: function(checkbox) {
        const itemId = checkbox.dataset.id || `${checkbox.dataset.group}-${checkbox.dataset.bookmark}`;
        
        if (checkbox.checked) {
            this.selectedItems.add(itemId);
        } else {
            this.selectedItems.delete(itemId);
        }
        
        this.updateDeleteButton();
    },
    
    // 更新删除按钮状态
    updateDeleteButton: function() {
        const deleteBtn = document.getElementById('deleteSelectedBtn');
        if (deleteBtn) {
            if (this.selectedItems.size > 0) {
                deleteBtn.disabled = false;
                deleteBtn.textContent = `删除选中 (${this.selectedItems.size})`;
            } else {
                deleteBtn.disabled = true;
                deleteBtn.textContent = '删除选中';
            }
        }
    },
    
    // 获取选中的项目
    getSelected: function() {
        return Array.from(this.selectedItems);
    }
};

// ===== 自动初始化 =====
document.addEventListener('DOMContentLoaded', function() {
    // 初始化多选功能
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('multi-select-checkbox')) {
            window.MultiSelectManager.handleSelectionChange(e.target);
        }
    });
    
    console.log('Components initialized');
}); 