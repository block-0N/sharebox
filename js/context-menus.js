/* ============================================================
 * 右键菜单 + 属性对话框
 * ============================================================ */

/* ---------- DOM 缓存 ---------- */

function ensureContextMenu() {
    let menu = document.getElementById('contextMenu');
    if (menu) return menu;
    menu = document.createElement('div');
    menu.id = 'contextMenu';
    menu.className = 'context-menu';
    document.body.appendChild(menu);
    return menu;
}

function hideContextMenu() {
    const menu = document.getElementById('contextMenu');
    if (menu) menu.classList.remove('show');
    document.querySelectorAll('.context-submenu').forEach(el => el.remove());
}

/* ---------- 判断右键是否点在文字上（用于区分内容区/空白区） ---------- */

function isPointOnText(el, x, y) {
    if (!el || !el.textContent) return false;
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = range.getClientRects();
    for (const r of rects) {
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return true;
    }
    return false;
}

/* ---------- 菜单渲染 ---------- */

function renderMenuItems(container, list) {
    for (const it of list) {
        if (it.sep) {
            const sep = document.createElement('div');
            sep.className = 'context-menu-sep';
            container.appendChild(sep);
            continue;
        }
        const el = document.createElement('div');
        el.className = 'context-menu-item';
        if (it.disabled) el.classList.add('disabled');
        if (it.danger) el.classList.add('danger');

        const hasChildren = it.children && it.children.length > 0;
        if (hasChildren) el.classList.add('has-children');

        el.innerHTML = `<span>${escapeHtml(it.label)}</span>` +
            (hasChildren
                ? '<span class="arrow">▸</span>'
                : (it.shortcut ? `<span class="shortcut">${escapeHtml(it.shortcut)}</span>` : ''));

        if (hasChildren) {
            el.addEventListener('mouseenter', () => {
                document.querySelectorAll('.context-submenu').forEach(s => s.remove());
                const subEl = document.createElement('div');
                subEl.className = 'context-submenu show';
                renderMenuItems(subEl, it.children);
                document.body.appendChild(subEl);

                const r = el.getBoundingClientRect();
                const sr = subEl.getBoundingClientRect();
                let left = r.right - 2;
                if (left + sr.width > window.innerWidth - 8) left = r.left - sr.width + 2;
                let top = r.top;
                if (top + sr.height > window.innerHeight - 8) top = window.innerHeight - sr.height - 8;
                subEl.style.left = left + 'px';
                subEl.style.top = top + 'px';
            });
        } else if (!it.disabled && it.action) {
            el.addEventListener('click', ev => {
                ev.stopPropagation();
                hideContextMenu();
                it.action();
            });
        }

        container.appendChild(el);
    }
}

/* ---------- 场景分发 ---------- */

function showContextMenu(x, y) {
    const menu = ensureContextMenu();
    document.querySelectorAll('.context-submenu').forEach(el => el.remove());

    const quickEl = document.querySelector('#fileList .quick-item.selected');
    const favEl   = document.querySelector('#fileList .fav-item.selected');
    const sels    = getSelectedItems();

    let items;
    if (quickEl) {
        items = buildMenuItemsForQuick(quickEl.dataset.quick);
    } else if (favEl) {
        items = buildMenuItemsForFavorite(favEl);
    } else if (sels.length === 1 && sels[0].type === 'file') {
        items = buildMenuItemsForFile(sels[0]);
    } else if (sels.length === 1 && sels[0].type === 'folder') {
        items = buildMenuItemsForFolder(sels[0]);
    } else if (sels.length > 1) {
        items = buildMenuItemsForMulti(sels);
    } else {
        items = buildMenuItemsForBlank();
    }

    menu.innerHTML = '';
    renderMenuItems(menu, items);

    menu.style.left = '0px';
    menu.style.top = '0px';
    menu.classList.add('show');
    const rect = menu.getBoundingClientRect();
    const px = Math.min(x, window.innerWidth - rect.width - 8);
    const py = Math.min(y, window.innerHeight - rect.height - 8);
    menu.style.left = px + 'px';
    menu.style.top = py + 'px';
}

/* ---------- 菜单项构造 ---------- */

const VIEW_MODES = [
    { key: 'xlarge',  label: '超大图标' },
    { key: 'large',   label: '大图标' },
    { key: 'medium',  label: '中等图标' },
    { key: 'small',   label: '小图标' },
    { key: 'list',    label: '列表' },
    { key: 'details', label: '详细信息' },
    { key: 'tile',    label: '平铺' },
    { key: 'content', label: '内容' }
];
function buildMenuItemsForFile(sel) {
    const f = findFileByStoragePath(sel.path);
    const items = [];
    items.push({ label: '打开', shortcut: '双击', action: () => { if (f) openPreview(f); } });
    items.push({ label: '打开方式', action: () => { if (f) chooseOpenMethod(f); } });
    items.push({ label: '属性', action: () => showPropertiesForFile(sel) });
    items.push({ sep: true });
    items.push({ label: '下载', action: () => { if (f) downloadFile(f.displayName, f.file_url); } });
    items.push({ label: '复制', shortcut: 'Ctrl+C', action: () => copySelection(false) });
    items.push({ label: '剪切', shortcut: 'Ctrl+X', action: () => copySelection(true) });
    items.push({ label: '重命名', shortcut: 'F2', action: renameSelected });
    const favData = buildFavoriteFromSelection(sel);
    if (favData) {
        items.push({ sep: true });
        const faved = isFavorited(favData.path);
        items.push({ label: faved ? '取消收藏' : '收藏', action: () => toggleFavorite(favData) });
    }
    items.push({ sep: true });
    items.push({ label: '删除', shortcut: 'Del', danger: true, action: deleteSelected });
    return items;
}

function buildMenuItemsForFolder(sel) {
    const items = [];
    items.push({ label: '打开', shortcut: '双击', action: () => openFolderBySel(sel) });
    items.push({ label: '在新标签页中打开', action: () => openFolderInNewTab(sel) });
    items.push({ label: '属性', action: () => showPropertiesForFolder(sel) });
    items.push({ sep: true });
    const currentPath = getCurrentPath();
    items.push({ label: '打包下载', action: () => downloadFolderZip(buildFullPath(currentPath, sel.name)) });
    items.push({ label: '复制', shortcut: 'Ctrl+C', action: () => copySelection(false) });
    items.push({ label: '剪切', shortcut: 'Ctrl+X', action: () => copySelection(true) });
    items.push({ label: '重命名', shortcut: 'F2', action: renameSelected });
    const favData = buildFavoriteFromSelection(sel);
    if (favData) {
        items.push({ sep: true });
        const faved = isFavorited(favData.path);
        items.push({ label: faved ? '取消收藏' : '收藏', action: () => toggleFavorite(favData) });
    }
    items.push({ sep: true });
    items.push({ label: '删除', shortcut: 'Del', danger: true, action: deleteSelected });
    return items;
}

function buildMenuItemsForMulti(sels) {
    const n = sels.length;
    const items = [];
    items.push({ label: `已选 ${n} 项`, disabled: true });
    items.push({ label: `属性`, action: () => showPropertiesForMulti(sels) });
    items.push({ sep: true });
    items.push({ label: `复制 ${n} 项`, shortcut: 'Ctrl+C', action: () => copySelection(false) });
    items.push({ label: `剪切 ${n} 项`, shortcut: 'Ctrl+X', action: () => copySelection(true) });
    items.push({ sep: true });
    items.push({ label: `删除 ${n} 项`, shortcut: 'Del', danger: true, action: deleteSelected });
    return items;
}

function buildMenuItemsForQuick(type) {
    const items = [];
    const label = type === 'favorites' ? '收藏夹' : type === 'all' ? '全部文件' : '分享的文件';
    items.push({ label: '打开', shortcut: '双击', action: () => enterQuickView(type) });
    items.push({ label: '在新标签页中打开', action: () => openQuickInNewTab(type) });
    items.push({ label: '属性', action: () => showPropertiesForQuick(type) });
    return items;
}

function buildMenuItemsForFavorite(favEl) {
    const items = [];
    items.push({ label: '打开', shortcut: '双击', action: () => openFavoriteItem(favEl) });
    if (favEl.dataset.favType === 'folder') {
        items.push({ label: '在新标签页中打开', action: () => openFavoriteInNewTab(favEl) });
    }
    items.push({ label: '属性', action: () => showPropertiesForFavorite(favEl) });
    items.push({ sep: true });
    items.push({ label: '取消收藏', danger: true, action: () => removeFavorite(favEl.dataset.favPath) });
    items.push({ label: '打开文件所在位置', action: () => openFavoriteLocation(favEl) });
    items.push({ label: '复制路径', action: () => copyFavoritePath(favEl) });
    return items;
}

function buildMenuItemsForBlank() {
    const view = getView();
    const items = [];

    // 只有真实目录视图才允许新建/粘贴/排序
    if (view === 'path') {
        items.push({ label: '新建文件', action: createNewFile });
        items.push({ label: '新建文件夹', action: createNewFolder });
        items.push({ sep: true });
        items.push({
            label: '粘贴',
            shortcut: 'Ctrl+V',
            disabled: !clipboard || clipboard.entries.length === 0,
            action: pasteHere
        });
        items.push({ sep: true });

        const SORT_OPTIONS = [
            { key: 'name', label: '名称' },
            { key: 'size', label: '大小' },
            { key: 'type', label: '类型' },
            { key: 'mtime', label: '修改日期' }
        ];
        const { key: sortKey, asc: sortAsc } = getSort();
        items.push({
            label: '排序方式',
            children: SORT_OPTIONS.map(opt => {
                const isCurrent = sortKey === opt.key;
                return {
                    label: opt.label,
                    shortcut: isCurrent ? (sortAsc ? '↑' : '↓') : '',
                    action: () => {
                        if (sortKey === opt.key) {
                            setSort(opt.key, !sortAsc);
                        } else {
                            setSort(opt.key, (opt.key === 'name' || opt.key === 'type'));
                        }
                        renderFileList();
                    }
                };
            })
        });

        items.push({ sep: true });
    }

    const currentMode = getViewMode();
    items.push({
        label: '查看',
        children: VIEW_MODES.map(m => ({
            label: m.label,
            shortcut: currentMode === m.key ? '●' : '',
            action: () => {
                setViewMode(m.key);
                renderFileList();
            }
        }))
    });

    items.push({ sep: true });
    items.push({ label: '刷新', action: () => loadFiles() });
    return items;
}

/* ---------- 打开动作 ---------- */

function openFolderBySel(sel) {
    const cp = getCurrentPath();
    cp.push(sel.name);
    setCurrentPath(cp);
    renderExplorer();
    updateActiveTabTitle();
}

function openFolderInNewTab(sel) {
    const cp = [...getCurrentPath(), sel.name];
    createTabAndSwitch(cp, 'path');
}

function enterQuickView(type) {
    if (type === 'favorites') setView('favorites');
    else if (type === 'all') { setView('path'); setCurrentPath([]); }
    else if (type === 'shared') { setView('path'); setCurrentPath(['文件']); }

    if (getSearchQuery()) {
        setSearchQuery('');
        const si = document.getElementById('searchInput');
        if (si) si.value = '';
        const cb = document.getElementById('searchClear');
        if (cb) cb.classList.remove('show');
    }
    renderExplorer();
    updateActiveTabTitle();
}

function openQuickInNewTab(type) {
    if (type === 'favorites') createTabAndSwitch([], 'favorites');
    else if (type === 'all') createTabAndSwitch([], 'path');
    else if (type === 'shared') createTabAndSwitch(['文件'], 'path');
}

function openFavoriteInNewTab(favEl) {
    if (favEl.dataset.favType !== 'folder') return;
    const parts = favEl.dataset.favPath.split('/').filter(Boolean);
    createTabAndSwitch(parts, 'path');
}

function createTabAndSwitch(path, view) {
    const tab = createTab(path, view);
    activeTabId = tab.id;
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClear');
    if (input) {
        input.value = '';
        if (clearBtn) clearBtn.classList.remove('show');
    }
    renderTabBar();
    renderExplorer();
    updateActiveTabTitle();
}

/* ---------- 收藏夹项辅助 ---------- */

function openFavoriteLocation(favEl) {
    const favType = favEl.dataset.favType;
    const favPath = favEl.dataset.favPath;
    const favName = favEl.dataset.favName;
    const storagePath = favEl.dataset.storagePath;

    let parentParts = [];
    if (favPath.includes('/')) {
        const parent = favPath.slice(0, favPath.lastIndexOf('/'));
        parentParts = parent.split('/').filter(Boolean);
    }

    setView('path');
    setCurrentPath(parentParts);
    renderExplorer();
    updateActiveTabTitle();

    setTimeout(() => {
        const list = document.getElementById('fileList');
        let targetEl = null;
        if (favType === 'file' && storagePath) {
            targetEl = list.querySelector(`.fe-item.fe-file[data-path="${CSS.escape(storagePath)}"]`);
        } else if (favType === 'folder') {
            targetEl = list.querySelector(`.fe-item.fe-folder[data-name="${CSS.escape(favName)}"]`);
        }
        if (targetEl) {
            list.querySelectorAll('.fe-item.selected').forEach(el => el.classList.remove('selected'));
            targetEl.classList.add('selected');
            targetEl.scrollIntoView({ block: 'nearest' });
        } else {
            showToast('无法定位该文件（可能已移动或删除）', 'info');
        }
    }, 100);
}

async function copyFavoritePath(favEl) {
    const favPath = favEl.dataset.favPath;
    const full = '/' + favPath.split('/').filter(Boolean).join('/');
    try {
        await navigator.clipboard.writeText(full);
        showToast('路径已复制', 'success');
    } catch (e) {
        showToast('复制失败', 'error');
    }
}

/* ---------- 属性：数据准备 ---------- */

function countTree(node) {
    let files = 0, folders = 0;
    for (const name of Object.keys(node._children)) {
        folders++;
        const sub = countTree(node._children[name]);
        files += sub.files;
        folders += sub.folders;
    }
    files += Object.keys(node._files).length;
    return { files, folders };
}

function showPropertiesForFile(sel) {
    const f = findFileByStoragePath(sel.path);
    if (!f) { dlgAlert('属性', '文件不存在'); return; }
    const parent = f.file_name.includes('/')
        ? f.file_name.slice(0, f.file_name.lastIndexOf('/'))
        : '';
    const rows = [
        { label: '类型', value: getFileTypeLabel(f.displayName) },
        { label: '大小', value: formatBytes(f._size || 0) },
        { label: '修改日期', value: formatTime(f._mtime) || '—' },
        { label: '位置', value: parent ? '/' + parent : '根目录' },
        { label: '完整路径', value: '/' + f.file_name }
    ];
    dlgProperties(f.displayName, getFileIconUrl(f.displayName), rows);
}

function showPropertiesForFolder(sel) {
    const currentPath = getCurrentPath();
    const folderPath = buildFullPath(currentPath, sel.name);
    const node = getNodeByPath([...currentPath, sel.name]);
    if (!node) { dlgAlert('属性', '文件夹不存在'); return; }
    const stats = countTree(node);
    const rows = [
        { label: '类型', value: '文件夹' },
        { label: '内含文件数', value: String(stats.files) },
        { label: '内含文件夹数', value: String(stats.folders) },
        { label: '总大小', value: formatBytes(node._totalSize || 0) },
        { label: '修改日期', value: formatTime(node._latestMtime) || '—' },
        { label: '位置', value: currentPath.length === 0 ? '根目录' : '/' + currentPath.join('/') },
        { label: '完整路径', value: '/' + folderPath }
    ];
    dlgProperties(sel.name, DEFAULT_FOLDER_ICON, rows);
}

function showPropertiesForMulti(sels) {
    let files = 0, folders = 0, totalSize = 0;
    for (const sel of sels) {
        if (sel.type === 'file') {
            const f = findFileByStoragePath(sel.path);
            if (f) { files++; totalSize += (f._size || 0); }
        } else {
            const currentPath = getCurrentPath();
            const node = getNodeByPath([...currentPath, sel.name]);
            if (node) {
                folders++;
                const stats = countTree(node);
                files += stats.files;
                folders += stats.folders;
                totalSize += (node._totalSize || 0);
            }
        }
    }
    const rows = [
        { label: '选中项', value: `${sels.length} 项` },
        { label: '其中文件', value: `${files} 个` },
        { label: '其中文件夹', value: `${folders} 个` },
        { label: '总大小', value: formatBytes(totalSize) }
    ];
    dlgProperties(`已选 ${sels.length} 项`, DEFAULT_FILE_ICON, rows);
}

function showPropertiesForQuick(type) {
    if (type === 'favorites') {
        const rows = [
            { label: '类型', value: '快速访问 · 收藏夹' },
            { label: '收藏数量', value: String(favoritesLoaded ? favoritesCache.length : '—') },
            { label: '说明', value: '你手动收藏的文件和文件夹' }
        ];
        dlgProperties('收藏夹', VSC_ICON_CDN + 'folder_type_favorite.svg', rows);
    } else if (type === 'all') {
        const rootNode = getNodeByPath([]);
        const stats = rootNode ? countTree(rootNode) : { files: 0, folders: 0 };
        const rootImmediateFolders = rootNode ? Object.keys(rootNode._children).length : 0;
        const rows = [
            { label: '类型', value: '快速访问 · 全部文件' },
            { label: '顶层文件夹', value: `${rootImmediateFolders} 个` },
            { label: '总文件数', value: `${stats.files} 个` },
            { label: '总文件夹数', value: `${stats.folders} 个` },
            { label: '总大小', value: formatBytes(rootNode ? (rootNode._totalSize || 0) : 0) },
            { label: '容量配额', value: formatBytes(STORAGE_QUOTA) }
        ];
        dlgProperties('全部文件', VSC_ICON_CDN + 'folder_type_root.svg', rows);
    } else if (type === 'shared') {
        const sharedNode = getNodeByPath(['文件']);
        const stats = sharedNode ? countTree(sharedNode) : { files: 0, folders: 0 };
        const rows = [
            { label: '类型', value: '快速访问 · 分享的文件' },
            { label: '目录', value: '/文件' },
            { label: '内含文件数', value: String(stats.files) },
            { label: '内含文件夹数', value: String(stats.folders) },
            { label: '总大小', value: formatBytes(sharedNode ? (sharedNode._totalSize || 0) : 0) }
        ];
        dlgProperties('分享的文件', VSC_ICON_CDN + 'folder_type_shared.svg', rows);
    }
}

function showPropertiesForFavorite(favEl) {
    const favType = favEl.dataset.favType;
    const favPath = favEl.dataset.favPath;
    const favName = favEl.dataset.favName;
    const storagePath = favEl.dataset.storagePath;
    const parent = favPath.includes('/')
        ? favPath.slice(0, favPath.lastIndexOf('/'))
        : '';

    if (favType === 'file') {
        const f = storagePath ? findFileByStoragePath(storagePath) : null;
        const rows = [
            { label: '类型', value: getFileTypeLabel(favName) },
            { label: '大小', value: f ? formatBytes(f._size || 0) : '—' },
            { label: '修改日期', value: f ? (formatTime(f._mtime) || '—') : '—' },
            { label: '位置', value: parent ? '/' + parent : '根目录' },
            { label: '完整路径', value: '/' + favPath }
        ];
        dlgProperties(favName, getFileIconUrl(favName), rows);
    } else {
        const node = getNodeByPath(favPath.split('/').filter(Boolean));
        const stats = node ? countTree(node) : { files: 0, folders: 0 };
        const rows = [
            { label: '类型', value: '文件夹' },
            { label: '内含文件数', value: String(stats.files) },
            { label: '内含文件夹数', value: String(stats.folders) },
            { label: '总大小', value: node ? formatBytes(node._totalSize || 0) : '—' },
            { label: '修改日期', value: node ? (formatTime(node._latestMtime) || '—') : '—' },
            { label: '位置', value: parent ? '/' + parent : '根目录' },
            { label: '完整路径', value: '/' + favPath }
        ];
        dlgProperties(favName, DEFAULT_FOLDER_ICON, rows);
    }
}

/* ---------- 属性对话框 ---------- */

function dlgProperties(title, iconUrl, rows) {
    return new Promise(resolve => {
        const overlay = document.getElementById('propertiesDialog');
        const iconEl = document.getElementById('propIcon');
        const titleEl = document.getElementById('propTitle');
        const tableEl = document.getElementById('propTable');
        const okBtn = document.getElementById('propOk');
        if (!overlay) { dlgAlert('属性', rows.map(r => `${r.label}: ${r.value}`).join('\n')); resolve(); return; }

        iconEl.innerHTML = iconUrl
            ? `<img src="${iconUrl}" alt="" onerror="this.onerror=null;this.src='${DEFAULT_FILE_ICON}'">`
            : '';
        titleEl.textContent = title || '属性';

        tableEl.innerHTML = rows.map(r => `
            <div class="prop-row">
                <div class="prop-label">${escapeHtml(r.label)}</div>
                <div class="prop-value" title="${escapeHtml(r.value)}">${escapeHtml(r.value)}</div>
            </div>`).join('');

        const cleanup = () => {
            overlay.classList.remove('show');
            okBtn.removeEventListener('click', onOk);
            overlay.removeEventListener('click', onOverlay);
            document.removeEventListener('keydown', onKey);
        };
        const finish = () => { cleanup(); resolve(); };
        const onOk = () => finish();
        const onOverlay = (e) => { if (e.target === overlay) finish(); };
        const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter') finish(); };

        okBtn.addEventListener('click', onOk);
        overlay.addEventListener('click', onOverlay);
        document.addEventListener('keydown', onKey);

        overlay.classList.add('show');
        setTimeout(() => okBtn.focus(), 50);
    });
}

/* ---------- 初始化 ---------- */

function initContextMenu() {
    ensureContextMenu();

    const list = document.getElementById('fileList');
    if (!list) return;

    /**
     * 判断右键是否"落在内容上"：
     * - 该项已选中 → 算内容
     * - 点在图标/文字 → 算内容
     * - 否则 → 空白（清空选择，走空白菜单）
     */
    function isContextOnItem(e, itemEl) {
    if (!itemEl) return false;
    if (itemEl.classList.contains('selected')) return true;

    // 图标区域（含 padding）
    if (e.target.closest('.fe-icon')) return true;
    // 操作按钮
    if (e.target.closest('.fe-btn')) return true;
    // 文字区域：精确判断点是否真落在字符上
    const textEl = e.target.closest('.fe-name, .fe-meta, .fav-path');
    if (textEl && isPointOnText(textEl, e.clientX, e.clientY)) return true;

    return false;
}

    list.addEventListener('contextmenu', e => {
        e.preventDefault();

        const quick   = e.target.closest('.quick-item');
        const favItem = e.target.closest('.fav-item');
        const item    = e.target.closest('.fe-item');

        // ---------- 快速访问项 ----------
        if (quick) {
            if (isContextOnItem(e, quick)) {
                if (!quick.classList.contains('selected')) {
                    list.querySelectorAll('.fe-item.selected').forEach(el => el.classList.remove('selected'));
                    quick.classList.add('selected');
                }
            } else {
                list.querySelectorAll('.fe-item.selected').forEach(el => el.classList.remove('selected'));
            }
            showContextMenu(e.clientX, e.clientY);
            return;
        }

        // ---------- 收藏夹项 ----------
        if (favItem) {
            if (isContextOnItem(e, favItem)) {
                if (!favItem.classList.contains('selected')) {
                    list.querySelectorAll('.fe-item.selected').forEach(el => el.classList.remove('selected'));
                    favItem.classList.add('selected');
                }
            } else {
                list.querySelectorAll('.fe-item.selected').forEach(el => el.classList.remove('selected'));
            }
            showContextMenu(e.clientX, e.clientY);
            return;
        }

        // ---------- 普通文件/文件夹 ----------
        let onContent = false;
        if (item) {
            if (item.classList.contains('selected')) {
                onContent = true;
            } else if (e.target.closest('.fe-icon, .fe-btn')) {
                onContent = true;
            } else {
                const textEl = e.target.closest('.fe-name, .fe-meta');
                if (textEl && isPointOnText(textEl, e.clientX, e.clientY)) {
                    onContent = true;
                }
            }
        }

        if (item && onContent) {
            if (!item.classList.contains('selected')) {
                list.querySelectorAll('.fe-item.selected').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
            }
        } else {
            list.querySelectorAll('.fe-item.selected').forEach(el => el.classList.remove('selected'));
        }

        showContextMenu(e.clientX, e.clientY);
    });

    document.addEventListener('click', e => {
        if (!e.target.closest('#contextMenu')) hideContextMenu();
    });
    document.addEventListener('scroll', hideContextMenu, true);
    window.addEventListener('resize', hideContextMenu);
}
