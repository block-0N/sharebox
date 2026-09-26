/* ============================================================
 * 剪贴板
 * ============================================================ */

/** 剪贴板：{ mode: 'copy'|'cut', entries: [{...}] } */
let clipboard = null;

/**
 * 在内存文件树里找同目录下是否已有同名文件，有则加 (1)(2)…
 */
function resolveNameConflict(parentPath, relName) {
    const parts = relName.split('/');
    const filename = parts.pop();
    const node = getNodeByPath([...parentPath, ...parts]);
    if (!node || !node._files[filename]) return relName;

    const dotIdx = filename.lastIndexOf('.');
    const base = dotIdx > 0 ? filename.slice(0, dotIdx) : filename;
    const ext = dotIdx > 0 ? filename.slice(dotIdx) : '';

    let i = 1;
    while (true) {
        const candidate = `${base} (${i})${ext}`;
        if (!node._files[candidate]) {
            parts.push(candidate);
            return parts.join('/');
        }
        i++;
    }
}

/**
 * 复制 / 剪切选中项
 * @param {boolean} cut true=剪切，false=复制
 */
async function copySelection(cut = false) {
    const sels = getSelectedItems();
    if (sels.length === 0) return;

    const currentPath = getCurrentPath();
    const entries = [];
    for (const sel of sels) {
        if (sel.type === 'file') {
            const file = findFileByStoragePath(sel.path);
            if (!file) continue;
            entries.push({
                originalId: file.id,
                originalFileName: file.file_name,
                storagePath: file.storage_path,
                newRelName: file.displayName
            });
        } else {
            const folderPath = buildFullPath(currentPath, sel.name);
            const prefix = folderPath + '/';
            const { data, error } = await sb.from('file_list').select('*');
            if (error) { await dlgAlert('读取失败', error.message); continue; }
            for (const row of data) {
                if (!row.file_name.startsWith(prefix)) continue;
                const rel = row.file_name.slice(folderPath.length + 1);
                entries.push({
                    originalId: row.id,
                    originalFileName: row.file_name,
                    storagePath: row.storage_path,
                    newRelName: sel.name + '/' + rel
                });
            }
        }
    }

    if (entries.length === 0) {
        console.log('无内容可' + (cut ? '剪切' : '复制'));
        return;
    }

    clipboard = { mode: cut ? 'cut' : 'copy', entries };
    console.log(`已${cut ? '剪切' : '复制'} ${entries.length} 项`);

    // 视觉反馈：复制/剪切的条目半透明
    const list = document.getElementById('fileList');
    if (list) {
        list.querySelectorAll('.fe-item').forEach(el => el.classList.remove('clipboard'));
        for (const sel of sels) {
            if (sel.el) sel.el.classList.add('clipboard');
        }
    }
}

/**
 * 粘贴剪贴板内容到当前目录
 */
async function pasteHere() {
    if (!clipboard || clipboard.entries.length === 0) {
        console.log('剪贴板为空');
        return;
    }

    const currentPath = getCurrentPath();
    const mode = clipboard.mode;
    const entries = clipboard.entries.slice();

    for (const entry of entries) {
        const safeRel = resolveNameConflict(currentPath, entry.newRelName);
        const targetFileName = buildFullPath(currentPath, safeRel);

        const ext = (entry.storagePath.split('.').pop() || 'bin');
        const newStoragePath = `${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;

        const { error: cpErr } = await sb.storage
            .from('public_netdisk')
            .copy(entry.storagePath, newStoragePath);
        if (cpErr) {
            console.error('Storage 复制失败:', entry.storagePath, cpErr.message);
            continue;
        }

        const { data: urlData } = sb.storage.from('public_netdisk').getPublicUrl(newStoragePath);
        const { error: insErr } = await sb.from('file_list').insert({
            file_name: targetFileName,
            file_url: urlData.publicUrl,
            storage_path: newStoragePath
        });
        if (insErr) {
            console.error('写入 file_list 失败:', insErr.message);
            await sb.storage.from('public_netdisk').remove([newStoragePath]);
            continue;
        }

        if (mode === 'cut') {
            await sb.from('file_list').delete().eq('id', entry.originalId);
            await sb.storage.from('public_netdisk').remove([entry.storagePath]);
        }
    }

    if (mode === 'cut') {
        clipboard = null;
        // 清理半透明样式
        document.querySelectorAll('.fe-item.clipboard').forEach(el => el.classList.remove('clipboard'));
    }
    loadFiles();
}

/* ============================================================
 * 重命名
 * ============================================================ */

async function renameSelected() {
    const sel = getSelectedItem();
    if (!sel) return;

    const newName = await dlgPrompt('重命名', '请输入新名称', sel.name);
    if (newName === null) return;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === sel.name) return;
    if (/[\/\\]/.test(trimmed)) {
        await dlgAlert('名称不合法', '名称不能包含 / 或 \\');
        return;
    }

    if (sel.type === 'file') {
        const file = findFileByStoragePath(sel.path);
        if (!file) return;
        const oldName = file.file_name;
        const parentDir = oldName.includes('/') ? oldName.slice(0, oldName.lastIndexOf('/')) : '';
        const newPath = parentDir ? parentDir + '/' + trimmed : trimmed;

        const { error: delErr } = await sb.from('file_list').delete().eq('id', file.id);
        if (delErr) { await dlgAlert('重命名失败', delErr.message); return; }

        const { error: insErr } = await sb.from('file_list').insert({
            file_name: newPath,
            file_url: file.file_url,
            storage_path: file.storage_path
        });
        if (insErr) {
            await sb.from('file_list').insert({
                file_name: file.file_name,
                file_url: file.file_url,
                storage_path: file.storage_path
            });
            await dlgAlert('重命名失败', insErr.message);
            return;
        }
    } else {
        const currentPath = getCurrentPath();
        const oldPrefix = buildFullPath(currentPath, sel.name);
        const newPrefix = buildFullPath(currentPath, trimmed);
        const { data, error } = await sb.from('file_list').select('*');
        if (error) { await dlgAlert('读取失败', error.message); return; }

        const prefix = oldPrefix + '/';
        const targets = data.filter(r => r.file_name && r.file_name.startsWith(prefix));
        if (targets.length === 0) { await dlgAlert('提示', '文件夹内无文件'); return; }

        const ids = targets.map(r => r.id);
        const { error: delErr } = await sb.from('file_list').delete().in('id', ids);
        if (delErr) { await dlgAlert('重命名失败', delErr.message); return; }

        const newRows = targets.map(r => ({
            file_name: newPrefix + r.file_name.slice(oldPrefix.length),
            file_url: r.file_url,
            storage_path: r.storage_path
        }));
        const { error: insErr } = await sb.from('file_list').insert(newRows);
        if (insErr) {
            await sb.from('file_list').insert(targets.map(r => ({
                file_name: r.file_name,
                file_url: r.file_url,
                storage_path: r.storage_path
            })));
            await dlgAlert('重命名失败', insErr.message);
            return;
        }
    }

    loadFiles();
}

/* ============================================================
 * 删除
 * ============================================================ */

async function delFile(rowId, storagePath) {
    const ok = await dlgConfirm('删除文件', '确定删除该文件？', true);
    if (!ok) return;
    const { error: dbErr } = await sb.from('file_list').delete().eq('id', rowId);
    if (dbErr) { console.error("删除记录失败", dbErr); await dlgAlert("删除失败"); return; }
    const { error: stErr } = await sb.storage.from('public_netdisk').remove([storagePath]);
    if (stErr) { console.error("删除存储失败", stErr); }
    loadFiles();
}

async function delFolder(folderPrefix) {
    const ok = await dlgConfirm('删除文件夹', `确定删除【${folderPrefix}】及其内部所有文件吗？该操作不可恢复！`, true);
    if (!ok) return;

    const { data: allFiles, error } = await sb.from('file_list').select('*');
    if (error) { console.error("查询文件失败", error); await dlgAlert("查询文件失败"); return; }

    const prefix1 = folderPrefix + '/';
    const prefix2 = '/' + folderPrefix + '/';
    const targetFiles = allFiles.filter(item => {
        const name = item.file_name || '';
        return name.startsWith(prefix1) || name.startsWith(prefix2);
    });

    if (targetFiles.length === 0) { await dlgAlert('提示', '文件夹内无文件'); return; }

    const totalCount = targetFiles.length;
    let currentFinished = 0;
    const startTs = performance.now();
    let rafId = null;
    let isDone = false;

    function renderLoop() {
        if (isDone) return;
        rafId = requestAnimationFrame(renderLoop);
        const costMs = performance.now() - startTs;
        let estimateText = '预计剩余 计算中…';
        if (currentFinished > 0 && costMs > 0) {
            estimateText = formatMs((totalCount - currentFinished) / (currentFinished / costMs));
        }
        updateProgress(totalCount, currentFinished, 'delete', estimateText);
    }
    rafId = requestAnimationFrame(renderLoop);

    const storagePaths = targetFiles.map(i => i.storage_path);
    const ids = targetFiles.map(i => i.id);
    const batchSize = 5;
    for (let i = 0; i < storagePaths.length; i += batchSize) {
        const pathBatch = storagePaths.slice(i, i + batchSize);
        const idBatch = ids.slice(i, i + batchSize);
        await sb.storage.from('public_netdisk').remove(pathBatch);
        await sb.from('file_list').delete().in('id', idBatch);
        currentFinished += pathBatch.length;
    }

    isDone = true;
    cancelAnimationFrame(rafId);
    updateProgress(totalCount, currentFinished, 'delete');
    setTimeout(() => { updateProgress(0, 0, 'delete'); loadFiles(); }, 800);
}

async function deleteSelected() {
    const sels = getSelectedItems();
    if (sels.length === 0) return;

    let msg;
    if (sels.length === 1) {
        msg = sels[0].type === 'file'
            ? '确定删除该文件？'
            : `确定删除【${sels[0].name}】及其内部所有文件吗？该操作不可恢复！`;
    } else {
        msg = `确定删除选中的 ${sels.length} 项吗？该操作不可恢复！`;
    }

    const ok = await dlgConfirm('删除', msg, true);
    if (!ok) return;

    const currentPath = getCurrentPath();
    for (const sel of sels) {
        if (sel.type === 'file') {
            const file = findFileByStoragePath(sel.path);
            if (!file) continue;
            const { error: dbErr } = await sb.from('file_list').delete().eq('id', file.id);
            if (dbErr) { console.error(dbErr); continue; }
            await sb.storage.from('public_netdisk').remove([file.storage_path]);
        } else {
            const folderPrefix = buildFullPath(currentPath, sel.name);
            const { data: allFiles, error } = await sb.from('file_list').select('*');
            if (error) { console.error(error); continue; }

            const prefix1 = folderPrefix + '/';
            const prefix2 = '/' + folderPrefix + '/';
            const targets = allFiles.filter(r => {
                const n = r.file_name || '';
                return n.startsWith(prefix1) || n.startsWith(prefix2);
            });
            if (targets.length === 0) continue;

            const paths = targets.map(r => r.storage_path);
            const ids = targets.map(r => r.id);
            for (let i = 0; i < paths.length; i += 5) {
                await sb.storage.from('public_netdisk').remove(paths.slice(i, i + 5));
                await sb.from('file_list').delete().in('id', ids.slice(i, i + 5));
            }
        }
    }

    loadFiles();
}

/* ============================================================
 * 下载
 * ============================================================ */

async function downloadFile(fileName, fileUrl) {
    try {
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error('文件获取失败');
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
    } catch (err) {
        console.error('下载失败：', err);
        await dlgAlert('下载失败');
    }
}

async function downloadFolderZip(folderPrefix) {
    const ok = await dlgConfirm('打包下载', `确定打包【${folderPrefix}】下所有文件为 ZIP？`);
    if (!ok) return;

    const { data: allFiles, error } = await sb.from('file_list').select('*');
    if (error) { console.error("查询文件失败", error); await dlgAlert("查询文件失败"); return; }

    const prefix1 = folderPrefix + '/';
    const prefix2 = '/' + folderPrefix + '/';
    const targetFiles = allFiles.filter(item => {
        const name = item.file_name || '';
        return name.startsWith(prefix1) || name.startsWith(prefix2);
    });

    if (targetFiles.length === 0) { await dlgAlert('提示', '文件夹内无文件'); return; }

    const totalCount = targetFiles.length;
    let currentFinished = 0;
    const startTs = performance.now();
    let rafId = null;
    let isDone = false;

    function renderLoop() {
        if (isDone) return;
        rafId = requestAnimationFrame(renderLoop);
        const costMs = performance.now() - startTs;
        let estimateText = '预计剩余 计算中…';
        if (currentFinished > 0 && costMs > 0) {
            estimateText = formatMs((totalCount - currentFinished) / (currentFinished / costMs));
        }
        updateProgress(totalCount, currentFinished, 'downloadZip', estimateText);
    }
    rafId = requestAnimationFrame(renderLoop);

    const zip = new JSZip();
    for (const fileItem of targetFiles) {
        try {
            const res = await fetch(fileItem.file_url);
            if (!res.ok) throw new Error("文件拉取失败");
            const blob = await res.blob();
            zip.file(String(fileItem.file_name).replace(/^\/+/, ''), blob);
        } catch (err) {
            console.error("文件下载失败：", fileItem.file_name, err);
        }
        currentFinished++;
    }

    const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
    const zipUrl = URL.createObjectURL(zipBlob);
    const zipName = (folderPrefix.split('/').filter(Boolean).pop() || 'download') + '.zip';

    const a = document.createElement("a");
    a.href = zipUrl;
    a.download = zipName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(zipUrl);

    isDone = true;
    cancelAnimationFrame(rafId);
    updateProgress(totalCount, currentFinished, 'downloadZip');
}

/* ============================================================
 * 新建
 * ============================================================ */

async function createNewFile() {
    const result = await dlgNewFile('untitled.txt');
    if (!result) return;

    const trimmed = result.name.trim();
    if (!trimmed) return;
    if (/[\/\\]/.test(trimmed)) {
        await dlgAlert('名称不合法', '文件名不能包含 / 或 \\');
        return;
    }

    const currentPath = getCurrentPath();
    const node = getNodeByPath(currentPath);
    if (node && node._files[trimmed]) {
        await dlgAlert('已存在', '当前目录已存在同名文件');
        return;
    }

    const fullPath = buildFullPath(currentPath, trimmed);
    const file = new File([result.content || ""], trimmed, { type: "text/plain" });
    const ok = await uploadSingleFileWithPath(file, fullPath);
    if (!ok) {
        await dlgAlert('创建失败', '创建文件失败，请重试');
        return;
    }
    loadFiles();
}

async function createNewFolder() {
    const name = await dlgPrompt('新建文件夹', '请输入文件夹名', '新建文件夹');
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    if (/[\/\\]/.test(trimmed)) {
        await dlgAlert('名称不合法', '文件夹名不能包含 / 或 \\');
        return;
    }

    const currentPath = getCurrentPath();
    const node = getNodeByPath(currentPath);
    if (node && node._children[trimmed]) {
        await dlgAlert('已存在', '当前目录已存在同名文件夹');
        return;
    }

    const fullPath = buildFullPath(currentPath, trimmed + '/' + FOLDER_PLACEHOLDER);
    const file = new File([""], FOLDER_PLACEHOLDER, { type: "text/plain" });
    const ok = await uploadSingleFileWithPath(file, fullPath);
    if (!ok) {
        await dlgAlert('创建失败', '创建文件夹失败，请重试');
        return;
    }
    loadFiles();
}

/* ============================================================
 * 右键菜单
 * ============================================================ */

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

function showContextMenu(x, y) {
    const menu = ensureContextMenu();
    const sels = getSelectedItems();
    const sel = sels.length > 0 ? sels[0] : null;
    const n = sels.length;
    const { key: sortKey, asc: sortAsc } = getSort();

    const items = [];

    if (sel) {
        if (n === 1) {
            if (sel.type === 'file') {
                items.push({
                    label: '打开', shortcut: '双击',
                    action: () => {
                        const f = findFileByStoragePath(sel.path);
                        if (f) openPreview(f);
                    }
                });
                items.push({
                    label: '打开方式',
                    action: () => {
                        const f = findFileByStoragePath(sel.path);
                        if (f) chooseOpenMethod(f);
                    }
                });
                items.push({
                    label: '下载',
                    action: () => {
                        const f = findFileByStoragePath(sel.path);
                        if (f) downloadFile(f.displayName, f.file_url);
                    }
                });
            } else {
                items.push({
                    label: '打开',
                    action: () => {
                        const currentPath = getCurrentPath();
                        currentPath.push(sel.name);
                        setCurrentPath(currentPath);
                        renderExplorer();
                        updateActiveTabTitle();
                    }
                });
            }
        } else {
            items.push({ label: `已选 ${n} 项`, disabled: true });
        }
        items.push({ sep: true });
        if (n === 1) {
            items.push({ label: '重命名', shortcut: 'F2', action: renameSelected });
        }
        items.push({ label: n > 1 ? `复制 ${n} 项` : '复制', shortcut: 'Ctrl+C', action: () => copySelection(false) });
        items.push({ label: n > 1 ? `剪切 ${n} 项` : '剪切', shortcut: 'Ctrl+X', action: () => copySelection(true) });
        items.push({ sep: true });
        items.push({ label: n > 1 ? `删除 ${n} 项` : '删除', shortcut: 'Del', danger: true, action: deleteSelected });
    } else {
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
        items.push({ label: '刷新', action: () => loadFiles() });
    }

    menu.innerHTML = '';
    document.querySelectorAll('.context-submenu').forEach(el => el.remove());

    function renderItems(container, list, isSub) {
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

            el.innerHTML = `<span>${it.label}</span>` +
                (hasChildren
                    ? '<span class="arrow">▸</span>'
                    : (it.shortcut ? `<span class="shortcut">${it.shortcut}</span>` : ''));

            if (hasChildren) {
                let subEl = null;
                el.addEventListener('mouseenter', () => {
                    document.querySelectorAll('.context-submenu').forEach(s => s.remove());
                    subEl = document.createElement('div');
                    subEl.className = 'context-submenu show';
                    renderItems(subEl, it.children, true);
                    document.body.appendChild(subEl);

                    const r = el.getBoundingClientRect();
                    const sr = subEl.getBoundingClientRect();
                    let left = r.right - 2;
                    if (left + sr.width > window.innerWidth - 8) {
                        left = r.left - sr.width + 2;
                    }
                    let top = r.top;
                    if (top + sr.height > window.innerHeight - 8) {
                        top = window.innerHeight - sr.height - 8;
                    }
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

    renderItems(menu, items, false);

    menu.style.left = '0px';
    menu.style.top = '0px';
    menu.classList.add('show');
    const rect = menu.getBoundingClientRect();
    const px = Math.min(x, window.innerWidth - rect.width - 8);
    const py = Math.min(y, window.innerHeight - rect.height - 8);
    menu.style.left = px + 'px';
    menu.style.top = py + 'px';
}

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

function initContextMenu() {
    ensureContextMenu();

    const list = document.getElementById('fileList');
    list.addEventListener('contextmenu', e => {
        e.preventDefault();

        const item = e.target.closest('.fe-item');

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

/* ============================================================
 * 键盘快捷键
 * ============================================================ */

function initKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
        if (e.target.matches('input, textarea, [contenteditable="true"]')) return;
        if (document.querySelector('#textViewer.show')) return;
        if (document.querySelector('#dialog.show')) return;
        if (document.querySelector('#newFileDialog.show')) return;
        if (document.querySelector('#openWithDialog.show')) return;

        const sel = getSelectedItem();

        if (e.ctrlKey && !e.shiftKey && !e.altKey) {
            const k = e.key.toLowerCase();

            // Ctrl+T: 新建标签页（tabs.js 里处理）
            if (k === 't') return;

            if (k === 'a') {
                e.preventDefault();
                const list = document.getElementById('fileList');
                if (list) {
                    list.querySelectorAll('.fe-item').forEach(el => el.classList.add('selected'));
                }
                return;
            }
            if (k === 'c') {
                if (sel) { e.preventDefault(); copySelection(false); }
            } else if (k === 'x') {
                if (sel) { e.preventDefault(); copySelection(true); }
            } else if (k === 'v') {
                e.preventDefault();
                pasteHere();
            }
        } else if (e.key === 'Delete') {
            if (sel) { e.preventDefault(); deleteSelected(); }
        } else if (e.key === 'Enter') {
            if (sel) {
                e.preventDefault();
                if (sel.type === 'folder') {
                    const currentPath = getCurrentPath();
                    currentPath.push(sel.name);
                    setCurrentPath(currentPath);
                    renderExplorer();
                    updateActiveTabTitle();
                } else {
                    const file = findFileByStoragePath(sel.path);
                    if (file) openPreview(file);
                }
            }
        } else if (e.key === 'F2') {
            if (sel) { e.preventDefault(); renameSelected(); }
        } else if (e.key === 'Escape') {
            hideContextMenu();
        }
    });
}