// Supabase信息
const SUPABASE_URL = "https://ekphociqviwojbonbcbd.supabase.co";
const ANON_KEY = "sb_publishable_ebvcoe-OiDqlZJTkIsvZ1g_KsDf4sSU";
const sb = window.supabase.createClient(SUPABASE_URL, ANON_KEY);
/* ============================================================
 * 文本查看器
 * ============================================================ */

/** 常见可读文本扩展名 */
const TEXT_EXTS = new Set([
    'txt', 'md', 'markdown', 'json', 'xml', 'html', 'htm', 'css', 'js', 'mjs', 'cjs',
    'ts', 'jsx', 'tsx', 'vue', 'svelte', 'py', 'java', 'c', 'h', 'cpp', 'hpp', 'cc',
    'cs', 'go', 'rs', 'rb', 'php', 'sh', 'bash', 'bat', 'cmd', 'ps1',
    'yaml', 'yml', 'toml', 'ini', 'conf', 'cfg', 'log', 'csv', 'tsv', 'sql',
    'env', 'lua', 'dart', 'swift', 'kt', 'kts', 'scala', 'r', 'm', 'pl',
    'tex', 'rst', 'srt', 'vtt', 'properties', 'gradle', 'lock', 'svg',
    'webmanifest', 'map', 'graphql', 'gql', 'proto', 'asm', 'vb', 'pas', 'f90',
    'jl', 'nim', 'zig'
]);

/**
 * 根据文件名判断是否为可读文本
 * @param {string} filename
 * @returns {boolean}
 */
function isTextFile(filename) {
    const name = String(filename || '').toLowerCase();
    // 无扩展名（如 Makefile、Dockerfile、.gitignore）默认当作文本
    const idx = name.lastIndexOf('.');
    if (idx === -1 || idx === 0) return true;
    return TEXT_EXTS.has(name.slice(idx + 1));
}

/** 当前查看器打开的文件对象 */
let viewerCurrentFile = null;

/**
 * 打开文本查看器（UTF-8 解析）
 * @param {{displayName: string, file_url: string}} file
 */
async function openTextViewer(file) {
    viewerCurrentFile = file;
    const overlay = document.getElementById('textViewer');
    const title = document.getElementById('viewerTitle');
    const content = document.getElementById('viewerContent');

    title.textContent = file.displayName || file.file_name || '文件预览';
    content.textContent = '加载中…';
    overlay.classList.add('show');

    try {
        const res = await fetch(file.file_url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const buf = await res.arrayBuffer();
        // UTF-8 解码，BOM 由 TextDecoder 自动处理
        const text = new TextDecoder('utf-8', { fatal: false }).decode(buf);
        content.textContent = text;
    } catch (err) {
        console.error('读取文件失败', err);
        content.textContent = '加载失败：' + err.message;
    }
}

/**
 * 关闭文本查看器
 */
function closeTextViewer() {
    document.getElementById('textViewer').classList.remove('show');
    viewerCurrentFile = null;
}

/**
 * 绑定查看器内部按钮
 */
function initTextViewer() {
    const overlay = document.getElementById('textViewer');
    document.getElementById('viewerClose').addEventListener('click', closeTextViewer);
    document.getElementById('viewerDownload').addEventListener('click', () => {
        if (viewerCurrentFile) {
            downloadFile(viewerCurrentFile.displayName, viewerCurrentFile.file_url);
        }
    });
    document.getElementById('viewerCopy').addEventListener('click', async () => {
        const btn = document.getElementById('viewerCopy');
        const content = document.getElementById('viewerContent').textContent;
        try {
            await navigator.clipboard.writeText(content);
            const old = btn.textContent;
            btn.textContent = '已复制';
            setTimeout(() => { btn.textContent = old; }, 1000);
        } catch (err) {
            console.error('复制失败', err);
            alert('复制失败，可能浏览器未授予剪贴板权限');
        }
    });
    // 点遮罩关闭
    overlay.addEventListener('click', e => {
        if (e.target === overlay) closeTextViewer();
    });
    // ESC 关闭
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && overlay.classList.contains('show')) closeTextViewer();
    });
}
/* ============================================================
 * 通用工具
 * ============================================================ */

/**
 * HTML 转义，防止拼接 HTML 时被文件名/消息内容破坏或注入
 * @param {any} str
 * @returns {string}
 */
function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));
}

/**
 * 毫秒格式化为「预计剩余 X分Y秒」
 * @param {number} ms
 * @returns {string}
 */
function formatMs(ms) {
    const s = Math.round(ms / 1000);
    if (s < 60) return `预计剩余 ${s}秒`;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `预计剩余 ${m}分${sec}秒`;
}

/* ============================================================
 * 标签切换
 * ============================================================ */

function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.tab-panel');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.toggle('active', t === tab));
            panels.forEach(p => p.classList.toggle('active', p.id === 'tab-' + target));
        });
    });
}

/* ============================================================
 * 聊天室
 * ============================================================ */

async function loadMessages() {
    console.log("开始加载聊天消息");
    const { data, error } = await sb.from("messages").select("*").order("created_at", { asc: true });
    if (error) {
        console.error("消息加载错误", error);
        alert("消息加载错误：" + error.message);
        return;
    }
    console.log("消息加载成功，共", data?.length || 0, "条");
    renderMsg(data || []);
}

/**
 * 渲染消息
 * @param {Array} list
 */
function renderMsg(list) {
    const box = document.getElementById("msgBox");
    box.innerHTML = list.map(i => `
        <div class="msg-item">
            [${new Date(i.created_at).toLocaleString()}]
            <b>${escapeHtml(i.username)}</b>：${escapeHtml(i.content)}
        </div>`).join("");
    box.scrollTop = box.scrollHeight;
}

/**
 * 发送消息
 */
async function sendMsg() {
    const name = document.getElementById("userName").value || "匿名";
    const content = document.getElementById("msgInput").value.trim();
    if (!content) return;
    const { error } = await sb.from("messages").insert({ username: name, content });
    if (error) {
        console.error("发送失败", error);
        alert("发送失败：" + error.message);
        return;
    }
    document.getElementById("msgInput").value = "";
}

// Realtime 监听
sb.channel("public_chat")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => loadMessages())
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, () => loadMessages())
    .subscribe();

/* ============================================================
 * 网盘 - 状态与树结构
 * ============================================================ */

/** 文件树根节点 @type {{_files: Record<string, any>, _children: Record<string, any>}} */
let fileTree = { _files: {}, _children: {} };

/** 当前所在路径，例如 ["a", "b"]，空数组表示根 */
let currentPath = [];

/**
 * 根据路径段数组获取树节点
 * @param {string[]} path
 * @returns {any|null}
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
 * 构建文件树
 * @param {Array} data
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
        node._files[filename] = { ...item, displayName: filename };
    }
    return tree;
}

/**
 * 加载文件列表并重建树
 */
async function loadFiles() {
    const { data, error } = await sb.from("file_list").select("*").order("created_at", { desc: true });
    if (error) {
        console.error("文件列表加载失败", error);
        return;
    }
    fileTree = buildTree(data || []);
    // 若当前路径已不存在，回到根目录
    if (!getNodeByPath(currentPath)) currentPath = [];
    renderExplorer();
}

/* ============================================================
 * 网盘 - 资源管理器渲染
 * ============================================================ */

/**
 * 渲染整个资源管理器（工具栏 + 列表）
 */
function renderExplorer() {
    renderBreadcrumb();
    renderFileList();
}

/**
 * 渲染面包屑
 */
function renderBreadcrumb() {
    const bar = document.getElementById("breadcrumb");
    const upBtn = document.getElementById("btnUp");
    if (!bar) return;

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
 * 渲染当前目录内容
 */
function renderFileList() {
    const wrap = document.getElementById("fileList");
    if (!wrap) return;

    const node = getNodeByPath(currentPath);
    if (!node) {
        wrap.innerHTML = `<div class="nofile">文件夹不存在</div>`;
        return;
    }

    const folders = Object.keys(node._children).sort((a, b) => a.localeCompare(b, 'zh'));
    const files = Object.values(node._files).sort((a, b) => a.displayName.localeCompare(b.displayName, 'zh'));

    if (folders.length === 0 && files.length === 0) {
        wrap.innerHTML = `<div class="nofile">此文件夹为空</div>`;
        return;
    }

    let html = "";

    for (const name of folders) {
        html += `
        <div class="fe-item fe-folder" data-type="folder" data-name="${escapeHtml(name)}">
            <span class="fe-icon">📁</span>
            <span class="fe-name">${escapeHtml(name)}</span>
            <span class="fe-actions">
                <button class="fe-btn" data-action="zip" type="button">打包</button>
                <button class="fe-btn del" data-action="del-folder" type="button">删除</button>
            </span>
        </div>`;
    }

    for (const file of files) {
        const canOpen = isTextFile(file.displayName);
        const openBtn = canOpen
            ? `<button class="fe-btn" data-action="open" type="button">打开</button>`
            : '';
        html += `
    <div class="fe-item fe-file"
         data-type="file"
         data-name="${escapeHtml(file.displayName)}"
         data-id="${escapeHtml(file.id)}"
         data-path="${escapeHtml(file.storage_path)}">
        <span class="fe-icon">📄</span>
        <span class="fe-name">${escapeHtml(file.displayName)}</span>
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

/**
 * 拼接完整相对路径
 * @param {string[]} base
 * @param {string} name
 */
function buildFullPath(base, name) {
    return [...base, name].filter(Boolean).join('/');
}

/**
 * 在当前节点里按文件名查找
 * @param {string} name
 */
function findCurrentFile(name) {
    const node = getNodeByPath(currentPath);
    return node?._files?.[name] || null;
}

/* ============================================================
 * 网盘 - 事件绑定（事件委托）
 * ============================================================ */

function initExplorerEvents() {
    const list = document.getElementById("fileList");
    const bar = document.getElementById("breadcrumb");
    const upBtn = document.getElementById("btnUp");
    const refreshBtn = document.getElementById("btnRefresh");

    // 单击：选中 / 触发操作按钮
    list.addEventListener("click", e => {
        const btn = e.target.closest("button[data-action]");
        const item = e.target.closest(".fe-item");
        if (!item) return;

        if (btn) {
            e.stopPropagation();
            const action = btn.dataset.action;
            const name = item.dataset.name;

            if (action === "zip") {
                downloadFolderZip(buildFullPath(currentPath, name));
            } else if (action === "del-folder") {
                delFolder(buildFullPath(currentPath, name));
            } else if (action === "download") {
                const file = findCurrentFile(name);
                if (file) downloadFile(file.displayName, file.file_url);
            } else if (action === "open") {
                const file = findCurrentFile(name);
                if (file) openTextViewer(file);
            } else if (action === "del-file") {
                delFile(item.dataset.id, item.dataset.path);
            }
            return;
        }

        // 选中逻辑
        list.querySelectorAll(".fe-item.selected").forEach(el => el.classList.remove("selected"));
        item.classList.add("selected");
    });

    // 双击：进入文件夹 / 下载文件
    list.addEventListener("dblclick", e => {
        const item = e.target.closest(".fe-item");
        if (!item) return;
        if (item.dataset.type === "folder") {
            currentPath.push(item.dataset.name);
            renderExplorer();
            return;
        }
        const file = findCurrentFile(item.dataset.name);
        if (!file) return;
        if (isTextFile(file.displayName)) {
            openTextViewer(file);       // 文本 → 内置查看器
        } else {
            downloadFile(file.displayName, file.file_url);  // 其它 → 直接下载
        }
    });

    // 面包屑点击
    bar.addEventListener("click", e => {
        const crumb = e.target.closest(".crumb");
        if (!crumb) return;
        const idx = parseInt(crumb.dataset.idx, 10);
        currentPath = currentPath.slice(0, idx + 1);
        renderExplorer();
    });

    // 上一级
    upBtn.addEventListener("click", () => {
        if (currentPath.length === 0) return;
        currentPath.pop();
        renderExplorer();
    });

    // 刷新
    refreshBtn.addEventListener("click", () => loadFiles());
}

/* ============================================================
 * 网盘 - 拖拽上传
 * ============================================================ */

let dropArea = null;

function tryInitDrop() {
    dropArea = document.getElementById('dropArea');
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
tryInitDrop();

/**
 * 拖拽递归遍历文件夹并上传（rAF 平滑进度 + 预估剩余时间）
 * @param {FileSystemEntry[]} entries
 */
async function traverseEntries(entries) {
    const allEntries = [];

    /** 读取目录下所有子条目 */
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

    /** 递归收集所有文件条目 */
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

    let currentFinished = 0;
    const startTs = performance.now();
    let rafId = null;
    let isDone = false;

    function renderLoop() {
        if (isDone) return;
        rafId = requestAnimationFrame(renderLoop);
        const costMs = performance.now() - startTs;
        let estimateText = "预计剩余 计算中…";
        if (currentFinished > 0 && costMs > 0) {
            const speed = currentFinished / costMs;
            const remainMs = (totalCount - currentFinished) / speed;
            estimateText = formatMs(remainMs);
        }
        updateProgress(totalCount, currentFinished, 'upload', estimateText);
    }

    rafId = requestAnimationFrame(renderLoop);

    for (const entry of allEntries) {
        const file = await getFileFromEntry(entry);
        await uploadSingleFileWithPath(file, entry.fullPath);
        currentFinished++;
    }

    isDone = true;
    cancelAnimationFrame(rafId);
    updateProgress(totalCount, currentFinished, 'upload');

    setTimeout(() => {
        updateProgress(0, 0, 'upload');
        loadFiles();
    }, 800);
}

/**
 * 从 FileSystemFileEntry 获取 File
 * @param {FileSystemFileEntry} entry
 * @returns {Promise<File>}
 */
async function getFileFromEntry(entry) {
    return new Promise(resolve => entry.file(file => resolve(file)));
}

/* ============================================================
 * 网盘 - 上传核心
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
 * 网盘 - 进度条
 * ============================================================ */

/**
 * 更新进度 UI
 * @param {number} total
 * @param {number} finished
 * @param {'upload'|'delete'|'downloadZip'} [type='upload']
 * @param {string} [estimateText='']
 */
function updateProgress(total, finished, type = 'upload', estimateText = '') {
    const progressDom = document.getElementById('uploadProgress');
    const tipDom = document.getElementById('uploadTip');
    if (!progressDom || !tipDom) return;

    if (total <= 0) {
        progressDom.style.display = 'none';
        progressDom.value = 0;
        tipDom.textContent = '';
        return;
    }

    progressDom.style.display = 'block';
    const percent = Math.round((finished / total) * 100);
    progressDom.value = percent;   // 修复：进度条真实更新

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
        if (type === 'upload') tipDom.textContent = "上传完成！";
        else if (type === 'delete') tipDom.textContent = "删除完成！";
        else if (type === 'downloadZip') tipDom.textContent = "打包完成，ZIP 已开始下载";
        progressDom.value = 100;
        setTimeout(() => {
            progressDom.style.display = 'none';
            progressDom.value = 0;
            tipDom.textContent = '';
        }, 1500);
    }
}

/* ============================================================
 * 网盘 - 删除
 * ============================================================ */

/**
 * 删除单个文件
 * @param {string} rowId
 * @param {string} storagePath
 */
async function delFile(rowId, storagePath) {
    if (!confirm("确定删除该文件？")) return;
    const { error: dbErr } = await sb.from("file_list").delete().eq("id", rowId);
    if (dbErr) { console.error("删除记录失败", dbErr); alert("删除失败"); return; }
    const { error: stErr } = await sb.storage.from("public_netdisk").remove([storagePath]);
    if (stErr) { console.error("删除存储失败", stErr); }
    loadFiles();
}

/**
 * 删除文件夹（rAF 平滑进度，5 个一批）
 * @param {string} folderPrefix
 */
async function delFolder(folderPrefix) {
    if (!confirm(`确定删除【${folderPrefix}】及其内部所有文件吗？该操作不可恢复！`)) return;

    const { data: allFiles, error } = await sb.from("file_list").select("*");
    if (error) { console.error("查询文件失败", error); alert("查询文件失败"); return; }

    const prefix1 = folderPrefix + "/";
    const prefix2 = "/" + folderPrefix + "/";
    const targetFiles = allFiles.filter(item => {
        const name = item.file_name || "";
        return name.startsWith(prefix1) || name.startsWith(prefix2);
    });

    if (targetFiles.length === 0) { alert("文件夹内无文件"); return; }

    const totalCount = targetFiles.length;
    let currentFinished = 0;
    const startTs = performance.now();
    let rafId = null;
    let isDone = false;

    function renderLoop() {
        if (isDone) return;
        rafId = requestAnimationFrame(renderLoop);
        const costMs = performance.now() - startTs;
        let estimateText = "预计剩余 计算中…";
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
        await sb.storage.from("public_netdisk").remove(pathBatch);
        await sb.from("file_list").delete().in("id", idBatch);
        currentFinished += pathBatch.length;
    }

    isDone = true;
    cancelAnimationFrame(rafId);
    updateProgress(totalCount, currentFinished, 'delete');
    setTimeout(() => { updateProgress(0, 0, 'delete'); loadFiles(); }, 800);
}

/* ============================================================
 * 网盘 - 下载
 * ============================================================ */

/**
 * 强制下载文件（blob 方案）
 * @param {string} fileName
 * @param {string} fileUrl
 */
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
        alert('下载失败');
    }
}

/**
 * 文件夹打包 ZIP 下载
 * @param {string} folderPrefix
 */
async function downloadFolderZip(folderPrefix) {
    if (!confirm(`确定打包【${folderPrefix}】下所有文件为 ZIP？`)) return;

    const { data: allFiles, error } = await sb.from("file_list").select("*");
    if (error) { console.error("查询文件失败", error); alert("查询文件失败"); return; }

    const prefix1 = folderPrefix + "/";
    const prefix2 = "/" + folderPrefix + "/";
    const targetFiles = allFiles.filter(item => {
        const name = item.file_name || "";
        return name.startsWith(prefix1) || name.startsWith(prefix2);
    });

    if (targetFiles.length === 0) { alert("文件夹内无文件"); return; }

    const totalCount = targetFiles.length;
    let currentFinished = 0;
    const startTs = performance.now();
    let rafId = null;
    let isDone = false;

    function renderLoop() {
        if (isDone) return;
        rafId = requestAnimationFrame(renderLoop);
        const costMs = performance.now() - startTs;
        let estimateText = "预计剩余 计算中…";
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
            // 去掉前导 /，避免 ZIP 内部路径异常
            zip.file(String(fileItem.file_name).replace(/^\/+/, ''), blob);
        } catch (err) {
            console.error("文件下载失败：", fileItem.file_name, err);
        }
        currentFinished++;
    }

    const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
    const zipUrl = URL.createObjectURL(zipBlob);   // 修复：保存引用再释放
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
 * 网盘 - 按钮上传
 * ============================================================ */

/**
 * 使用 File System Access API 选择多个文件上传
 */
async function uploadViaFSA() {
    if (!window.showOpenFilePicker) {
        alert("你的浏览器不支持 File System Access API，请使用最新版 Chrome 或 Edge");
        return;
    }

    let handles;
    try {
        handles = await window.showOpenFilePicker({ multiple: true });
    } catch (e) {
        if (e.name === 'AbortError') return;   // 用户取消
        console.error("showOpenFilePicker 失败:", e);
        alert("选择文件失败：" + e.message);
        return;
    }

    const items = [];
    for (const handle of handles) {
        const file = await handle.getFile();
        items.push({ file, path: file.name });
    }
    document.getElementById("fileTip").textContent = `已选 ${items.length} 个文件`;
    await doUploadItems(items, false);
    document.getElementById("fileTip").textContent = "未选择文件";
}

/**
 * 使用 File System Access API 选择文件夹上传
 */
async function uploadFolderViaFSA() {
    if (!window.showDirectoryPicker) {
        alert("你的浏览器不支持 File System Access API，请使用最新版 Chrome 或 Edge");
        return;
    }

    let dirHandle;
    try {
        dirHandle = await window.showDirectoryPicker();
    } catch (e) {
        if (e.name === 'AbortError') return;
        console.error("showDirectoryPicker 失败:", e);
        alert("选择文件夹失败：" + e.message);
        return;
    }

    const items = [];
    await collectDirFiles(dirHandle, dirHandle.name, items);

    if (items.length === 0) {
        alert("文件夹内没有文件");
        return;
    }
    document.getElementById("folderTip").textContent = `已选 ${items.length} 个文件`;
    await doUploadItems(items, true);
    document.getElementById("folderTip").textContent = "未选择文件夹";
}

/**
 * 递归收集目录下所有文件
 * @param {FileSystemDirectoryHandle} dirHandle
 * @param {string} prefix 相对路径前缀
 * @param {Array<{file: File, path: string}>} out
 */
async function collectDirFiles(dirHandle, prefix, out) {
    for await (const [name, handle] of dirHandle.entries()) {
        if (handle.kind === 'file') {
            const file = await handle.getFile();
            out.push({ file, path: `${prefix}/${name}` });
        } else if (handle.kind === 'directory') {
            await collectDirFiles(handle, `${prefix}/${name}`, out);
        }
    }
}

/**
 * 通用上传：接收 {file, path} 列表，带 rAF 进度条
 * @param {Array<{file: File, path: string}>} items
 * @param {boolean} showSpeed 是否显示速度（文件夹模式）
 */
async function doUploadItems(items, showSpeed) {
    if (items.length === 0) return;

    const totalCount = items.length;
    const totalBytes = items.reduce((sum, it) => sum + it.file.size, 0);

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

    for (const { file, path } of items) {
        await uploadSingleFileWithPath(file, path);
        currentFinished++;
        totalUploadBytes += file.size;
    }

    isDone = true;
    cancelAnimationFrame(rafId);
    updateProgress(totalCount, currentFinished, 'upload');

    setTimeout(() => {
        updateProgress(0, 0, 'upload');
        loadFiles();
    }, 800);
}

/* ============================================================
 * 初始化
 * ============================================================ */

initTabs();
initExplorerEvents();
initTextViewer();
loadMessages();
loadFiles();