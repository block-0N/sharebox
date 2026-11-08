/* ============================================================
 * 预览总入口
 * ============================================================ */

/** 当前查看器打开的文件对象 */
let viewerCurrentFile = null;
let viewerCurrentText = null;
let originalText = null;
let cmEditor = null;

/**
 * 统一入口
 */
function openPreview(file) {
    // 统一隐藏编辑按钮（只有 openTextViewer 加载成功后才显示）
    const _toggleBtn = document.getElementById('viewerToggle');
    if (_toggleBtn) {
        _toggleBtn.style.display = 'none';
        _toggleBtn.textContent = '编辑';
        _toggleBtn.classList.remove('primary');
        _toggleBtn.disabled = false;
    }
    const name = file.displayName || file.file_name || '';
    const ext = getExt(name);
    if (ext === 'html' || ext === 'htm') return openHtmlPreview(file);
    if (ext === 'md' || ext === 'markdown') return openMarkdownPreview(file);
    if (isZipFile(name)) return openZipViewer(file);
    if (isTextFile(name)) return openTextViewer(file);
    if (isImageFile(name)) return openImagePreview(file);
    if (isPdfFile(name)) return openPdfPreview(file);
    if (isVideoFile(name)) return openVideoPreview(file);
    if (isAudioFile(name)) return openAudioPreview(file);
    if (isOfficeFile(name)) return openOfficePreview(file);
    return chooseOpenMethod(file);
}

/* ============================================================
 * 查看器通用
 * ============================================================ */

function resetViewer(file, subTitle) {
    viewerCurrentFile = file;
    const overlay = document.getElementById('textViewer');
    const title = document.getElementById('viewerTitle');
    const content = document.getElementById('viewerContent');
    title.textContent = file.displayName || file.file_name || subTitle || '预览';
    content.className = 'viewer-content';
    content.innerHTML = '';
    content.style.fontSize = '';
    overlay.classList.add('show');
    return content;

    const _toggle = document.getElementById('viewerToggle');
    if (_toggle) {
        _toggle.style.display = 'none';
        _toggle.textContent = '编辑';
        _toggle.classList.remove('primary');
        _toggle.disabled = false;
    }
}

async function closeTextViewer() {
    // 编辑中：确认丢弃
    if (cmEditor) {
        const changed = cmEditor.getValue() !== originalText;
        if (changed) {
            const ok = await dlgConfirm(
                '放弃修改',
                '文件正在编辑中，内容未保存。\n\n确定放弃修改并关闭？',
                true
            );
            if (!ok) return;
        }
        await exitEditMode(true);
    }
    document.getElementById('textViewer').classList.remove('show');
    viewerCurrentFile = null;
    viewerCurrentText = null;
    originalText = null;
}

function initTextViewer() {
    const overlay = document.getElementById('textViewer');
    document.getElementById('viewerClose').addEventListener('click', () => closeTextViewer());

    document.getElementById('viewerDownload').addEventListener('click', () => {
        if (viewerCurrentFile) {
            downloadFile(viewerCurrentFile.displayName, viewerCurrentFile.file_url);
        }
    });

    document.getElementById('viewerCopy').addEventListener('click', async () => {
        const btn = document.getElementById('viewerCopy');
        let textToCopy = '';
        if (cmEditor) {
            textToCopy = cmEditor.getValue();
        } else {
            textToCopy = document.getElementById('viewerContent').textContent;
        }
        try {
            const ok = await copyToClipboard(textToCopy);
            if (!ok) throw new Error('剪贴板写入失败');
            const old = btn.textContent;
            btn.textContent = '已复制';
            setTimeout(() => { btn.textContent = old; }, 1000);
        } catch (err) {
            console.error('复制失败', err);
            await dlgAlert('复制失败', '可能浏览器未授予剪贴板权限');
        }
    });

    const toggleBtn = document.getElementById('viewerToggle');
    if (toggleBtn) toggleBtn.addEventListener('click', toggleEditMode);

    overlay.addEventListener('click', e => {
        if (e.target === overlay) closeTextViewer();
    });

    document.addEventListener('keydown', e => {
        if (cmEditor && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            e.stopPropagation();
            saveEditedText();
            return;
        }
        if (e.key === 'Escape' && overlay.classList.contains('show')) {
            closeTextViewer();
        }
    });
}

/* ============================================================
 * 文本预览
 * ============================================================ */

async function openTextViewer(file, forceReload) {
    viewerCurrentFile = file;
    viewerCurrentText = null;
    const overlay = document.getElementById('textViewer');
    const title = document.getElementById('viewerTitle');
    const content = document.getElementById('viewerContent');

    title.textContent = file.displayName || file.file_name || '文件预览';
    content.className = 'viewer-content';
    content.textContent = '加载中…';
    overlay.classList.add('show');

    const toggleBtn = document.getElementById('viewerToggle');
    if (toggleBtn) { toggleBtn.style.display = 'none'; toggleBtn.textContent = '编辑'; toggleBtn.disabled = false; }
    try {
        const url = forceReload ? (file.file_url + '?t=' + Date.now()) : file.file_url;
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const buf = await res.arrayBuffer();

        let text;
        try {
            text = new TextDecoder('utf-8', { fatal: true }).decode(buf);
        } catch (e) {
            try { text = new TextDecoder('gbk', { fatal: false }).decode(buf); }
            catch (e2) { text = new TextDecoder('utf-8', { fatal: false }).decode(buf); }
        }

        viewerCurrentText = text;

        if (text.length > 500 * 1024) {
            content.textContent = text + '\n\n[文件较大，未进行语法高亮]';
            return;
        }

        renderTextPreviewContent(content, text, file.displayName);

        if (toggleBtn) toggleBtn.style.display = '';
    } catch (err) {
        console.error('读取文件失败', err);
        content.textContent = '加载失败：' + err.message;
    }
}
/* ============================================================
 * 文本预览渲染（抽出，供预览和保存后重渲染用）
 * ============================================================ */
function renderTextPreviewContent(content, text, filename) {
    if (text.length > 500 * 1024) {
        content.textContent = text + '\n\n[文件较大，未进行语法高亮]';
        return;
    }
    const lang = detectLang(filename);
    let result;
    if (lang && window.hljs && window.hljs.getLanguage(lang)) {
        result = window.hljs.highlight(text, { language: lang, ignoreIllegals: true });
    } else if (window.hljs) {
        result = window.hljs.highlightAuto(text);
    } else {
        content.textContent = text;
        return;
    }
    content.innerHTML = result.value;
    content.classList.add('hljs');
}

/* ============================================================
 * 编辑模式：进入 / 退出
 * ============================================================ */
function cmModeOf(filename) {
    const ext = getExt(filename);
    const map = {
        js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript',
        ts: 'javascript', tsx: 'javascript',
        json: 'application/json', json5: 'application/json',
        html: 'htmlmixed', htm: 'htmlmixed', xhtml: 'htmlmixed',
        vue: 'htmlmixed', svelte: 'htmlmixed',
        xml: 'xml', svg: 'xml',
        css: 'css', scss: 'css', less: 'css',
        md: 'markdown', markdown: 'markdown',
        py: 'python',
        sh: 'shell', bash: 'shell', zsh: 'shell',
        c: 'text/x-csrc', h: 'text/x-csrc',
        cpp: 'text/x-c++src', hpp: 'text/x-c++src', cc: 'text/x-c++src',
        java: 'text/x-java', cs: 'text/x-csharp',
        go: 'text/x-go', rs: 'text/x-rustsrc',
        sql: 'sql',
        yaml: 'yaml', yml: 'yaml',
        toml: 'toml', ini: 'properties'
    };
    return map[ext] || null;
}

function enterEditMode() {
    if (!viewerCurrentText) return;
    if (!window.CodeMirror) {
        showToast('编辑器未加载', 'error');
        return;
    }

    const content = document.getElementById('viewerContent');
    const toggleBtn = document.getElementById('viewerToggle');

    originalText = viewerCurrentText;
    content.innerHTML = '';
    content.className = 'viewer-content viewer-editor';
    content.classList.remove('hljs');

    const textarea = document.createElement('textarea');
    textarea.id = 'cmTextarea';
    content.appendChild(textarea);

    const mode = cmModeOf(viewerCurrentFile.displayName || '');
    cmEditor = window.CodeMirror.fromTextArea(textarea, {
        lineNumbers: true,
        mode: mode,
        theme: 'default',
        lineWrapping: true,
        indentUnit: 4,
        tabSize: 4,
        viewportMargin: Infinity
    });
    cmEditor.setValue(originalText);
    setTimeout(() => cmEditor.refresh(), 50);

    if (toggleBtn) {
        toggleBtn.textContent = '锁定';
        toggleBtn.classList.add('primary');
    }
}

async function exitEditMode(discard) {
    if (!cmEditor) return;
    const content = document.getElementById('viewerContent');

    try { cmEditor.toTextArea(); } catch (e) {}
    cmEditor = null;

    if (discard) {
        content.className = 'viewer-content';
        content.innerHTML = '';
        renderTextPreviewContent(content, originalText, viewerCurrentFile.displayName || '');
        viewerCurrentText = originalText;
    }
    originalText = null;
}
async function toggleEditMode() {
    const toggleBtn = document.getElementById('viewerToggle');

    if (cmEditor) {
        // 正在编辑 → 尝试保存（等价 Ctrl+S）
        await saveEditedText();
        // saveEditedText 成功会调 exitEditMode(false) 并恢复按钮
        return;
    }

    // 未编辑 → 进入编辑
    enterEditMode();
    if (toggleBtn) {
        toggleBtn.textContent = '锁定';
        toggleBtn.classList.add('primary');
    }
}

/* ============================================================
 * Markdown 预览
 * ============================================================ */

async function openMarkdownPreview(file) {
    viewerCurrentFile = file;
    const overlay = document.getElementById('textViewer');
    const title = document.getElementById('viewerTitle');
    const content = document.getElementById('viewerContent');

    title.textContent = file.displayName || file.file_name || 'Markdown 预览';
    content.className = 'viewer-content';
    content.style.fontSize = '';
    content.textContent = '加载中…';
    overlay.classList.add('show');

    try {
        const res = await fetch(file.file_url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const buf = await res.arrayBuffer();

        let text;
        try {
            text = new TextDecoder('utf-8', { fatal: true }).decode(buf);
        } catch (e) {
            try { text = new TextDecoder('gbk', { fatal: false }).decode(buf); }
            catch (e2) { text = new TextDecoder('utf-8', { fatal: false }).decode(buf); }
        }

        if (!window.marked) {
            content.textContent = text;
            return;
        }

        const html = window.marked.parse(text, { gfm: true, breaks: true });
        content.innerHTML = `<div class="md-body">${html}</div>`;

        if (window.hljs) {
            content.querySelectorAll('pre code').forEach(block => {
                try { window.hljs.highlightElement(block); } catch (e) { }
            });
        }
    } catch (err) {
        console.error('Markdown 渲染失败', err);
        content.textContent = 'Markdown 加载失败：' + err.message;
    }
}

/* ============================================================
 * 图片 / PDF / 视频 / 音频 / Office
 * ============================================================ */

async function openImagePreview(file) {
    const content = resetViewer(file);
    const currentURL = file.file_url;

    // 1. 同步命中内存缓存 → 立刻渲染（毫秒级）
    if (window.mediaCache && window.mediaCache.getSync) {
        const cached = window.mediaCache.getSync(currentURL);
        if (cached) {
            content.innerHTML = `<img class="viewer-image" src="${cached}" alt="">`;
            return;
        }
    }

    // 2. 未命中 → 直接用原 URL 渲染，浏览器会流式显示（边下边看）
    content.innerHTML = `
        <div class="viewer-img-wrap">
            <img class="viewer-image" src="${currentURL}" alt="">
            <div class="viewer-loading-tip" id="viewerLoadingTip">正在加载图片…</div>
        </div>`;
    const img = content.querySelector('img');
    const tip = content.querySelector('.viewer-loading-tip');

    const hideTip = () => { if (tip && tip.parentNode) tip.remove(); };
    img.addEventListener('load', hideTip);
    img.addEventListener('error', hideTip);

    // 3. 后台缓存 + 缓存完成后换 objectURL（避免再次请求）
    if (window.mediaCache && window.mediaCache.warmup) {
        window.mediaCache.warmup(currentURL).then(() => {
            const cached = window.mediaCache.getSync(currentURL);
            if (cached && viewerCurrentFile === file && img.isConnected) {
                img.src = cached;
            }
        }).catch(() => {});
    }
}

function openPdfPreview(file) {
    const content = resetViewer(file);
    content.innerHTML = `<iframe class="viewer-frame" src="${file.file_url}"></iframe>`;
}

function openVideoPreview(file) {
    const content = resetViewer(file);
    content.innerHTML = `<video class="viewer-video" src="${file.file_url}" controls preload="metadata"></video>`;
}

function openAudioPreview(file) {
    const content = resetViewer(file);
    content.innerHTML = `
        <div class="viewer-audio-wrap">
            <div class="viewer-audio-icon">🎵</div>
            <div class="viewer-audio-name">${escapeHtml(file.displayName || '')}</div>
            <audio class="viewer-audio" src="${file.file_url}" controls preload="metadata"></audio>
        </div>`;
}

function openOfficePreview(file) {
    const content = resetViewer(file);
    const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.file_url)}`;
    content.innerHTML = `
        <iframe class="viewer-frame" src="${viewerUrl}" allowfullscreen></iframe>
        <div class="viewer-hint">若长时间空白，说明该文件无法在线预览，请直接下载</div>`;
}

/* ============================================================
 * ZIP 预览
 * ============================================================ */

async function openZipViewer(file) {
    viewerCurrentFile = file;
    const overlay = document.getElementById('textViewer');
    const title = document.getElementById('viewerTitle');
    const content = document.getElementById('viewerContent');

    title.textContent = file.displayName || 'ZIP 预览';
    content.className = 'viewer-content';
    content.style.fontSize = '';
    content.textContent = '正在读取压缩包…';
    overlay.classList.add('show');

    try {
        const res = await fetch(file.file_url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const blob = await res.blob();

        const zip = await JSZip.loadAsync(blob);

        const entries = [];
        zip.forEach((relativePath, entry) => {
            const data = entry._data || {};
            entries.push({
                name: relativePath,
                dir: entry.dir,
                size: data.uncompressedSize || 0,
                compressed: data.compressedSize || 0
            });
        });

        // 建树
        const tree = { children: {}, files: [] };
        for (const e of entries) {
            const clean = e.name.replace(/\/+$/, '');
            if (!clean) continue;
            const parts = clean.split('/');
            if (e.dir) {
                let node = tree;
                for (const p of parts) {
                    if (!node.children[p]) node.children[p] = { children: {}, files: [] };
                    node = node.children[p];
                }
            } else {
                const filename = parts.pop();
                let node = tree;
                for (const p of parts) {
                    if (!node.children[p]) node.children[p] = { children: {}, files: [] };
                    node = node.children[p];
                }
                node.files.push({ ...e, name: filename });
            }
        }

        let fileCount = 0, folderCount = 0, totalSize = 0, totalCompressed = 0;
        (function walk(node) {
            for (const name of Object.keys(node.children)) {
                folderCount++;
                walk(node.children[name]);
            }
            for (const f of node.files) {
                fileCount++;
                totalSize += f.size;
                totalCompressed += f.compressed;
            }
        })(tree);

        const rows = [];
        (function walk(node, depth) {
            const folderNames = Object.keys(node.children).sort((a, b) => a.localeCompare(b, 'zh'));
            for (const name of folderNames) {
                rows.push({ dir: true, name, depth, size: 0, compressed: 0 });
                walk(node.children[name], depth + 1);
            }
            const files = node.files.slice().sort((a, b) => a.name.localeCompare(b.name, 'zh'));
            for (const f of files) {
                rows.push({ dir: false, name: f.name, depth, size: f.size, compressed: f.compressed });
            }
        })(tree, 0);

        let rowsHtml = '';
        for (const e of rows) {
            const icon = e.dir
                ? `<img src="${DEFAULT_FOLDER_ICON}" alt="">`
                : `<img src="${getFileIconUrl(e.name)}" alt="" onerror="this.onerror=null;this.src='${DEFAULT_FILE_ICON}'">`;
            const sizeText = e.dir ? '' : formatBytes(e.size);
            const ratio = (!e.dir && e.size > 0)
                ? ((1 - e.compressed / e.size) * 100).toFixed(0) + '%'
                : '';
            rowsHtml += `
                <tr>
                    <td class="zip-name" style="padding-left:${e.depth * 20 + 8}px">
                        <span class="zip-icon">${icon}</span>${escapeHtml(e.name)}
                    </td>
                    <td class="zip-size">${sizeText}</td>
                    <td class="zip-ratio">${ratio}</td>
                </tr>`;
        }

        const ratioTotal = totalSize > 0
            ? ((1 - totalCompressed / totalSize) * 100).toFixed(1) + '%'
            : '—';

        content.innerHTML = `
            <div class="zip-summary">
                <div><b>文件数</b>：${fileCount}</div>
                <div><b>文件夹数</b>：${folderCount}</div>
                <div><b>原始大小</b>：${formatBytes(totalSize)}</div>
                <div><b>压缩后</b>：${formatBytes(totalCompressed)}</div>
                <div><b>压缩率</b>：${ratioTotal}</div>
            </div>
            <table class="zip-table">
                <thead><tr><th>名称</th><th>大小</th><th>压缩率</th></tr></thead>
                <tbody>${rowsHtml}</tbody>
            </table>`;
    } catch (err) {
        console.error('ZIP 预览失败', err);
        content.textContent = 'ZIP 读取失败：' + err.message;
    }
}

/* ============================================================
 * HTML 预览
 * ============================================================ */
async function openHtmlPreview(file) {
    viewerCurrentFile = file;
    const overlay = document.getElementById('textViewer');
    const title = document.getElementById('viewerTitle');
    const content = document.getElementById('viewerContent');

    title.textContent = file.displayName || file.file_name || 'HTML 预览';
    content.className = 'viewer-content html-preview';
    content.style.fontSize = '';
    content.textContent = '加载中…';
    overlay.classList.add('show');

    try {
        const res = await fetch(file.file_url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const buf = await res.arrayBuffer();

        let html;
        try {
            html = new TextDecoder('utf-8', { fatal: true }).decode(buf);
        } catch (e) {
            try { html = new TextDecoder('gbk', { fatal: false }).decode(buf); }
            catch (e2) { html = new TextDecoder('utf-8', { fatal: false }).decode(buf); }
        }

        content.innerHTML = '';

        const iframe = document.createElement('iframe');
        // 不给 allow-same-origin → origin 变 null，无法访问父页面 cookie / storage
        iframe.setAttribute('sandbox', 'allow-scripts allow-popups allow-forms allow-modals');
        iframe.srcdoc = html;
        content.appendChild(iframe);
    } catch (err) {
        console.error('HTML 预览失败', err);
        content.className = 'viewer-content';
        content.textContent = 'HTML 加载失败：' + err.message;
    }
}

/* ============================================================
 * 未知类型：选择打开方式
 * ============================================================ */

async function openUnknownFile(file) {
    const label = file.displayName || file.file_name || '文件';
    const choice = await dlgChoose(
        '选择打开方式',
        label,
        [
            { label: '文本查看', value: 'text', primary: true },
            { label: '16进制查看', value: 'hex' },
            { label: '下载', value: 'download' }
        ]
    );
    if (choice === 'text') return openTextViewer(file);
    if (choice === 'hex') return openHexViewer(file);
    if (choice === 'download') return downloadFile(label, file.file_url);
}

async function chooseOpenMethod(file) {
    const label = file.displayName || file.file_name || '文件';
    const name = String(label).toLowerCase();
    const ext = getExt(name);

    const allMethods = [
        { label: '文本查看', value: 'text', icon: '📝' },
        { label: 'HTML 预览', value: 'html', icon: '🌐' },
        { label: 'Markdown 预览', value: 'md', icon: '📖' },
        { label: '16 进制查看', value: 'hex', icon: '🔢' },
        { label: '图片预览', value: 'image', icon: '🖼️' },
        { label: 'PDF 预览', value: 'pdf', icon: '📕' },
        { label: '视频播放', value: 'video', icon: '🎬' },
        { label: '音频播放', value: 'audio', icon: '🎵' },
        { label: 'Office 预览', value: 'office', icon: '📘' },
        { label: 'ZIP 查看', value: 'zip', icon: '📦' },
        { label: '下载', value: 'download', icon: '💾' }
    ];

    const matched = [];
    if (ext === 'html' || ext === 'htm') matched.push('html');
    if (ext === 'md' || ext === 'markdown') matched.push('md');
    if (isTextFile(name)) matched.push('text');
    if (isImageFile(name)) matched.push('image');
    if (isPdfFile(name)) matched.push('pdf');
    if (isVideoFile(name)) matched.push('video');
    if (isAudioFile(name)) matched.push('audio');
    if (isOfficeFile(name)) matched.push('office');
    if (isZipFile(name)) matched.push('zip');

    const opts = allMethods.map(m => ({ ...m, default: matched.includes(m.value) }));

    const choice = await dlgOpenWith('打开方式', label, opts);
    if (!choice) return;

    if (choice === 'text') return openTextViewer(file);
    if (choice === 'html') return openHtmlPreview(file);
    if (choice === 'md') return openMarkdownPreview(file);
    if (choice === 'hex') return openHexViewer(file);
    if (choice === 'image') return openImagePreview(file);
    if (choice === 'pdf') return openPdfPreview(file);
    if (choice === 'video') return openVideoPreview(file);
    if (choice === 'audio') return openAudioPreview(file);
    if (choice === 'office') return openOfficePreview(file);
    if (choice === 'zip') return openZipViewer(file);
    if (choice === 'download') return downloadFile(label, file.file_url);
}

/* ============================================================
 * 16 进制预览
 * ============================================================ */

async function openHexViewer(file) {
    viewerCurrentFile = file;
    const overlay = document.getElementById('textViewer');
    const title = document.getElementById('viewerTitle');
    const content = document.getElementById('viewerContent');

    title.textContent = file.displayName || file.file_name || 'HEX 预览';
    content.className = 'viewer-content';
    content.style.fontSize = '';
    content.textContent = '正在读取…';
    overlay.classList.add('show');

    try {
        const res = await fetch(file.file_url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const buf = await res.arrayBuffer();

        const MAX = 4 * 1024 * 1024;
        const truncated = buf.byteLength > MAX;
        const bytes = new Uint8Array(truncated ? buf.slice(0, MAX) : buf);

        content.innerHTML = renderHexDump(bytes);
        if (truncated) {
            content.insertAdjacentHTML('beforeend',
                `<div class="hex-hint">文件较大，仅显示前 ${formatBytes(MAX)}</div>`);
        }
    } catch (err) {
        console.error('HEX 预览失败', err);
        content.textContent = 'HEX 读取失败：' + err.message;
    }
}

function renderHexDump(bytes) {
    const total = bytes.length;
    const lines = [];

    for (let i = 0; i < total; i += 16) {
        const offset = i.toString(16).padStart(8, '0');
        const hexParts = [];
        for (let j = 0; j < 16; j++) {
            if (j === 8) hexParts.push('');
            if (i + j < total) hexParts.push(bytes[i + j].toString(16).padStart(2, '0'));
            else hexParts.push('  ');
        }
        let ascii = '';
        for (let j = 0; j < 16 && i + j < total; j++) {
            const c = bytes[i + j];
            ascii += (c >= 32 && c < 127) ? String.fromCharCode(c) : '.';
        }
        lines.push(
            `<div class="hex-line">` +
            `<span class="hex-offset">${offset}</span>` +
            `<span class="hex-bytes">${hexParts.join(' ')}</span>` +
            `<span class="hex-ascii">${escapeHtml(ascii)}</span>` +
            `</div>`
        );
    }

    return `<div class="hex-viewer">${lines.join('')}</div>`;
}


/* ============================================================
 * 不可见字符检测
 * ============================================================ */
function detectInvisibleChars(text) {
    if (!text) return [];
    const patterns = [
        { re: /\u200b/g, name: '零宽空格 (U+200B)' },
        { re: /\u200c/g, name: '零宽非连接符 (U+200C)' },
        { re: /\u200d/g, name: '零宽连接符 (U+200D)' },
        { re: /\ufeff/g, name: 'BOM (U+FEFF)' },
        { re: /\u00a0/g, name: '不换行空格 (U+00A0)' },
        { re: /\u200e/g, name: '左至右标记 (U+200E)' },
        { re: /\u200f/g, name: '右至左标记 (U+200F)' },
        { re: /\u202a/g, name: '左至右嵌入 (U+202A)' },
        { re: /\u202c/g, name: '弹出格式 (U+202C)' },
        { re: /\u2060/g, name: '词连接符 (U+2060)' },
        { re: /\u0000/g, name: '空字符 (U+0000)' }
    ];
    const found = [];
    for (const p of patterns) {
        const m = text.match(p.re);
        if (m) found.push(`${p.name} × ${m.length}`);
    }
    return found;
}

/* ============================================================
 * 保存编辑后的文本
 * ============================================================ */
async function saveEditedText() {
    if (!cmEditor || !viewerCurrentFile) return;
    const newText = cmEditor.getValue();
    const toggleBtn = document.getElementById('viewerToggle');

    // 1. 不可见字符检测
    const invis = detectInvisibleChars(newText);
    if (invis.length > 0) {
        const ok = await dlgConfirm(
            '检测到不可见字符',
            `文件中包含以下不可见字符：\n\n${invis.join('\n')}\n\n` +
            `继续保存可能影响文件内容。\n\n是否继续？`,
            true
        );
        if (!ok) return;
    }

    // 2. 无变化 → 直接退出编辑
    if (newText === originalText) {
        await exitEditMode(false);
        const content = document.getElementById('viewerContent');
        content.className = 'viewer-content';
        content.innerHTML = '';
        renderTextPreviewContent(content, newText, viewerCurrentFile.displayName || '');
        if (toggleBtn) {
            toggleBtn.textContent = '编辑';
            toggleBtn.classList.remove('primary');
        }
        showToast('内容未变化', 'info');
        return;
    }

    // 3. 乐观锁
    const storagePath = viewerCurrentFile.storage_path;
    if (storagePath) {
        try {
            const { data: listData } = await sb.storage
                .from('public_netdisk')
                .list('', { search: storagePath, limit: 10 });
            const remote = (listData || []).find(o => o.name === storagePath);
            if (remote) {
                const remoteTime = remote.updated_at || remote.created_at;
                const localTime = viewerCurrentFile._mtime;
                if (localTime && remoteTime && new Date(remoteTime) > new Date(localTime)) {
                    const ok = await dlgConfirm(
                        '文件已被他人修改',
                        '该文件在你打开后已被修改。\n\n覆盖后对方的改动会丢失。\n\n是否覆盖？',
                        true
                    );
                    if (!ok) return;
                }
            }
        } catch (e) {
            console.warn('乐观锁检查失败', e);
        }
    }

    // 4. 上传
    if (toggleBtn) { toggleBtn.disabled = true; toggleBtn.textContent = '保存中…'; }

    try {
        const blob = new Blob([newText], { type: 'text/plain; charset=utf-8' });
        const { error } = await sb.storage
            .from('public_netdisk')
            .upload(storagePath, blob, { upsert: true, contentType: 'text/plain; charset=utf-8' });
        if (error) throw error;

        viewerCurrentFile._mtime = new Date().toISOString();
        viewerCurrentText = newText;

        await exitEditMode(false);
        const content = document.getElementById('viewerContent');
        content.className = 'viewer-content';
        content.innerHTML = '';
        renderTextPreviewContent(content, newText, viewerCurrentFile.displayName || '');

        if (toggleBtn) {
            toggleBtn.disabled = false;
            toggleBtn.textContent = '编辑';
            toggleBtn.classList.remove('primary');
        }
        showToast('已保存', 'success');

        if (typeof loadFiles === 'function') {
            setTimeout(() => loadFiles(true), 500);
        }
    } catch (e) {
        if (toggleBtn) {
            toggleBtn.disabled = false;
            toggleBtn.textContent = '锁定';
        }
        await dlgAlert('保存失败', e.message || String(e));
    }
}
