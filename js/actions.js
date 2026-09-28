/* ============================================================
 * 剪贴板
 * ============================================================ */

/** 剪贴板：{ mode: 'copy'|'cut', entries: [{...}] } */
let clipboard = null;
/** 内联重命名状态锁 */
let inlineRenameActive = false;
/** 进入编辑的延迟 timer（用于和 dblclick 竞争） */
let inlineRenameTimer = null;
/**
 * 在内存文件树里找同目录下是否已有同名文件，有则加 (1)(2)…
 */
function resolveNameConflict(parentPath, relName) {
    const parts = relName.split('/');
    const filename = parts.pop();
    const node = getNodeByPath([...parentPath, ...parts]);
    if (!node) return relName;
    if (!node._files[filename] && !node._children[filename]) return relName;

    const dotIdx = filename.lastIndexOf('.');
    const base = dotIdx > 0 ? filename.slice(0, dotIdx) : filename;
    const ext = dotIdx > 0 ? filename.slice(dotIdx) : '';

    let i = 1;
    while (true) {
        const candidate = `${base} (${i})${ext}`;
        if (!node._files[candidate] && !node._children[candidate]) {
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
                    newRelName: sel.name + '/' + rel,
                    groupKey: sel.name
                });
            }
        }
    }

    if (entries.length === 0) {
        console.log('无内容可' + (cut ? '剪切' : '复制'));
        return;
    }

    clipboard = { mode: cut ? 'cut' : 'copy', entries };
    showToast(`已${cut ? '剪切' : '复制'} ${entries.length} 项`, 'info');

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

    // 同一个 groupKey（同一文件夹）只算一次冲突名
    const groupResolved = new Map();
    for (const entry of entries) {
        if (entry.groupKey) {
            if (!groupResolved.has(entry.groupKey)) {
                groupResolved.set(entry.groupKey, resolveNameConflict(currentPath, entry.groupKey));
            }
            const safeFolder = groupResolved.get(entry.groupKey);
            const rel = entry.newRelName.slice(entry.groupKey.length + 1);
            entry.safeRel = safeFolder + '/' + rel;
        } else {
            entry.safeRel = resolveNameConflict(currentPath, entry.newRelName);
        }
    }

    for (const entry of entries) {
        const safeRel = entry.safeRel;
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
        showToast(`已剪切粘贴 ${entries.length} 项`, 'success');
    } else {
        showToast(`已复制粘贴 ${entries.length} 项`, 'success');
    }
    loadFiles();
}

/* ============================================================
 * 重命名
 * ============================================================ */
/**
 * 执行重命名（不弹窗，直接改）。原 renameSelected 和 startInlineRename 共用。
 * @param {{type:string, name:string, path:string}} sel
 * @param {string} trimmed 新名字（已 trim）
 */
async function doRenameTo(sel, trimmed) {
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
    showToast('重命名成功', 'success');
    loadFiles();
}
async function renameSelected() {
    const sel = getSelectedItem();
    if (!sel) return;

    const newName = await dlgPrompt('重命名', '请输入新名称', sel.name);
    if (newName === null) return;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === sel.name) return;
    await doRenameTo(sel, trimmed);
}

/* ============================================================
 * 删除
 * ============================================================ */

async function delFile(rowId, storagePath) {
    const ok = await dlgConfirm('删除文件', '确定删除该文件？', true);
    if (!ok) return;
    const { error: dbErr } = await sb.from('file_list').delete().eq('id', rowId);
    if (dbErr) {
        console.error("删除记录失败", dbErr);
        showToast('删除失败：' + dbErr.message, 'error');
        return;
    }
    const { error: stErr } = await sb.storage.from('public_netdisk').remove([storagePath]);
    if (stErr) {
        console.error("删除存储失败", stErr);
        showToast('文件记录已删，但存储对象删除失败', 'error');
    } else {
        showToast('文件已删除', 'success');
    }
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
    let stFailed = 0;
    for (let i = 0; i < storagePaths.length; i += batchSize) {
        const pathBatch = storagePaths.slice(i, i + batchSize);
        const idBatch = ids.slice(i, i + batchSize);
        const { error: stErr } = await sb.storage
            .from('public_netdisk').remove(pathBatch);
        if (stErr) {
            stFailed += pathBatch.length;
            console.warn('删除 storage 对象失败', stErr.message);
        }
        await sb.from('file_list').delete().in('id', idBatch);
        currentFinished += pathBatch.length;
    }

    isDone = true;
    cancelAnimationFrame(rafId);
    updateProgress(totalCount, currentFinished, 'delete');
    if (stFailed > 0) {
        showToast(`文件夹记录已删（${totalCount} 个），但 ${stFailed} 个存储对象删除失败`, 'error', 4000);
    } else {
        showToast(`文件夹已删除（${totalCount} 个文件）`, 'success');
    }
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
    let okCount = 0;
    let failCount = 0;

    for (const sel of sels) {
        let thisOk = true;

        if (sel.type === 'file') {
            const file = findFileByStoragePath(sel.path);
            if (!file) { failCount++; continue; }
            const { error: dbErr } = await sb.from('file_list').delete().eq('id', file.id);
            if (dbErr) { console.error(dbErr); failCount++; continue; }
            await sb.storage.from('public_netdisk').remove([file.storage_path]);
        } else {
            const folderPrefix = buildFullPath(currentPath, sel.name);
            const { data: allFiles, error } = await sb.from('file_list').select('*');
            if (error) { console.error(error); failCount++; continue; }

            const prefix1 = folderPrefix + '/';
            const prefix2 = '/' + folderPrefix + '/';
            const targets = allFiles.filter(r => {
                const n = r.file_name || '';
                return n.startsWith(prefix1) || n.startsWith(prefix2);
            });
            if (targets.length === 0) { failCount++; continue; }

            const paths = targets.map(r => r.storage_path);
            const ids = targets.map(r => r.id);
            for (let i = 0; i < paths.length; i += 5) {
                const { error: stErr } = await sb.storage
                    .from('public_netdisk')
                    .remove(paths.slice(i, i + 5));
                if (stErr) {
                    console.warn('删除 storage 对象失败', stErr.message);
                    thisOk = false;
                }
                const { error: dbErr } = await sb.from('file_list')
                    .delete().in('id', ids.slice(i, i + 5));
                if (dbErr) {
                    console.error(dbErr);
                    thisOk = false;
                }
            }
        }

        if (thisOk) okCount++;
    }

    if (failCount === 0) {
        showToast(`已删除 ${okCount} 项`, 'success');
    } else if (okCount === 0) {
        showToast(`删除失败（${failCount} 项）`, 'error');
    } else {
        showToast(`成功 ${okCount} 项，失败 ${failCount} 项`, 'error');
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
        showToast('创建文件失败', 'error');
        return;
    }
    showToast(`已创建 ${trimmed}`, 'success');
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
        showToast('创建文件夹失败', 'error');
        return;
    }
    showToast(`已创建文件夹 ${trimmed}`, 'success');
    loadFiles();
}

/* ============================================================
 * 右键菜单
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
/* ============================================================
 * 内联重命名：把 fe-name 换成 input，就地编辑
 * ============================================================ */

function cancelInlineRename() {
    if (inlineRenameTimer) {
        clearTimeout(inlineRenameTimer);
        inlineRenameTimer = null;
    }
    const input = document.querySelector('.fe-name-input');
    if (input) {
        const nameEl = input._feNameEl;
        if (nameEl) nameEl.style.display = '';
        input.remove();
    }
    inlineRenameActive = false;
}

/**
 * 进入内联重命名
 * @param {HTMLElement} itemEl  .fe-item 元素
 */
function startInlineRename(itemEl) {
    if (inlineRenameActive) return;
    if (!itemEl) return;

    const nameEl = itemEl.querySelector('.fe-name');
    if (!nameEl) return;

    const sel = {
        type: itemEl.dataset.type,
        name: itemEl.dataset.name,
        id: itemEl.dataset.id,
        path: itemEl.dataset.path,
        el: itemEl
    };
    // 文件必须能在文件树里找到
    if (sel.type === 'file' && !findFileByStoragePath(sel.path)) return;

    inlineRenameActive = true;

    const originalText = sel.name || '';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'fe-name-input';
    input.value = originalText;
    input._feNameEl = nameEl;

    nameEl.style.display = 'none';
    nameEl.parentNode.insertBefore(input, nameEl.nextSibling);

    // 只选中主名，不含扩展名
    const dotIdx = originalText.lastIndexOf('.');
    if (sel.type === 'file' && dotIdx > 0) {
        input.setSelectionRange(0, dotIdx);
    } else {
        input.select();
    }
    input.focus();

    let finished = false;

    const finish = (commit) => {
        if (finished) return;
        finished = true;
        const newName = input.value.trim();
        // 先撤掉 UI，再提交/回滚
        if (nameEl) nameEl.style.display = '';
        input.remove();
        inlineRenameActive = false;
        inlineRenameTimer = null;

        if (!commit) return;
        if (!newName || newName === originalText) return;
        doRenameTo(sel, newName);
    };

    input.addEventListener('keydown', e => {
        e.stopPropagation();
        if (e.key === 'Enter') {
            e.preventDefault();
            finish(true);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            finish(false);
        }
    });
    input.addEventListener('blur', () => {
        // Enter 触发 finish 后 blur 会再来一次，finished 已拦住
        setTimeout(() => finish(false), 0);
    });
    // 阻止冒泡，避免触发框选/拖拽/右键逻辑
    input.addEventListener('mousedown', e => e.stopPropagation());
    input.addEventListener('click', e => e.stopPropagation());
    input.addEventListener('dblclick', e => e.stopPropagation());
    input.addEventListener('contextmenu', e => e.stopPropagation());
}