/* ============================================================
 * 标签页状态（数据层，UI 在 tabs.js）
 * ============================================================ */

/** 所有标签页 @type {Array<{id:string, currentPath:string[], sortKey:string, sortAsc:boolean, searchQuery:string}>} */
let tabs = [];

/** 当前激活标签的 id */
let activeTabId = null;

function getCurrentTab() {
    return tabs.find(t => t.id === activeTabId) || null;
}

function getCurrentPath() {
    const t = getCurrentTab();
    return t ? t.currentPath : [];
}

function setCurrentPath(path) {
    const t = getCurrentTab();
    if (t) t.currentPath = path;
}

function getSort() {
    const t = getCurrentTab();
    return t ? { key: t.sortKey, asc: t.sortAsc } : { key: 'name', asc: true };
}

function setSort(key, asc) {
    const t = getCurrentTab();
    if (t) { t.sortKey = key; t.sortAsc = asc; }
}

function getSearchQuery() {
    const t = getCurrentTab();
    return t ? t.searchQuery : '';
}

function setSearchQuery(q) {
    const t = getCurrentTab();
    if (t) t.searchQuery = q;
}

/* ============================================================
 * 文件树 / Storage 元数据（全局共享，所有标签页同一份数据）
 * ============================================================ */

/** storage_path → { size, updatedAt } */
let storageMeta = {};

/** 文件树根节点 */
let fileTree = { _files: {}, _children: {} };

/**
 * 拉取 storage 里所有对象元数据（分页）
 */
async function fetchStorageMeta() {
    const bucket = 'public_netdisk';
    const pageSize = 100;
    const maxPages = 10;
    const map = {};

    for (let page = 0; page < maxPages; page++) {
        const { data, error } = await sb.storage.from(bucket).list('', {
            limit: pageSize,
            offset: page * pageSize,
            sortBy: { column: 'name', order: 'asc' }
        });
        if (error) {
            console.warn('storage.list 失败，跳过大小/时间显示', error.message);
            break;
        }
        if (!data || data.length === 0) break;

        for (const obj of data) {
            const meta = obj.metadata || {};
            map[obj.name] = {
                size: meta.size ?? meta.contentLength ?? 0,
                updatedAt: obj.updated_at || obj.created_at || null
            };
        }
        if (data.length < pageSize) break;
    }
    return map;
}

/**
 * 按路径段数组获取树节点
 */
function getNodeByPath(path) {
    let node = fileTree;
    for (const p of path) {
        if (!node._children[p]) return null;
        node = node._children[p];
    }
    return node;
}

/**
 * 递归计算文件夹汇总大小 / 最新修改时间
 */
function computeFolderStats(node) {
    let totalSize = 0;
    let latestTime = null;

    for (const childName of Object.keys(node._children)) {
        const child = node._children[childName];
        computeFolderStats(child);
        totalSize += child._totalSize || 0;
        const t = child._latestMtime;
        if (t && (!latestTime || t > latestTime)) latestTime = t;
    }

    for (const f of Object.values(node._files)) {
        totalSize += f._size || 0;
        const t = f._mtime;
        if (t && (!latestTime || t > latestTime)) latestTime = t;
    }

    node._totalSize = totalSize;
    node._latestMtime = latestTime;
}

/**
 * 构建文件树
 */
function buildTree(data) {
    const tree = { _files: {}, _children: {} };
    for (const item of data) {
        const parts = String(item.file_name || '').split('/').filter(Boolean);
        const filename = parts.pop();
        if (!filename) continue;

        let node = tree;
        for (const p of parts) {
            if (!node._children[p]) node._children[p] = { _files: {}, _children: {} };
            node = node._children[p];
        }

        if (filename === FOLDER_PLACEHOLDER) continue;

        const meta = storageMeta[item.storage_path] || {};
        node._files[filename] = {
            ...item,
            displayName: filename,
            _size: meta.size ?? 0,
            _mtime: meta.updatedAt || item.created_at || null
        };
    }
    computeFolderStats(tree);
    return tree;
}

/** 用于丢弃过期的加载结果 */
let loadFilesToken = 0;

/**
 * 加载文件列表并重建树；成功后重绘所有标签页
 */
async function loadFiles() {
    const token = ++loadFilesToken;
    const wrap = document.getElementById("fileList");
    showLoading(wrap, '正在加载文件列表…');

    let listRes, metaMap;
    try {
        [listRes, metaMap] = await withTimeout(
            Promise.all([
                sb.from("file_list").select("*").order("created_at", { desc: true }),
                fetchStorageMeta()
            ]),
            15000,
            '加载文件列表'
        );
        if (token !== loadFilesToken) return;
    } catch (e) {
        if (token !== loadFilesToken) return;
        showLoadError(wrap, e.message);
        return;
    }

    if (listRes.error) {
        if (token !== loadFilesToken) return;
        console.error("文件列表加载失败", listRes.error);
        showLoadError(wrap, '文件列表加载失败：' + listRes.error.message);
        return;
    }

    storageMeta = metaMap;
    fileTree = buildTree(listRes.data || []);

    // 所有标签页：路径失效的回到根目录
    for (const t of tabs) {
        if (!getNodeByPath(t.currentPath)) t.currentPath = [];
    }

    // 更新容量显示
    updateStorageInfo();

    // 只渲染当前激活的标签
    renderExplorer();
}

/* ============================================================
 * 路径与查找工具
 * ============================================================ */

function buildFullPath(base, name) {
    return [...base, name].filter(Boolean).join('/');
}

/**
 * 按 storage_path 从文件树查找文件
 */
function findFileByStoragePath(storagePath) {
    if (!storagePath) return null;
    const all = [];
    collectAllFiles(fileTree, '', all);
    return all.find(f => f.storage_path === storagePath) || null;
}

/**
 * 递归收集文件树里所有文件（带完整路径）
 */
function collectAllFiles(node, basePath, out) {
    for (const name of Object.keys(node._children)) {
        collectAllFiles(node._children[name], basePath ? basePath + '/' + name : name, out);
    }
    for (const f of Object.values(node._files)) {
        out.push({
            ...f,
            fullPath: basePath ? basePath + '/' + f.displayName : f.displayName
        });
    }
}

/* ============================================================
 * 资源管理器渲染
 * ============================================================ */

function renderExplorer() {
    renderBreadcrumb();
    renderFileList();
}

function renderBreadcrumb() {
    const bar = document.getElementById("breadcrumb");
    const upBtn = document.getElementById("btnUp");
    if (!bar) return;

    const currentPath = getCurrentPath();
    let html = `<span class="crumb ${currentPath.length === 0 ? 'current' : ''}" data-idx="-1">🏠 全部文件</span>`;
    currentPath.forEach((seg, i) => {
        const isLast = i === currentPath.length - 1;
        html += `<span class="crumb-sep">›</span>`;
        html += `<span class="crumb ${isLast ? 'current' : ''}" data-idx="${i}">${escapeHtml(seg)}</span>`;
    });
    bar.innerHTML = html;

    if (upBtn) upBtn.disabled = currentPath.length === 0;
    bar.scrollLeft = bar.scrollWidth;
}
/**
 * Supabase Storage 免费套餐容量（1 GB）
 */
const STORAGE_QUOTA = 1024 * 1024 * 1024;

/**
 * 更新底部容量显示
 */
function updateStorageInfo() {
    const el = document.getElementById('storageInfo');
    if (!el) return;

    let used = 0;
    for (const meta of Object.values(storageMeta)) {
        used += meta.size || 0;
    }

    const pct = STORAGE_QUOTA > 0
        ? ((used / STORAGE_QUOTA) * 100).toFixed(1)
        : '0';

    el.textContent = `${formatBytes(used)} / ${formatBytes(STORAGE_QUOTA)}`;
    el.title = `已用 ${formatBytes(used)} / 共 ${formatBytes(STORAGE_QUOTA)}（${pct}%）`;
}

/**
 * 递归收集所有目录路径（用于面包屑自动补全）
 */
function collectAllFolderPaths(node, basePath, out) {
    for (const name of Object.keys(node._children)) {
        const path = [...basePath, name];
        out.push(path);
        collectAllFolderPaths(node._children[name], path, out);
    }
}

/**
 * 面包屑编辑状态锁
 */
let breadcrumbEditLock = false;

/**
 * 点击面包屑空白 → 进入路径编辑模式（带自动补全下拉）
 */
function enterBreadcrumbEdit() {
    if (breadcrumbEditLock) return;
    breadcrumbEditLock = true;

    const bar = document.getElementById('breadcrumb');
    if (!bar) { breadcrumbEditLock = false; return; }

    const currentPath = getCurrentPath();
    const fullPath = currentPath.length === 0 ? '' : '/' + currentPath.join('/');

    // 收集所有目录路径
    const allPaths = [];
    collectAllFolderPaths(fileTree, [], allPaths);
    const pathStrings = allPaths.map(p => '/' + p.join('/'));

    // 用 wrap 包住 input 和下拉框，方便定位
    bar.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.style.position = 'relative';
    wrap.style.width = '100%';
    bar.appendChild(wrap);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'breadcrumb-input';
    input.value = fullPath;
    input.placeholder = '/docs/sub';
    wrap.appendChild(input);

    const dropdown = document.createElement('div');
    dropdown.className = 'breadcrumb-dropdown';
    wrap.appendChild(dropdown);

    let items = [];
    let activeIdx = -1;

    const hideDropdown = () => {
        dropdown.classList.remove('show');
        dropdown.innerHTML = '';
        items = [];
        activeIdx = -1;
    };

    const renderDropdown = (matches) => {
        if (matches.length === 0) { hideDropdown(); return; }
        items = matches;
        activeIdx = -1;
        dropdown.innerHTML = matches.map((p, i) =>
            `<div class="breadcrumb-dropdown-item" data-idx="${i}">${escapeHtml(p)}</div>`
        ).join('');
        dropdown.classList.add('show');
    };

    const updateActiveHighlight = () => {
        dropdown.querySelectorAll('.breadcrumb-dropdown-item').forEach((el, i) => {
            el.classList.toggle('active', i === activeIdx);
        });
    };

    const applySelection = (p) => {
        const parts = p.split('/').filter(Boolean);
        setCurrentPath(parts);

        if (getSearchQuery()) {
            setSearchQuery('');
            const searchInput = document.getElementById('searchInput');
            const clearBtn = document.getElementById('searchClear');
            if (searchInput) searchInput.value = '';
            if (clearBtn) clearBtn.classList.remove('show');
        }
        renderExplorer();
        updateActiveTabTitle();
    };

    const updateMatches = () => {
        const val = input.value.trim();
        if (!val || val === '/') {
            renderDropdown(pathStrings.slice(0, 10));
            return;
        }
        const q = val.toLowerCase().replace(/^\//, '');
        const matched = pathStrings.filter(p => {
            const low = p.toLowerCase();
            return low.includes('/' + q) || low.includes(q);
        }).slice(0, 10);
        renderDropdown(matched);
    };

    const finish = (save, pathOverride) => {
        if (!breadcrumbEditLock) return;
        breadcrumbEditLock = false;

        if (save) {
            const val = (pathOverride !== undefined ? pathOverride : input.value).trim();
            applySelection(val);
        } else {
            renderBreadcrumb();
        }
    };

    input.focus();
    input.select();
    updateMatches();

    input.addEventListener('input', updateMatches);
    input.addEventListener('focus', updateMatches);

    dropdown.addEventListener('mousedown', e => {
        e.preventDefault(); // 防止 input 先 blur
        const item = e.target.closest('.breadcrumb-dropdown-item');
        if (!item) return;
        const idx = parseInt(item.dataset.idx, 10);
        const p = items[idx];
        if (!p) return;
        finish(true, p);
    });

    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIdx >= 0 && items[activeIdx]) finish(true, items[activeIdx]);
            else finish(true, input.value);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            finish(false);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (items.length === 0) return;
            activeIdx = (activeIdx + 1) % items.length;
            updateActiveHighlight();
            const el = dropdown.querySelectorAll('.breadcrumb-dropdown-item')[activeIdx];
            if (el) el.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (items.length === 0) return;
            activeIdx = (activeIdx - 1 + items.length) % items.length;
            updateActiveHighlight();
            const el = dropdown.querySelectorAll('.breadcrumb-dropdown-item')[activeIdx];
            if (el) el.scrollIntoView({ block: 'nearest' });
        }
    });

    input.addEventListener('blur', () => {
        setTimeout(() => {
            if (breadcrumbEditLock) finish(false);
        }, 150);
    });
}
function renderFileList() {
    const wrap = document.getElementById("fileList");
    if (!wrap) return;

    const searchQuery = getSearchQuery();
    if (searchQuery) {
        renderSearchResults(wrap, searchQuery);
        wrap.scrollTop = 0;
        return;
    }

    const currentPath = getCurrentPath();
    const node = getNodeByPath(currentPath);
    if (!node) {
        wrap.innerHTML = `<div class="nofile">文件夹不存在</div>`;
        return;
    }

    const { key: sortKey, asc: sortAsc } = getSort();

    const folders = Object.keys(node._children).sort((a, b) => {
        const na = node._children[a];
        const nb = node._children[b];
        let v = 0;
        if (sortKey === 'name' || sortKey === 'type') {
            v = a.localeCompare(b, 'zh');
        } else if (sortKey === 'size') {
            v = (na._totalSize || 0) - (nb._totalSize || 0);
        } else if (sortKey === 'mtime') {
            const ta = na._latestMtime ? new Date(na._latestMtime).getTime() : 0;
            const tb = nb._latestMtime ? new Date(nb._latestMtime).getTime() : 0;
            v = ta - tb;
        }
        return sortAsc ? v : -v;
    });

    const files = Object.values(node._files).sort((a, b) => {
        let v = 0;
        if (sortKey === 'name') {
            v = a.displayName.localeCompare(b.displayName, 'zh');
        } else if (sortKey === 'size') {
            v = (a._size || 0) - (b._size || 0);
        } else if (sortKey === 'type') {
            const ea = getExt(a.displayName);
            const eb = getExt(b.displayName);
            v = ea.localeCompare(eb, 'zh') || a.displayName.localeCompare(b.displayName, 'zh');
        } else if (sortKey === 'mtime') {
            const ta = a._mtime ? new Date(a._mtime).getTime() : 0;
            const tb = b._mtime ? new Date(b._mtime).getTime() : 0;
            v = ta - tb;
        }
        return sortAsc ? v : -v;
    });

    if (folders.length === 0 && files.length === 0) {
        wrap.innerHTML = `<div class="nofile">此文件夹为空</div>`;
        return;
    }

    let html = "";

    for (const name of folders) {
        const folderNode = node._children[name];
        const sizeText = formatBytes(folderNode._totalSize || 0);
        const mtimeText = formatTime(folderNode._latestMtime);
        html += `
        <div class="fe-item fe-folder" data-type="folder" data-name="${escapeHtml(name)}">
            <span class="fe-icon"><img src="${DEFAULT_FOLDER_ICON}" alt=""></span>
            <span class="fe-name">${escapeHtml(name)}</span>
            <span class="fe-meta fe-size">${sizeText}</span>
            <span class="fe-meta fe-mtime">${mtimeText}</span>
            <span class="fe-actions">
                <button class="fe-btn" data-action="zip" type="button">打包</button>
                <button class="fe-btn del" data-action="del-folder" type="button">删除</button>
            </span>
        </div>`;
    }

    for (const file of files) {
        const openBtn = `<button class="fe-btn" data-action="open" type="button">打开</button>`;
        const sizeText = formatBytes(file._size || 0);
        const mtimeText = formatTime(file._mtime);
        html += `
    <div class="fe-item fe-file"
         data-type="file"
         data-name="${escapeHtml(file.displayName)}"
         data-id="${escapeHtml(file.id)}"
         data-path="${escapeHtml(file.storage_path)}">
        <span class="fe-icon"><img src="${getFileIconUrl(file.displayName)}" alt=""
        onerror="this.onerror=null;this.src='${DEFAULT_FILE_ICON}'"></span>
        <span class="fe-name">${escapeHtml(file.displayName)}</span>
        <span class="fe-meta fe-size">${sizeText}</span>
        <span class="fe-meta fe-mtime">${mtimeText}</span>
        <span class="fe-actions">
            ${openBtn}
            <button class="fe-btn" data-action="download" type="button">下载</button>
            <button class="fe-btn del" data-action="del-file" type="button">删除</button>
        </span>
    </div>`;
    }

    wrap.innerHTML = html;
    wrap.scrollTop = 0;
}

function renderSearchResults(wrap, query) {
    const all = [];
    collectAllFiles(fileTree, '', all);

    const q = query.toLowerCase();
    const matched = all.filter(f =>
        f.displayName.toLowerCase().includes(q) ||
        f.fullPath.toLowerCase().includes(q)
    );

    if (matched.length === 0) {
        wrap.innerHTML = `<div class="nofile">没有匹配的文件</div>`;
        return;
    }

    const { key: sortKey, asc: sortAsc } = getSort();

    matched.sort((a, b) => {
        let v = 0;
        if (sortKey === 'name') {
            v = a.fullPath.localeCompare(b.fullPath, 'zh');
        } else if (sortKey === 'size') {
            v = (a._size || 0) - (b._size || 0);
        } else if (sortKey === 'type') {
            const ea = getExt(a.displayName);
            const eb = getExt(b.displayName);
            v = ea.localeCompare(eb, 'zh') || a.fullPath.localeCompare(b.fullPath, 'zh');
        } else if (sortKey === 'mtime') {
            const ta = a._mtime ? new Date(a._mtime).getTime() : 0;
            const tb = b._mtime ? new Date(b._mtime).getTime() : 0;
            v = ta - tb;
        }
        return sortAsc ? v : -v;
    });

    let html = `<div class="search-hint">找到 ${matched.length} 个文件</div>`;
    for (const f of matched) {
        const sizeText = formatBytes(f._size || 0);
        const mtimeText = formatTime(f._mtime);
        html += `
    <div class="fe-item fe-file"
         data-type="file"
         data-name="${escapeHtml(f.displayName)}"
         data-id="${escapeHtml(f.id)}"
         data-path="${escapeHtml(f.storage_path)}">
        <span class="fe-icon"><img src="${getFileIconUrl(f.displayName)}" alt=""
            onerror="this.onerror=null;this.src='${DEFAULT_FILE_ICON}'"></span>
        <span class="fe-name">${escapeHtml(f.displayName)}</span>
        <span class="search-path">${escapeHtml(f.fullPath)}</span>
        <span class="fe-meta fe-size">${sizeText}</span>
        <span class="fe-meta fe-mtime">${mtimeText}</span>
        <span class="fe-actions">
            <button class="fe-btn" data-action="open" type="button">打开</button>
            <button class="fe-btn" data-action="download" type="button">下载</button>
            <button class="fe-btn del" data-action="del-file" type="button">删除</button>
        </span>
    </div>`;
    }
    wrap.innerHTML = html;
}

/* ============================================================
 * 事件绑定
 * ============================================================ */

function initExplorerEvents() {
    const list = document.getElementById("fileList");
    const bar = document.getElementById("breadcrumb");
    const upBtn = document.getElementById("btnUp");
    const refreshBtn = document.getElementById("btnRefresh");

    // 单击：触发操作按钮
    list.addEventListener("click", e => {
        if (suppressNextClick) return;

        const btn = e.target.closest("button[data-action]");
        const item = e.target.closest(".fe-item");
        if (!item) return;

        if (btn) {
            e.stopPropagation();
            const action = btn.dataset.action;
            const name = item.dataset.name;
            const currentPath = getCurrentPath();

            if (action === "zip") {
                downloadFolderZip(buildFullPath(currentPath, name));
            } else if (action === "del-folder") {
                delFolder(buildFullPath(currentPath, name));
            } else if (action === "download") {
                const file = findFileByStoragePath(item.dataset.path);
                if (file) downloadFile(file.displayName, file.file_url);
            } else if (action === "open") {
                const file = findFileByStoragePath(item.dataset.path);
                if (file) openPreview(file);
            } else if (action === "del-file") {
                delFile(item.dataset.id, item.dataset.path);
            }
            return;
        }
    });

    // 双击：进入文件夹 / 打开文件
    list.addEventListener("dblclick", e => {
        if (suppressNextClick) return;
        const item = e.target.closest(".fe-item");
        if (!item) return;
        if (item.dataset.type === "folder") {
            const currentPath = getCurrentPath();
            currentPath.push(item.dataset.name);
            setCurrentPath(currentPath);
            renderExplorer();
            updateActiveTabTitle();
            return;
        }
        const file = findFileByStoragePath(item.dataset.path);
        if (!file) return;
        openPreview(file);
    });

    // 面包屑点击
    bar.addEventListener("click", e => {
        const crumb = e.target.closest(".crumb");

        // 点空白 → 进入编辑
        if (!crumb) {
            setTimeout(() => enterBreadcrumbEdit(), 0);
            return;
        }

        // 点路径段 → 跳转
        const idx = parseInt(crumb.dataset.idx, 10);
        const currentPath = getCurrentPath();
        setCurrentPath(currentPath.slice(0, idx + 1));

        // 清空搜索
        if (getSearchQuery()) {
            setSearchQuery('');
            const input = document.getElementById('searchInput');
            if (input) input.value = '';
        }
        renderExplorer();
        updateActiveTabTitle();
    });

    // 上一级
    upBtn.addEventListener("click", () => {
        const currentPath = getCurrentPath();
        if (currentPath.length === 0) return;
        currentPath.pop();
        setCurrentPath(currentPath);

        if (getSearchQuery()) {
            setSearchQuery('');
            const input = document.getElementById('searchInput');
            if (input) input.value = '';
        }
        renderExplorer();
        updateActiveTabTitle();
    });

    // 刷新
    refreshBtn.addEventListener("click", () => loadFiles());
}

/* ============================================================
 * 搜索
 * ============================================================ */

function initSearch() {
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClear');
    if (!input) return;

    const updateClearBtn = () => {
        if (!clearBtn) return;
        clearBtn.classList.toggle('show', input.value.length > 0);
    };

    input.addEventListener('input', () => {
        setSearchQuery(input.value.trim());
        updateClearBtn();
        renderFileList();
    });

    input.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            input.value = '';
            setSearchQuery('');
            updateClearBtn();
            renderFileList();
            input.blur();
        }
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            input.value = '';
            setSearchQuery('');
            updateClearBtn();
            renderFileList();
            input.focus();
        });
    }

    updateClearBtn();
}

/* ============================================================
 * 多选 / 框选 / 拖拽移动
 * ============================================================ */

let dragState = null;
let dragMoveState = null;
let suppressNextClick = false;

/**
 * 取当前所有选中的项
 */
function getSelectedItems() {
    const els = document.querySelectorAll('#fileList .fe-item.selected');
    return Array.from(els).map(el => ({
        type: el.dataset.type,
        name: el.dataset.name,
        id: el.dataset.id,
        path: el.dataset.path,
        el
    }));
}

function getSelectedItem() {
    const items = getSelectedItems();
    return items.length > 0 ? items[0] : null;
}

function initRubberBand() {
    const list = document.getElementById('fileList');
    if (!list) return;

    list.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        if (e.target.closest('button')) return;
        if (e.target.closest('#contextMenu')) return;
        if (e.target.closest('.context-submenu')) return;

        const item = e.target.closest('.fe-item');

        // 起点在已选中的条目上 → 拖拽移动
        if (item && item.classList.contains('selected')) {
            dragMoveState = {
                startX: e.clientX,
                startY: e.clientY,
                activated: false,
                ghostEl: null,
                hoverFolder: null,
                hoverTab: null,
                items: getSelectedItems()
            };
            return;
        }

        // 其他情况 → 框选
        dragState = {
            startX: e.clientX,
            startY: e.clientY,
            activated: false,
            bandEl: null,
            additive: e.ctrlKey || e.metaKey || e.shiftKey,
            startItem: item
        };
    });

    document.addEventListener('mousemove', e => {
        /* ---------- 拖拽移动 ---------- */
        if (dragMoveState) {
            const state = dragMoveState;
            const dx = e.clientX - state.startX;
            const dy = e.clientY - state.startY;
            if (!state.activated && Math.hypot(dx, dy) < 5) return;

            if (!state.activated) {
                state.activated = true;
                const ghost = document.createElement('div');
                ghost.className = 'drag-ghost';
                ghost.textContent = `移动 ${state.items.length} 项`;
                document.body.appendChild(ghost);
                state.ghostEl = ghost;
                document.body.style.cursor = 'grabbing';
            }

            state.ghostEl.style.left = (e.clientX + 12) + 'px';
            state.ghostEl.style.top = (e.clientY + 12) + 'px';

            // 检测下方：文件夹 或 其他标签页
            const under = document.elementFromPoint(e.clientX, e.clientY);

            // 优先判断标签页
            const tabEl = under && under.closest('.tab-page[data-tab-id]');
            let newTab = null;
            if (tabEl && tabEl.dataset.tabId !== activeTabId) {
                newTab = tabEl;
            }

            // 文件夹
            const folderEl = under && under.closest('.fe-item.fe-folder');
            let newHover = null;
            if (!newTab && folderEl) {
                const folderName = folderEl.dataset.name;
                const hasSelf = state.items.some(it => it.type === 'folder' && it.name === folderName);
                if (!hasSelf) newHover = folderEl;
            }

            // 清理旧高亮
            if (state.hoverFolder && state.hoverFolder !== newHover) {
                state.hoverFolder.classList.remove('drop-target');
            }
            if (state.hoverTab && state.hoverTab !== newTab) {
                state.hoverTab.classList.remove('tab-drop-target');
            }

            // 新高亮
            if (newHover && state.hoverFolder !== newHover) {
                newHover.classList.add('drop-target');
            }
            if (newTab && state.hoverTab !== newTab) {
                newTab.classList.add('tab-drop-target');
            }

            state.hoverFolder = newHover;
            state.hoverTab = newTab;
            return;
        }

        /* ---------- 框选 ---------- */
        if (!dragState) return;

        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;
        if (!dragState.activated && Math.hypot(dx, dy) < 5) return;

        if (!dragState.activated) {
            dragState.activated = true;
            const band = document.createElement('div');
            band.className = 'rubber-band';
            document.body.appendChild(band);
            dragState.bandEl = band;

            if (!dragState.additive) {
                list.querySelectorAll('.fe-item.selected').forEach(el => el.classList.remove('selected'));
            }
        }

        const x = Math.min(dragState.startX, e.clientX);
        const y = Math.min(dragState.startY, e.clientY);
        const w = Math.abs(dx);
        const h = Math.abs(dy);

        const band = dragState.bandEl;
        band.style.left = x + 'px';
        band.style.top = y + 'px';
        band.style.width = w + 'px';
        band.style.height = h + 'px';

        const bandRect = { left: x, top: y, right: x + w, bottom: y + h };
        list.querySelectorAll('.fe-item').forEach(el => {
            const r = el.getBoundingClientRect();
            const hit = !(r.right < bandRect.left || r.left > bandRect.right ||
                r.bottom < bandRect.top || r.top > bandRect.bottom);
            if (hit) el.classList.add('selected');
            else if (!dragState.additive) el.classList.remove('selected');
        });
    });

    document.addEventListener('mouseup', e => {
        /* ---------- 拖拽移动收尾 ---------- */
        if (dragMoveState) {
            const state = dragMoveState;
            dragMoveState = null;

            if (state.ghostEl) state.ghostEl.remove();
            if (state.hoverFolder) state.hoverFolder.classList.remove('drop-target');
            if (state.hoverTab) state.hoverTab.classList.remove('tab-drop-target');
            document.body.style.cursor = '';

            if (state.activated) {
                suppressNextClick = true;
                setTimeout(() => { suppressNextClick = false; }, 0);

                if (state.hoverTab) {
                    // 拖到其他标签页 → 切换过去 + 移动
                    const targetTabId = state.hoverTab.dataset.tabId;
                    switchTab(targetTabId);
                    moveItemsTo(state.items, null, targetTabId);
                } else if (state.hoverFolder) {
                    const targetFolder = state.hoverFolder.dataset.name;
                    moveItemsTo(state.items, targetFolder);
                }
            }
            return;
        }

        /* ---------- 框选收尾 ---------- */
        if (!dragState) return;

        if (dragState.activated) {
            if (dragState.bandEl) dragState.bandEl.remove();
            suppressNextClick = true;
            setTimeout(() => { suppressNextClick = false; }, 0);
        } else if (dragState.startItem) {
            const item = dragState.startItem;
            if (e.ctrlKey || e.metaKey) {
                item.classList.toggle('selected');
            } else {
                const wasSelected = item.classList.contains('selected');
                const selectedCount = list.querySelectorAll('.fe-item.selected').length;
                if (!wasSelected || selectedCount > 1) {
                    list.querySelectorAll('.fe-item.selected').forEach(el => el.classList.remove('selected'));
                    item.classList.add('selected');
                }
            }
        } else {
            if (!e.ctrlKey && !e.metaKey) {
                list.querySelectorAll('.fe-item.selected').forEach(el => el.classList.remove('selected'));
            }
        }

        dragState = null;
    });
}

/* ============================================================
 * 拖拽移动：目标文件夹或目标标签页
 * ============================================================ */

/**
 * 在目标目录里找一个不冲突的名字
 */
function resolveTargetConflict(allFiles, targetPrefix, name) {
    const prefix = targetPrefix + '/';
    const existing = new Set();
    for (const row of allFiles) {
        if (!row.file_name || !row.file_name.startsWith(prefix)) continue;
        const rest = row.file_name.slice(prefix.length);
        const nextSlash = rest.indexOf('/');
        if (nextSlash === -1) existing.add(rest);
        else existing.add(rest.slice(0, nextSlash));
    }
    if (!existing.has(name)) return name;

    const dotIdx = name.lastIndexOf('.');
    const base = dotIdx > 0 ? name.slice(0, dotIdx) : name;
    const ext = dotIdx > 0 ? name.slice(dotIdx) : '';
    let i = 1;
    while (existing.has(`${base} (${i})${ext}`)) i++;
    return `${base} (${i})${ext}`;
}

/**
 * 把选中的项移动到目标位置
 * @param {Array} items
 * @param {string|null} targetFolder  同一标签页内的文件夹名
 * @param {string|null} targetTabId   目标标签页 id（跨标签页移动）
 */
async function moveItemsTo(items, targetFolder, targetTabId) {
    if (!items || items.length === 0) return;

    const sourcePath = getCurrentPath();

    // 确定目标路径
    let targetPath;
    if (targetTabId) {
        const targetTab = tabs.find(t => t.id === targetTabId);
        targetPath = targetTab ? targetTab.currentPath : [];
    } else {
        targetPath = [...sourcePath, targetFolder];
    }

    const targetPrefix = targetPath.join('/');

    const { data: allFiles, error } = await sb.from('file_list').select('*');
    if (error) { await dlgAlert('移动失败', error.message); return; }

    const plans = [];

    for (const item of items) {
        if (item.type === 'file') {
            const file = findFileByStoragePath(item.path);
            if (!file) continue;
            const safeName = resolveTargetConflict(allFiles, targetPrefix, item.name);
            const newName = buildFullPath(targetPath, safeName);
            if (newName === file.file_name) continue;
            plans.push({ id: file.id, newName });
        } else {
            const oldFolderPath = buildFullPath(sourcePath, item.name);
            const prefix = oldFolderPath + '/';
            const rows = allFiles.filter(r => r.file_name && r.file_name.startsWith(prefix));
            if (rows.length === 0) continue;

            const safeFolder = resolveTargetConflict(allFiles, targetPrefix, item.name);
            const newFolderPath = buildFullPath(targetPath, safeFolder);

            for (const row of rows) {
                plans.push({
                    id: row.id,
                    newName: newFolderPath + row.file_name.slice(oldFolderPath.length)
                });
            }
        }
    }

    if (plans.length === 0) return;

    const ids = plans.map(p => p.id);
    const rows = allFiles.filter(r => ids.includes(r.id));
    const { error: delErr } = await sb.from('file_list').delete().in('id', ids);
    if (delErr) { await dlgAlert('移动失败', delErr.message); return; }

    const newRows = rows.map(r => {
        const plan = plans.find(p => p.id === r.id);
        return {
            file_name: plan.newName,
            file_url: r.file_url,
            storage_path: r.storage_path
        };
    });
    const { error: insErr } = await sb.from('file_list').insert(newRows);
    if (insErr) {
        await dlgAlert('移动失败', insErr.message);
        loadFiles();
        return;
    }

    loadFiles();
}