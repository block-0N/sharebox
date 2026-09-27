/* ============================================================
 * 上传核心
 * ============================================================ */

/**
 * 上传单个文件并写入 file_list
 * @param {File} file
 * @param {string} fullPath
 * @returns {Promise<boolean>}
 */
async function uploadSingleFileWithPath(file, fullPath) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const safePath = `${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext || 'bin'}`;

    const { error: upErr } = await sb.storage
        .from("public_netdisk")
        .upload(safePath, file);

    if (upErr) {
        console.warn("上传失败", fullPath, upErr.message);
        showToast(`上传失败：${fullPath}`, 'error');
        return false;
    }

    const { data: urlData } = sb.storage.from("public_netdisk").getPublicUrl(safePath);
    const { error: dbErr } = await sb.from("file_list").insert({
        file_name: fullPath,
        file_url: urlData.publicUrl,
        storage_path: safePath
    });

    if (dbErr) {
        console.error("写入 file_list 失败", fullPath, dbErr.message);
        await sb.storage.from("public_netdisk").remove([safePath]);
        return false;
    }
    return true;
}

/* ============================================================
 * 进度条
 * ============================================================ */

/**
 * 更新进度 UI
 * @param {number} total
 * @param {number} finished
 * @param {'upload'|'delete'|'downloadZip'} [type='upload']
 * @param {string} [estimateText='']
 */
function updateProgress(total, finished, type = 'upload', estimateText = '', finalText) {
    const progressWrap = document.getElementById('progress');
    const progressDom = document.getElementById('uploadProgress');
    const tipDom = document.getElementById('uploadTip');
    if (!progressWrap || !progressDom || !tipDom) return;

    if (total <= 0) {
        progressWrap.classList.remove('show');
        progressDom.value = 0;
        tipDom.textContent = '';
        return;
    }

    progressWrap.classList.add('show');
    const percent = Math.round((finished / total) * 100);
    progressDom.value = percent;

    let tipStr = '';
    if (type === 'upload') {
        tipStr = `上传中 ${finished}/${total} (${percent}%)`;
    } else if (type === 'delete') {
        tipStr = `删除中 ${finished}/${total} (${percent}%)`;
    } else if (type === 'downloadZip') {
        tipStr = `打包下载中 ${finished}/${total} (${percent}%)`;
    }
    if (estimateText && finished < total) tipStr += `，${estimateText}`;
    tipDom.textContent = tipStr;

    if (finished >= total) {
        if (finalText) {
            tipDom.textContent = finalText;
        } else {
            if (type === 'upload') tipDom.textContent = "上传完成！";
            else if (type === 'delete') tipDom.textContent = "删除完成！";
            else if (type === 'downloadZip') tipDom.textContent = "打包完成，ZIP 已开始下载";
        }
        progressDom.value = 100;
        setTimeout(() => {
            progressWrap.classList.remove('show');
            progressDom.value = 0;
            tipDom.textContent = '';
        }, 2000);
    }
}

/**
 * 判断一个上传路径是否包含隐藏项（以 . 开头的文件或目录）
 * @param {string} path
 * @returns {boolean}
 */
function isHiddenPath(path) {
    const segments = String(path || '').split('/').filter(Boolean);
    return segments.some(seg => seg.startsWith('.'));
}

/**
 * 过滤隐藏项：检测到隐藏文件时弹窗询问
 * @param {Array<{file: File, path: string}>} items
 * @returns {Promise<Array|null>} 返回处理后的列表，或 null 表示取消
 */
async function filterHiddenItems(items) {
    const hidden = items.filter(it => isHiddenPath(it.path));
    if (hidden.length === 0) return items;

    const previewPaths = hidden.slice(0, 5).map(it => it.path);
    const preview = previewPaths.join('\n')
        + (hidden.length > 5 ? `\n… 等 ${hidden.length} 项` : '');

    const msg = `检测到 ${hidden.length} 个隐藏文件/文件夹：\n\n${preview}\n\n是否一并上传？`;

    const choice = await dlgChoose(
        '发现隐藏文件',
        msg,
        [
            { label: '全部上传', value: 'all', primary: true },
            { label: '跳过隐藏', value: 'skip' },
            { label: '取消上传', value: 'cancel' }
        ]
    );

    if (choice === 'all') return items;
    if (choice === 'skip') return items.filter(it => !isHiddenPath(it.path));
    return null;
}

/**
 * 通用上传：接收 {file, path} 列表，带 rAF 进度条
 */
async function doUploadItems(rawItems, showSpeed) {
    if (rawItems.length === 0) return;

    // 过滤隐藏文件
    const items = await filterHiddenItems(rawItems);
    if (!items) return;
    if (items.length === 0) {
        await dlgAlert('提示', '没有可上传的文件（已全部跳过）');
        return;
    }

    // 检测同名冲突
    /** @type {Map<string, any>} path → 已存在的文件记录 */
    const conflictMap = new Map();
    for (const it of items) {
        const parts = it.path.split('/').filter(Boolean);
        const filename = parts.pop();
        const parentPath = parts;
        const parent = getNodeByPath(parentPath);
        if (parent && parent._files[filename]) {
            conflictMap.set(it.path, parent._files[filename]);
        }
    }

    let finalItems = items;
    let overwrite = false;

    if (conflictMap.size > 0) {
        const previewList = [...conflictMap.keys()].slice(0, 5).join('\n');
        const more = conflictMap.size > 5 ? `\n… 等 ${conflictMap.size} 个文件` : '';
        const msg = `检测到 ${conflictMap.size} 个同名文件：\n\n${previewList}${more}\n\n如何处理？`;

        const choice = await dlgChoose(
            '文件已存在',
            msg,
            [
                { label: '覆盖', value: 'overwrite', primary: true },
                { label: '保留两者', value: 'keep-both' },
                { label: '取消上传', value: 'cancel' }
            ]
        );
        if (!choice || choice === 'cancel') return;

        if (choice === 'overwrite') {
            overwrite = true;
        } else {
            // 保留两者：给每个冲突文件改名
            finalItems = items.map(it => {
                if (!conflictMap.has(it.path)) return it;
                const parts = it.path.split('/').filter(Boolean);
                const filename = parts.pop();
                const parentPath = parts;
                const newName = resolveNameConflict(parentPath, filename);
                const newPath = [...parentPath, newName].join('/');
                return { file: it.file, path: newPath };
            });
        }
    }

    const totalCount = finalItems.length;
    const totalBytes = finalItems.reduce((sum, it) => sum + it.file.size, 0);

    let currentFinished = 0;
    let totalUploadBytes = 0;
    const startTs = performance.now();
    let rafId = null;
    let isDone = false;
    let avgKbPerSec = 10;

    function renderLoop() {
        if (isDone) return;
        rafId = requestAnimationFrame(renderLoop);

        let estimateText = "预计剩余 计算中…";
        if (showSpeed) {
            const costSec = (performance.now() - startTs) / 1000;
            let bytesPerSec = avgKbPerSec * 1024;
            if (totalUploadBytes > 0 && costSec > 0) {
                bytesPerSec = totalUploadBytes / costSec;
                avgKbPerSec = avgKbPerSec * 0.7 + (bytesPerSec / 1024) * 0.3;
            }
            const remainBytes = Math.max(totalBytes - totalUploadBytes, 0);
            const remainMs = Math.max((remainBytes / bytesPerSec) * 1000, 1000);
            estimateText = `${formatMs(remainMs)}，速度 ${avgKbPerSec.toFixed(2)} KB/s`;
        } else {
            const costMs = performance.now() - startTs;
            if (currentFinished > 0 && costMs > 0) {
                estimateText = formatMs((totalCount - currentFinished) / (currentFinished / costMs));
            }
        }
        updateProgress(totalCount, currentFinished, 'upload', estimateText);
    }
    rafId = requestAnimationFrame(renderLoop);

    let successCount = 0;
    let failCount = 0;
    const failedPaths = [];

    for (const { file, path } of finalItems) {
        // 覆盖模式：先删旧文件
        if (overwrite && conflictMap.has(path)) {
            const old = conflictMap.get(path);
            try {
                await sb.storage.from("public_netdisk").remove([old.storage_path]);
                await sb.from("file_list").delete().eq("id", old.id);
            } catch (e) {
                console.warn("删除旧文件失败", e);
            }
        }

        const ok = await uploadSingleFileWithPath(file, path);
        if (ok) successCount++;
        else { failCount++; failedPaths.push(path); }
        currentFinished++;
        totalUploadBytes += file.size;
    }

    isDone = true;
    cancelAnimationFrame(rafId);

    let finalText;
    if (failCount === 0) {
        finalText = `上传完成（${successCount} 个文件）`;
    } else if (successCount === 0) {
        finalText = `上传失败（${failCount} 个文件）`;
    } else {
        finalText = `完成 ${successCount} 个，失败 ${failCount} 个`;
    }
    updateProgress(totalCount, currentFinished, 'upload', '', finalText);

    if (failCount === 0) {
        showToast(`上传完成（${successCount} 个文件）`, 'success');
    } else if (successCount === 0) {
        showToast(`上传失败（${failCount} 个文件）`, 'error');
    } else {
        showToast(`完成 ${successCount} 个，失败 ${failCount} 个`, 'error');
    }

    setTimeout(() => {
        updateProgress(0, 0, 'upload');
        loadFiles();
    }, 1500);
}

/* ============================================================
 * 按钮上传：File System Access API
 * ============================================================ */

async function uploadViaFSA() {
    if (!window.showOpenFilePicker) {
        await dlgAlert("不支持", "你的浏览器不支持 File System Access API，请使用最新版 Chrome 或 Edge");
        return;
    }

    let handles;
    try {
        handles = await window.showOpenFilePicker({ multiple: true });
    } catch (e) {
        if (e.name === 'AbortError') return;
        console.error("showOpenFilePicker 失败:", e);
        await dlgAlert("选择文件失败", e.message);
        return;
    }

    // 当前标签页的路径
    const basePath = getCurrentPath();
    const items = [];
    for (const handle of handles) {
        const file = await handle.getFile();
        items.push({ file, path: buildFullPath(basePath, file.name) });
    }
    await doUploadItems(items, false);
}

async function uploadFolderViaFSA() {
    if (!window.showDirectoryPicker) {
        await dlgAlert("不支持", "你的浏览器不支持 File System Access API，请使用最新版 Chrome 或 Edge");
        return;
    }

    let dirHandle;
    try {
        dirHandle = await window.showDirectoryPicker();
    } catch (e) {
        if (e.name === 'AbortError') return;
        console.error("showDirectoryPicker 失败:", e);
        await dlgAlert("选择文件夹失败", e.message);
        return;
    }

    const basePath = getCurrentPath();
    const items = [];
    await collectDirFiles(dirHandle, dirHandle.name, basePath, items);

    if (items.length === 0) {
        await dlgAlert("提示", "文件夹内没有文件");
        return;
    }
    await doUploadItems(items, true);
}

/**
 * 递归收集目录下所有文件
 * @param {FileSystemDirectoryHandle} dirHandle
 * @param {string} name       当前目录名
 * @param {string} parentPath 当前标签页的基路径
 * @param {Array<{file: File, path: string}>} out
 */
async function collectDirFiles(dirHandle, name, parentPath, out) {
    const currentPrefix = parentPath ? `${parentPath}/${name}` : name;
    for await (const [childName, handle] of dirHandle.entries()) {
        if (handle.kind === 'file') {
            const file = await handle.getFile();
            out.push({ file, path: `${currentPrefix}/${childName}` });
        } else if (handle.kind === 'directory') {
            await collectDirFiles(handle, childName, currentPrefix, out);
        }
    }
}

/* ============================================================
 * 拖拽上传
 * ============================================================ */

let dropArea = null;

function tryInitDrop() {
    dropArea = document.getElementById('fileList');
    if (!dropArea) {
        setTimeout(tryInitDrop, 200);
        return;
    }
    console.log("dropArea已找到，初始化拖拽");

    dropArea.addEventListener('dragenter', e => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.add('dragover');
    });
    dropArea.addEventListener('dragover', e => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.add('dragover');
    });
    dropArea.addEventListener('dragleave', e => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('dragover');
    });
    dropArea.addEventListener('drop', async e => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('dragover');
        const items = e.dataTransfer.items;
        if (!items || items.length === 0) return;
        const entries = Array.from(items)
            .map(item => item.webkitGetAsEntry && item.webkitGetAsEntry())
            .filter(Boolean);
        await traverseEntries(entries);
        loadFiles();
    });
}

/**
 * 拖拽递归遍历文件夹并上传
 */
async function traverseEntries(entries) {
    const allEntries = [];

    const readAllEntries = async (dirEntry) => new Promise(resolve => {
        const reader = dirEntry.createReader();
        let results = [];
        const read = () => {
            reader.readEntries(batch => {
                if (batch.length === 0) { resolve(results); return; }
                results = results.concat(batch);
                read();
            });
        };
        read();
    });

    const collect = async (list) => {
        for (const entry of list) {
            if (entry.isFile) {
                allEntries.push(entry);
            } else if (entry.isDirectory) {
                const childList = await readAllEntries(entry);
                await collect(childList);
            }
        }
    };

    await collect(entries);

    const totalCount = allEntries.length;
    if (totalCount === 0) return;

    const basePath = getCurrentPath();
    const items = [];
    for (const entry of allEntries) {
        const file = await getFileFromEntry(entry);
        const rel = String(entry.fullPath || file.name).replace(/^\/+/, '');
        const targetPath = buildFullPath(basePath, rel);
        items.push({ file, path: targetPath });
    }

    await doUploadItems(items, false);
}

async function getFileFromEntry(entry) {
    return new Promise(resolve => entry.file(file => resolve(file)));
}

/* ============================================================
 * 上传按钮下拉菜单
 * ============================================================ */

function initUploadMenu() {
    const btn = document.getElementById('btnUpload');
    const menu = document.getElementById('uploadMenu');
    if (!btn || !menu) return;

    btn.addEventListener('click', e => {
        e.stopPropagation();
        menu.classList.toggle('show');
    });

    menu.addEventListener('click', e => {
        const item = e.target.closest('.upload-menu-item');
        if (!item) return;
        const action = item.dataset.upload;
        menu.classList.remove('show');
        if (action === 'file') uploadViaFSA();
        else if (action === 'folder') uploadFolderViaFSA();
    });

    document.addEventListener('click', e => {
        if (!e.target.closest('.upload-menu-wrap')) {
            menu.classList.remove('show');
        }
    });
}