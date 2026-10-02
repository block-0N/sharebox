/* ============================================================
 * 预览总入口
 * ============================================================ */

/** 当前查看器打开的文件对象 */
let viewerCurrentFile = null;

/**
 * 统一入口
 */
function openPreview(file) {
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
}

function closeTextViewer() {
    document.getElementById('textViewer').classList.remove('show');
    viewerCurrentFile = null;
}

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
            const ok = await copyToClipboard(content);
            if (!ok) throw new Error('剪贴板写入失败');
            const old = btn.textContent;
            btn.textContent = '已复制';
            setTimeout(() => { btn.textContent = old; }, 1000);
        } catch (err) {
            console.error('复制失败', err);
            await dlgAlert('复制失败', '可能浏览器未授予剪贴板权限');
        }
    });
    document.getElementById('viewerShare').addEventListener('click', async () => {
        if (!viewerCurrentFile) return;
        const url = viewerCurrentFile.file_url;
        if (!url) {
            await dlgAlert('无法分享', '该文件没有可用的分享链接');
            return;
        }
        try {
            const ok = await copyToClipboard(url);
            if (!ok) throw new Error('剪贴板写入失败');
            const btn = document.getElementById('viewerShare');
            const old = btn.textContent;
            btn.textContent = '✓ 已复制';
            setTimeout(() => { btn.textContent = old; }, 1200);
            showToast('分享链接已复制到剪贴板', 'success');
        } catch (err) {
            console.error('复制分享链接失败', err);
            await dlgAlert('复制失败', '可能浏览器未授予剪贴板权限');
        }
    });
    overlay.addEventListener('click', e => {
        if (e.target === overlay) closeTextViewer();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && overlay.classList.contains('show')) closeTextViewer();
    });
}

/* ============================================================
 * 文本预览
 * ============================================================ */

async function openTextViewer(file) {
    viewerCurrentFile = file;
    const overlay = document.getElementById('textViewer');
    const title = document.getElementById('viewerTitle');
    const content = document.getElementById('viewerContent');

    title.textContent = file.displayName || file.file_name || '文件预览';
    content.className = 'viewer-content';
    content.textContent = '加载中…';
    overlay.classList.add('show');

    try {
        const res = await fetch(file.file_url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const buf = await res.arrayBuffer();

        // UTF-8 → GBK 兜底
        let text;
        try {
            text = new TextDecoder('utf-8', { fatal: true }).decode(buf);
        } catch (e) {
            try { text = new TextDecoder('gbk', { fatal: false }).decode(buf); }
            catch (e2) { text = new TextDecoder('utf-8', { fatal: false }).decode(buf); }
        }

        if (text.length > 500 * 1024) {
            content.textContent = text + '\n\n[文件较大，未进行语法高亮]';
            return;
        }

        const lang = detectLang(file.displayName);
        let result;
        if (lang && window.hljs.getLanguage(lang)) {
            result = window.hljs.highlight(text, { language: lang, ignoreIllegals: true });
        } else {
            result = window.hljs.highlightAuto(text);
        }
        content.innerHTML = result.value;
        content.classList.add('hljs');
    } catch (err) {
        console.error('读取文件失败', err);
        content.textContent = '加载失败：' + err.message;
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
