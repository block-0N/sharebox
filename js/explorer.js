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

function getView() {
    const t = getCurrentTab();
    return t ? (t.view || 'quick') : 'quick';
}

function setView(v) {
    const t = getCurrentTab();
    if (t) t.view = v;
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
    const SAFETY_LIMIT = 100000;   // 安全上限，防止死循环
    const map = {};
    let offset = 0;

    while (offset < SAFETY_LIMIT) {
        const { data, error } = await sb.storage.from(bucket).list('', {
            limit: pageSize,
            offset,
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
        offset += pageSize;
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
async function loadFiles(preserveScroll = false) {
    const token = ++loadFilesToken;
    const wrap = document.getElementById("fileList");
    pendingScrollTop = (preserveScroll && wrap) ? wrap.scrollTop : null;
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

    // 加载收藏
    await loadFavorites();

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
let pendingScrollTop = null;    // null 表示渲染后回顶部

function renderExplorer() {
    renderBreadcrumb();
    renderFileList();
}

function renderBreadcrumb() {
    const bar = document.getElementById("breadcrumb");
    const upBtn = document.getElementById("btnUp");
    if (!bar) return;

    const view = getView();
    const currentPath = getCurrentPath();

    let html = '';
    html += `<span class="crumb ${view === 'quick' ? 'current' : ''}" data-crumb="home">🏠 快速访问</span>`;

    if (view === 'favorites') {
        html += `<span class="crumb-sep">|</span>`;
        html += `<span class="crumb current">⭐收藏夹</span>`;
    } else if (view === 'path') {
        html += `<span class="crumb-sep">|</span>`;
        const isRoot = currentPath.length === 0;
        html += `<span class="crumb ${isRoot ? 'current' : ''}" data-crumb="root">📁 全部文件</span>`;
        currentPath.forEach((seg, i) => {
            const isLast = i === currentPath.length - 1;
            html += `<span class="crumb-sep">›</span>`;
            html += `<span class="crumb ${isLast ? 'current' : ''}" data-idx="${i}">${escapeHtml(seg)}</span>`;
        });
    }
    bar.innerHTML = html;

    if (upBtn) upBtn.disabled = (view === 'quick');
    bar.scrollLeft = bar.scrollWidth;
}

/**
 * Supabase Storage 免费套餐容量（1 GB）
 */
const STORAGE_QUOTA = 1024 * 1024 * 1024;

function updateStorageInfo() {
    const el = document.getElementById('storageInfo');
    if (!el) return;

    const fill = document.getElementById('storageBarFill');
    const text = document.getElementById('storageText');

    let used = 0;
    for (const meta of Object.values(storageMeta)) {
        used += meta.size || 0;
    }

    const pct = STORAGE_QUOTA > 0 ? (used / STORAGE_QUOTA) * 100 : 0;
    const pctText = pct.toFixed(1);

    if (text) text.textContent = `${formatBytes(used)} / ${formatBytes(STORAGE_QUOTA)}`;

    if (fill) {
        fill.style.width = Math.min(pct, 100).toFixed(2) + '%';
        fill.classList.toggle('warn', pct >= 75 && pct < 90);
        fill.classList.toggle('danger', pct >= 90);
    }

    el.title = `已用 ${formatBytes(used)} / 共 ${formatBytes(STORAGE_QUOTA)}（${pctText}%）`;
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
    bar.classList.add('editing');   // ← 解除 overflow 裁剪
    const wrap = document.createElement('div');
    wrap.className = 'breadcrumb-edit-wrap';
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
        bar.classList.remove('editing');   // ← 恢复

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

    const view = getView();
    if (view === 'quick') { renderQuickAccess(wrap); return; }
    if (view === 'favorites') { renderFavorites(wrap); return; }

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
            <span class="fe-meta fe-type">文件夹</span>
            <span class="fe-meta fe-size">${sizeText}</span>
            <span class="fe-meta fe-mtime">${mtimeText}</span>
            <span class="fe-actions">
                <button class="fe-btn" data-action="open-folder" type="button">打开</button>
                <button class="fe-btn" data-action="zip" type="button">打包</button>
                <button class="fe-btn del" data-action="del-folder" type="button">删除</button>
            </span>
        </div>`;
    }

    for (const file of files) {
        const openBtn = `<button class="fe-btn" data-action="open" type="button">打开</button>`;
        const sizeText = formatBytes(file._size || 0);
        const mtimeText = formatTime(file._mtime);
        const typeText = getFileTypeLabel(file.displayName);
        html += `
    <div class="fe-item fe-file"
         data-type="file"
         data-name="${escapeHtml(file.displayName)}"
         data-id="${escapeHtml(file.id)}"
         data-path="${escapeHtml(file.storage_path)}">
        <span class="fe-icon"><img src="${getFileIconUrl(file.displayName)}" alt=""
        onerror="this.onerror=null;this.src='${DEFAULT_FILE_ICON}'"></span>
        <span class="fe-name">${escapeHtml(file.displayName)}</span>
        <span class="fe-meta fe-type">${escapeHtml(typeText)}</span>
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
    if (pendingScrollTop !== null) {
        wrap.scrollTop = pendingScrollTop;
        pendingScrollTop = null;
    } else {
        wrap.scrollTop = 0;
    }
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

    list.addEventListener("click", e => {
        if (isClickSuppressed()) return;

        const btn = e.target.closest("button[data-action]");
        if (btn) {
            e.stopPropagation();
            const item = e.target.closest(".fe-item");
            if (!item) return;
            const action = btn.dataset.action;
            const name = item.dataset.name;
            const currentPath = getCurrentPath();

            if (action === "open-folder") {
                const cp = getCurrentPath();
                cp.push(name);
                setCurrentPath(cp);
                renderExplorer();
                updateActiveTabTitle();
            } else if (action === "zip") {
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

        const quick = e.target.closest('[data-quick]');
        if (quick) {
            if (!quick.classList.contains('selected')) {
                list.querySelectorAll('.fe-item.selected').forEach(el => el.classList.remove('selected'));
                quick.classList.add('selected');
            }
            return;
        }

        const favItem = e.target.closest('.fav-item');
        if (favItem) {
            if (!favItem.classList.contains('selected')) {
                list.querySelectorAll('.fe-item.selected').forEach(el => el.classList.remove('selected'));
                favItem.classList.add('selected');
            }
            return;
        }

        const item = e.target.closest('.fe-item');
        if (!item) return;

        const nameEl = e.target.closest('.fe-name');
        if (nameEl && !inlineRenameActive) {
            const sels = getSelectedItems();
            if (lastMousedownSoleSelected &&
                lastMousedownItemEl === item &&
                sels.length === 1 &&
                sels[0].el === item) {
                if (inlineRenameTimer) clearTimeout(inlineRenameTimer);
                inlineRenameTimer = setTimeout(() => {
                    inlineRenameTimer = null;
                    startInlineRename(item);
                }, 200);
            }
        }
    });

    list.addEventListener("dblclick", e => {
        if (isClickSuppressed()) return;
        if (inlineRenameTimer) {
            clearTimeout(inlineRenameTimer);
            inlineRenameTimer = null;
        }

        const quick = e.target.closest('[data-quick]');
        if (quick) {
            const type = quick.dataset.quick;
            if (type === 'favorites') setView('favorites');
            else if (type === 'all') { setView('path'); setCurrentPath([]); }
            else if (type === 'shared') { setView('path'); setCurrentPath(['文件']); }

            if (getSearchQuery()) {
                setSearchQuery('');
                const si = document.getElementById('searchInput');
                if (si) si.value = '';
            }
            renderExplorer();
            updateActiveTabTitle();
            return;
        }

        const favItem = e.target.closest('.fav-item');
        if (favItem) {
            openFavoriteItem(favItem);
            return;
        }

        const item = e.target.closest(".fe-item");
        if (!item) return;
        if (item.dataset.type === "folder") {
            const cp = getCurrentPath();
            cp.push(item.dataset.name);
            setCurrentPath(cp);
            renderExplorer();
            updateActiveTabTitle();
            return;
        }
        const file = findFileByStoragePath(item.dataset.path);
        if (!file) return;
        openPreview(file);
    });

    bar.addEventListener("click", e => {
        const crumb = e.target.closest(".crumb");
        const view = getView();

        if (!crumb) {
            if (view === 'path') setTimeout(() => enterBreadcrumbEdit(), 0);
            return;
        }

        if (crumb.classList.contains('current')) return;

        const clearSearch = () => {
            if (getSearchQuery()) {
                setSearchQuery('');
                const input = document.getElementById('searchInput');
                if (input) input.value = '';
                const clearBtn = document.getElementById('searchClear');
                if (clearBtn) clearBtn.classList.remove('show');
            }
        };

        if (crumb.dataset.crumb === 'home') {
            setView('quick');
            clearSearch();
            renderExplorer();
            updateActiveTabTitle();
            return;
        }

        if (crumb.dataset.crumb === 'root') {
            setView('path');
            setCurrentPath([]);
            clearSearch();
            renderExplorer();
            updateActiveTabTitle();
            return;
        }

        const idx = parseInt(crumb.dataset.idx, 10);
        if (isNaN(idx)) return;
        const currentPath = getCurrentPath();
        setCurrentPath(currentPath.slice(0, idx + 1));
        clearSearch();
        renderExplorer();
        updateActiveTabTitle();
    });

    upBtn.addEventListener("click", () => {
        const view = getView();
        if (view === 'quick') return;

        if (view === 'favorites') {
            setView('quick');
            renderExplorer();
            updateActiveTabTitle();
            return;
        }

        const currentPath = getCurrentPath();
        if (currentPath.length === 0) {
            setView('quick');
            renderExplorer();
            updateActiveTabTitle();
            return;
        }
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

    refreshBtn.addEventListener("click", () => loadFiles(true));
}

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

/** 抑制 click/dblclick 到该时刻（performance.now 时间戳） */
let suppressClickUntil = 0;
/** 记录最近一次 mousedown 时目标项是否已选中（用于"单击已选中项进入编辑"） */
let lastMousedownItemEl = null;
let lastMousedownSoleSelected = false;
function suppressClick(ms = 180) {
    suppressClickUntil = performance.now() + ms;
}

function isClickSuppressed() {
    return performance.now() < suppressClickUntil;
}

/**
 * 取当前所有选中的项
 */
function getSelectedItems() {
    const els = document.querySelectorAll('#fileList .fe-item.selected');
    return Array.from(els)
        .filter(el => {
            const t = el.dataset.type;
            return t === 'file' || t === 'folder';
        })
        .map(el => ({
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
        // ★ 快速访问/收藏夹项不参与框选和拖拽
        if (e.target.closest('.quick-item') || e.target.closest('.fav-item')) return;

        const item = e.target.closest('.fe-item');

        // ★ 记录点击前的选中状态（click 时再读，此时 mouseup 已经改过选择）
        lastMousedownItemEl = item;
        lastMousedownSoleSelected = !!(
            item
            && item.classList.contains('selected')
            && list.querySelectorAll('.fe-item.selected').length === 1
        );

        // 起点在已选中的条目上 → 拖拽移动
        if (item && item.classList.contains('selected')) {
            dragMoveState = {
                startX: e.clientX,
                startY: e.clientY,
                activated: false,
                ghostEl: null,
                hoverFolder: null,
                hoverTab: null,
                items: getSelectedItems(),
                startItem: item
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
            dragMoveState = null;

            if (state.ghostEl) state.ghostEl.remove();
            if (state.hoverFolder) state.hoverFolder.classList.remove('drop-target');
            if (state.hoverTab) state.hoverTab.classList.remove('tab-drop-target');
            document.body.style.cursor = '';

            if (state.activated) {
                suppressClick();

                if (state.hoverTab) {
                    const targetTabId = state.hoverTab.dataset.tabId;
                    const srcPath = [...getCurrentPath()];
                    switchTab(targetTabId);
                    moveItemsTo(state.items, null, targetTabId, srcPath);
                } else if (state.hoverFolder) {
                    const targetFolder = state.hoverFolder.dataset.name;
                    moveItemsTo(state.items, targetFolder);
                }
            }
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
                suppressClick();

                if (state.hoverTab) {
                    const targetTabId = state.hoverTab.dataset.tabId;
                    const srcPath = [...getCurrentPath()];   // ← 切换前抓源路径
                    switchTab(targetTabId);
                    moveItemsTo(state.items, null, targetTabId, srcPath);
                } else if (state.hoverFolder) {
                    const targetFolder = state.hoverFolder.dataset.name;
                    moveItemsTo(state.items, targetFolder);
                }
            } else if (state.startItem) {
                // 未拖拽（就是单击）→ 调整选择
                if (e.ctrlKey || e.metaKey) {
                    // Ctrl/Cmd+单击已选中项 → 取消选中它
                    state.startItem.classList.remove('selected');
                } else if (!e.shiftKey) {
                    // 无修饰键 → 若多选，收缩为只选中这一项
                    const selectedCount = list.querySelectorAll('.fe-item.selected').length;
                    if (selectedCount > 1) {
                        list.querySelectorAll('.fe-item.selected').forEach(el => el.classList.remove('selected'));
                        state.startItem.classList.add('selected');
                    }
                }
            }
            return;
        }

        /* ---------- 框选收尾 ---------- */
        if (!dragState) return;

        if (dragState.activated) {
            if (dragState.bandEl) dragState.bandEl.remove();
            suppressClick();
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
async function moveItemsTo(items, targetFolder, targetTabId, sourcePathOverride) {
    if (!items || items.length === 0) return;

    // 源路径：跨标签页时必须在 switchTab 之前抓到，由调用方传入
    const sourcePath = sourcePathOverride || getCurrentPath();

    // 确定目标路径
    let targetPath;
    if (targetTabId) {
        const targetTab = tabs.find(t => t.id === targetTabId);
        targetPath = targetTab ? [...targetTab.currentPath] : [];
    } else {
        targetPath = [...sourcePath, targetFolder];
    }

    // 目标 == 源目录，直接忽略
    if (targetPath.join('/') === sourcePath.join('/')) return;

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
    // 记录原始记录，用于回滚
    const originals = rows.map(r => ({
        file_name: r.file_name,
        file_url: r.file_url,
        storage_path: r.storage_path
    }));

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
        // 回滚
        const { error: rbErr } = await sb.from('file_list').insert(originals);
        if (rbErr) {
            await dlgAlert(
                '移动失败（回滚也失败）',
                `插入新记录失败：${insErr.message}\n回滚失败：${rbErr.message}\n\n请手动检查文件列表，部分记录可能已丢失。`
            );
        } else {
            await dlgAlert('移动失败', `${insErr.message}\n\n已自动回滚，文件未变动。`);
        }
        loadFiles();
        return;
    }

    showToast(`已移动 ${items.length} 项`, 'success');
    loadFiles();
}