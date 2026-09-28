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

function renderFavorites(wrap) {
    if (!favoritesLoaded) {
        showLoading(wrap, '正在加载收藏…');
        return;
    }
    if (favoritesCache.length === 0) {
        wrap.innerHTML = `<div class="nofile">还没有收藏任何文件</div>`;
        return;
    }

    let html = '';
    for (const fav of favoritesCache) {
        const isFolder = fav.type === 'folder';
        const iconUrl = isFolder ? DEFAULT_FOLDER_ICON : getFileIconUrl(fav.name);
        const typeLabel = isFolder ? '文件夹' : getFileTypeLabel(fav.name);
        const parentDir = fav.path.includes('/')
            ? fav.path.slice(0, fav.path.lastIndexOf('/'))
            : '';
        const pathText = parentDir || '根目录';

        html += `
        <div class="fe-item fav-item ${isFolder ? 'fe-folder' : 'fe-file'}"
             data-type="favorite"
             data-fav-type="${fav.type}"
             data-fav-path="${escapeHtml(fav.path)}"
             data-fav-name="${escapeHtml(fav.name)}"
             data-storage-path="${escapeHtml(fav.storage_path || '')}">
            <span class="fe-icon"><img src="${iconUrl}" alt="" onerror="this.onerror=null;this.src='${DEFAULT_FILE_ICON}'"></span>
            <span class="fe-name">${escapeHtml(fav.name)}</span>
            <span class="fe-meta fe-type">${typeLabel}</span>
            <span class="fe-meta fav-path" title="${escapeHtml(pathText)}">${escapeHtml(pathText)}</span>
        </div>`;
    }
    wrap.innerHTML = html;
    wrap.scrollTop = 0;
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