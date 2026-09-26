/* ============================================================
 * 标签页管理
 * ============================================================ */

/** 标签页计数器，用于生成唯一 id */
let tabIdCounter = 0;

/**
 * 创建一个新标签页，加入 tabs 数组（不切换）
 * @param {string[]} [initialPath]
 * @returns {object} 新建的标签页对象
 */
function createTab(initialPath = []) {
    const id = 'tab_' + (++tabIdCounter) + '_' + Date.now();
    const tab = {
        id,
        currentPath: [...initialPath],
        sortKey: 'name',
        sortAsc: true,
        searchQuery: ''
    };
    tabs.push(tab);
    return tab;
}

/**
 * 标签页标题
 */
function getTabTitle(tab) {
    if (!tab) return '';
    if (tab.currentPath.length === 0) return '全部文件';
    return tab.currentPath[tab.currentPath.length - 1];
}

/**
 * 切换标签页
 */
function switchTab(id) {
    if (activeTabId === id) return;
    const target = tabs.find(t => t.id === id);
    if (!target) return;
    activeTabId = id;

    // 同步搜索输入框
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClear');
    if (input) {
        input.value = target.searchQuery || '';
        if (clearBtn) clearBtn.classList.toggle('show', input.value.length > 0);
    }

    renderTabBar();
    renderExplorer();
}

/**
 * 关闭标签页
 */
function closeTab(id) {
    if (tabs.length <= 1) return; // 不允许关闭最后一个

    const idx = tabs.findIndex(t => t.id === id);
    if (idx === -1) return;

    tabs.splice(idx, 1);

    if (activeTabId === id) {
        const next = tabs[Math.min(idx, tabs.length - 1)];
        activeTabId = next.id;

        const input = document.getElementById('searchInput');
        const clearBtn = document.getElementById('searchClear');
        if (input) {
            input.value = next.searchQuery || '';
            if (clearBtn) clearBtn.classList.toggle('show', input.value.length > 0);
        }
        renderExplorer();
    }

    renderTabBar();
}

/**
 * 新建标签页并切换过去（从当前路径开始）
 */
function createAndSwitchTab() {
    const currentPath = getCurrentPath();
    const tab = createTab(currentPath);
    activeTabId = tab.id;

    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClear');
    if (input) {
        input.value = '';
        if (clearBtn) clearBtn.classList.remove('show');
    }

    renderTabBar();
    renderExplorer();
}

/**
 * 只更新当前激活标签页的标题（避免整栏重渲染）
 */
function updateActiveTabTitle() {
    const tabEl = document.querySelector(`.tab-page[data-tab-id="${activeTabId}"]`);
    if (!tabEl) return;
    const titleEl = tabEl.querySelector('.tab-page-title');
    if (titleEl) titleEl.textContent = getTabTitle(getCurrentTab());
}

/**
 * 渲染标签页栏
 */
function renderTabBar() {
    const bar = document.getElementById('folderTabs');
    if (!bar) return;

    bar.innerHTML = '';

    for (const tab of tabs) {
        const el = document.createElement('div');
        el.className = 'tab-page';
        if (tab.id === activeTabId) el.classList.add('active');
        el.dataset.tabId = tab.id;
        el.draggable = true;
        el.title = tab.currentPath.length === 0 ? '全部文件' : '/' + tab.currentPath.join('/');

        el.innerHTML = `
            <span class="tab-page-title">${escapeHtml(getTabTitle(tab))}</span>
            <button class="tab-page-close" type="button" title="关闭">×</button>`;

        // 只剩一个标签时隐藏关闭按钮
        if (tabs.length <= 1) {
            el.querySelector('.tab-page-close').style.display = 'none';
        }

        el.addEventListener('click', ev => {
            if (ev.target.closest('.tab-page-close')) {
                ev.stopPropagation();
                closeTab(tab.id);
                return;
            }
            switchTab(tab.id);
        });

        bar.appendChild(el);
    }

    // "+" 按钮
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'folder-tab-add';
    addBtn.id = 'folderTabAdd';
    addBtn.title = '新建标签页 (Ctrl+T / Alt+T)';
    addBtn.textContent = '+';
    addBtn.addEventListener('click', () => createAndSwitchTab());
    bar.appendChild(addBtn);
}

/* ============================================================
 * 标签页拖拽排序（HTML5 原生 drag）
 * ============================================================ */

let draggedTabId = null;
let dragOverTabId = null;

function initTabDrag() {
    const bar = document.getElementById('folderTabs');
    if (!bar) return;

    bar.addEventListener('dragstart', e => {
        const tabEl = e.target.closest('.tab-page');
        if (!tabEl) return;
        draggedTabId = tabEl.dataset.tabId;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedTabId);
        setTimeout(() => tabEl.classList.add('dragging'), 0);
    });

    bar.addEventListener('dragover', e => {
        e.preventDefault();
        if (!draggedTabId) return;
        const target = e.target.closest('.tab-page');
        if (!target || target.dataset.tabId === draggedTabId) return;

        dragOverTabId = target.dataset.tabId;
        bar.querySelectorAll('.tab-page').forEach(t => t.classList.remove('drag-over'));
        target.classList.add('drag-over');
    });

    bar.addEventListener('dragleave', e => {
        const target = e.target.closest('.tab-page');
        if (target) target.classList.remove('drag-over');
    });

    bar.addEventListener('drop', e => {
        e.preventDefault();
        if (!draggedTabId || !dragOverTabId) return;

        const fromIdx = tabs.findIndex(t => t.id === draggedTabId);
        const toIdx = tabs.findIndex(t => t.id === dragOverTabId);
        if (fromIdx === -1 || toIdx === -1) return;

        const [moved] = tabs.splice(fromIdx, 1);
        tabs.splice(toIdx, 0, moved);
        renderTabBar();
    });

    bar.addEventListener('dragend', () => {
        draggedTabId = null;
        dragOverTabId = null;
        bar.querySelectorAll('.tab-page').forEach(t => {
            t.classList.remove('dragging', 'drag-over');
        });
    });
}

/* ============================================================
 * Ctrl+T 新建标签页
 * ============================================================ */

function initTabShortcuts() {
    document.addEventListener('keydown', e => {
        if (e.target.matches('input, textarea, [contenteditable="true"]')) return;
        if (document.querySelector('#textViewer.show')) return;
        if (document.querySelector('#dialog.show')) return;
        if (document.querySelector('#newFileDialog.show')) return;
        if (document.querySelector('#openWithDialog.show')) return;

        const k = e.key.toLowerCase();
        if (k !== 't') return;

        // Ctrl+T（Electron 里有效，浏览器里会被浏览器吞掉）
        if (e.ctrlKey && !e.shiftKey && !e.altKey) {
            e.preventDefault();
            createAndSwitchTab();
            return;
        }

        // Alt+T（浏览器和 Electron 都有效）
        if (e.altKey && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            createAndSwitchTab();
        }
    });
}

/* ============================================================
 * 初始化标签页系统
 * ============================================================ */

function initFolderTabs() {
    // 创建初始标签页
    createTab([]);
    activeTabId = tabs[0].id;
    renderTabBar();
    initTabDrag();
    initTabShortcuts();
}