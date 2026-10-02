/* ============================================================
 * 文件收藏 + 快速访问
 * ============================================================ */

/** 收藏缓存 */
let favoritesCache = [];
let favoritesLoaded = false;

/* ---------- 数据层 ---------- */

async function loadFavorites() {
    try {
        const { data, error } = await sb.from('favorites')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            console.warn('加载收藏失败', error.message);
            favoritesCache = [];
        } else {
            favoritesCache = data || [];
        }
    } catch (e) {
        console.warn('加载收藏异常', e);
        favoritesCache = [];
    }
    favoritesLoaded = true;
}

function isFavorited(path) {
    if (!path) return false;
    return favoritesCache.some(f => f.path === path);
}

async function addFavorite(item) {
    if (!item || !item.path) return;
    if (isFavorited(item.path)) return;

    const row = {
        path: item.path,
        name: item.name,
        type: item.type,
        storage_path: item.storage_path || null
    };

    const { error } = await sb.from('favorites').insert(row);
    if (error) {
        await dlgAlert('收藏失败', error.message);
        return;
    }
    favoritesCache.unshift({
        ...row,
        id: 'tmp_' + Date.now(),
        created_at: new Date().toISOString()
    });
    showToast('已收藏', 'success');

    const v = getView();
    if (v === 'quick' || v === 'favorites') renderExplorer();
}

async function removeFavorite(path) {
    if (!path) return;
    const { error } = await sb.from('favorites').delete().eq('path', path);
    if (error) {
        await dlgAlert('取消收藏失败', error.message);
        return;
    }
    favoritesCache = favoritesCache.filter(f => f.path !== path);
    showToast('已取消收藏', 'success');

    const v = getView();
    if (v === 'quick' || v === 'favorites') renderExplorer();
}

async function toggleFavorite(item) {
    if (isFavorited(item.path)) await removeFavorite(item.path);
    else await addFavorite(item);
}

/** 根据当前选中的项，构造收藏数据 */
function buildFavoriteFromSelection(sel) {
    if (!sel) return null;
    if (sel.type === 'file') {
        const file = findFileByStoragePath(sel.path);
        if (!file) return null;
        return {
            path: file.file_name,
            name: file.displayName,
            type: 'file',
            storage_path: file.storage_path
        };
    }
    if (sel.type === 'folder') {
        return {
            path: buildFullPath(getCurrentPath(), sel.name),
            name: sel.name,
            type: 'folder'
        };
    }
    return null;
}

/* ---------- 渲染：快速访问 ---------- */

function renderQuickAccess(wrap) {
    const favCount = favoritesLoaded ? favoritesCache.length : '—';

    const rootNode = getNodeByPath([]);
    const allCount = rootNode
        ? Object.keys(rootNode._children).length + Object.keys(rootNode._files).length
        : 0;

    const sharedNode = getNodeByPath(['文件']);
    const sharedCount = sharedNode
        ? Object.keys(sharedNode._children).length + Object.keys(sharedNode._files).length
        : 0;

    const item = (quick, iconFile, label, count) => `
        <div class="fe-item fe-folder quick-item" data-type="quick" data-quick="${quick}">
            <span class="fe-icon"><img src="${VSC_ICON_CDN}${iconFile}" alt=""></span>
            <span class="fe-name">${label}</span>
            <span class="fe-meta fe-type">快速访问</span>
            <span class="fe-meta fe-size">${count} 项</span>
            <span class="fe-meta fe-mtime"></span>
        </div>`;

    wrap.innerHTML =
        item('favorites', 'folder_type_favorite.svg', '收藏夹',     favCount) +
        item('all',       'folder_type_root.svg',     '全部文件',   allCount) +
        item('shared',    'folder_type_shared.svg',   '分享的文件', sharedCount);

    wrap.scrollTop = 0;
}

/** 从 fileTree 反查收藏项的大小/时间 */
function getFavoriteMetric(fav, key) {
    if (fav.type === 'file' && fav.storage_path) {
        const f = findFileByStoragePath(fav.storage_path);
        if (f) {
            if (key === 'size') return f._size || 0;
            if (key === 'mtime') return f._mtime ? new Date(f._mtime).getTime() : 0;
        }
    } else if (fav.type === 'folder') {
        const node = getNodeByPath(fav.path.split('/').filter(Boolean));
        if (node) {
            if (key === 'size') return node._totalSize || 0;
            if (key === 'mtime') return node._latestMtime ? new Date(node._latestMtime).getTime() : 0;
        }
    }
    return 0;
}

/** 收藏项显示名：名称 (父路径) */
function favDisplayName(fav) {
    const parentDir = fav.path.includes('/')
        ? fav.path.slice(0, fav.path.lastIndexOf('/'))
        : '';
    return parentDir ? `${fav.name} (${parentDir})` : fav.name;
}

/** 排序后的收藏项 */
function getSortedFavorites() {
    const { key: sortKey, asc: sortAsc } = getSort();
    const arr = favoritesCache.slice();
    arr.sort((a, b) => {
        let v = 0;
        if (sortKey === 'name') {
            v = a.name.localeCompare(b.name, 'zh');
        } else if (sortKey === 'type') {
            v = (a.type === 'folder' ? 0 : 1) - (b.type === 'folder' ? 0 : 1);
            if (v === 0) v = a.name.localeCompare(b.name, 'zh');
        } else if (sortKey === 'size' || sortKey === 'mtime') {
            v = getFavoriteMetric(a, sortKey) - getFavoriteMetric(b, sortKey);
        }
        return sortAsc ? v : -v;
    });
    return arr;
}

/** 收藏项 → 通用 HTML 属性串 */
function favItemAttrs(fav) {
    const isFolder = fav.type === 'folder';
    return `data-type="favorite" data-fav-type="${fav.type}" ` +
        `data-fav-path="${escapeHtml(fav.path)}" ` +
        `data-fav-name="${escapeHtml(fav.name)}" ` +
        `data-storage-path="${escapeHtml(fav.storage_path || '')}" ` +
        `class="fe-item fav-item ${isFolder ? 'fe-folder' : 'fe-file'}"`;
}

/** 收藏项图标 URL */
function favIconUrl(fav) {
    return fav.type === 'folder' ? DEFAULT_FOLDER_ICON : getFileIconUrl(fav.name);
}

function renderFavorites(wrap) {
    if (!favoritesLoaded) {
        showLoading(wrap, '正在加载收藏…');
        return;
    }
    if (favoritesCache.length === 0) {
        wrap.innerHTML = `<div class="nofile">还没有收藏任何文件</div>`;
        return;
    }

    const list = getSortedFavorites();
    const viewMode = getViewMode();

    let html = '';
    switch (viewMode) {
        case 'small':
        case 'medium':
        case 'large':
        case 'xlarge':
            html = renderFavGrid(list, viewMode);
            break;
        case 'tile':
            html = renderFavTile(list);
            break;
        case 'list':
            html = renderFavList(list);
            break;
        case 'content':
            html = renderFavContent(list);
            break;
        case 'details':
        default:
            html = renderFavDetails(list);
            break;
    }
    wrap.innerHTML = html;
    wrap.scrollTop = 0;
}

function renderFavGrid(list, sizeClass) {
    let h = `<div class="fe-grid">`;
    for (const fav of list) {
        const icon = favIconUrl(fav);
        const name = favDisplayName(fav);
        h += `
        <div ${favItemAttrs(fav)}>
            <span class="fe-icon"><img src="${icon}" alt="" onerror="this.onerror=null;this.src='${DEFAULT_FILE_ICON}'"></span>
            <span class="fe-name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
        </div>`;
    }
    h += `</div>`;
    return h;
}

function renderFavTile(list) {
    let h = `<div class="fe-tile-wrap">`;
    for (const fav of list) {
        const icon = favIconUrl(fav);
        const name = favDisplayName(fav);
        const isFolder = fav.type === 'folder';
        const typeLabel = isFolder ? '文件夹' : getFileTypeLabel(fav.name);
        const sizeText = isFolder
            ? formatBytes(getFavoriteMetric(fav, 'size'))
            : formatBytes(getFavoriteMetric(fav, 'size'));
        h += `
        <div ${favItemAttrs(fav)} style="display:flex;">
            <span class="fe-icon"><img src="${icon}" alt="" onerror="this.onerror=null;this.src='${DEFAULT_FILE_ICON}'"></span>
            <div class="fe-tile-info">
                <div class="fe-name" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
                <div class="fe-tile-meta">${typeLabel} · ${sizeText}</div>
            </div>
        </div>`;
    }
    h += `</div>`;
    return h;
}

function renderFavList(list) {
    let h = `<div class="fe-list-view">`;
    for (const fav of list) {
        const icon = favIconUrl(fav);
        const name = favDisplayName(fav);
        h += `
        <div ${favItemAttrs(fav)} style="display:flex;">
            <span class="fe-icon"><img src="${icon}" alt="" onerror="this.onerror=null;this.src='${DEFAULT_FILE_ICON}'"></span>
            <span class="fe-name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
        </div>`;
    }
    h += `</div>`;
    return h;
}

function renderFavContent(list) {
    let h = '';
    for (const fav of list) {
        const icon = favIconUrl(fav);
        const isFolder = fav.type === 'folder';
        const typeLabel = isFolder ? '文件夹' : getFileTypeLabel(fav.name);
        const sizeText = formatBytes(getFavoriteMetric(fav, 'size'));
        const mtime = getFavoriteMetric(fav, 'mtime');
        const name = favDisplayName(fav);
        h += `
        <div ${favItemAttrs(fav)} style="display:flex;">
            <span class="fe-icon"><img src="${icon}" alt="" onerror="this.onerror=null;this.src='${DEFAULT_FILE_ICON}'"></span>
            <div class="fe-content-info">
                <div class="fe-content-line">
                    <span class="fe-name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
                    <span class="fe-meta fe-mtime">${mtime ? formatTime(new Date(mtime)) : ''}</span>
                </div>
                <div class="fe-content-line">
                    <span class="fe-meta fe-type">${escapeHtml(typeLabel)}</span>
                    <span class="fe-meta fe-size">${sizeText}</span>
                </div>
            </div>
        </div>`;
    }
    return h;
}

function renderFavDetails(list) {
    let h = renderDetailsHeader();
    for (const fav of list) {
        const icon = favIconUrl(fav);
        const isFolder = fav.type === 'folder';
        const typeLabel = isFolder ? '文件夹' : getFileTypeLabel(fav.name);
        const sizeText = formatBytes(getFavoriteMetric(fav, 'size'));
        const mtime = getFavoriteMetric(fav, 'mtime');
        const name = favDisplayName(fav);
        h += `
        <div ${favItemAttrs(fav)}>
            <span class="fe-icon"><img src="${icon}" alt="" onerror="this.onerror=null;this.src='${DEFAULT_FILE_ICON}'"></span>
            <span class="fe-name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
            <span class="fe-meta fe-type">${escapeHtml(typeLabel)}</span>
            <span class="fe-meta fe-size">${sizeText}</span>
            <span class="fe-meta fe-mtime">${mtime ? formatTime(new Date(mtime)) : ''}</span>
            <span class="fe-actions"></span>
        </div>`;
    }
    return h;
}

function openFavoriteItem(favItem) {
    const favType = favItem.dataset.favType;
    const favPath = favItem.dataset.favPath;

    if (favType === 'folder') {
        const parts = favPath.split('/').filter(Boolean);
        setView('path');
        setCurrentPath(parts);
        renderExplorer();
        updateActiveTabTitle();
        return;
    }

    const storage = favItem.dataset.storagePath;
    const file = storage ? findFileByStoragePath(storage) : null;
    if (!file) {
        showToast('文件已不存在', 'error');
        return;
    }
    openPreview(file);
}
