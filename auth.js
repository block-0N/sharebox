// Supabase信息
const SUPABASE_URL = "https://ekphociqviwojbonbcbd.supabase.co";
const ANON_KEY = "sb_publishable_ebvcoe-OiDqlZJTkIsvZ1g_KsDf4sSU";
const sb = window.supabase.createClient(SUPABASE_URL, ANON_KEY);
/* ============================================================
 * 文件图标（vscode-icons）
 * ============================================================ */

const VSC_ICON_CDN = 'https://cdn.jsdelivr.net/gh/vscode-icons/vscode-icons@master/icons/';
const DEFAULT_FILE_ICON = VSC_ICON_CDN + 'default_file.svg';
const DEFAULT_FOLDER_ICON = VSC_ICON_CDN + 'default_folder.svg';

/** 扩展名 → vscode-icons 文件名 */
const FILE_ICON_SVG_MAP = {
    // 脚本 / 编程语言
    js: 'file_type_js.svg',
    mjs: 'file_type_js.svg',
    cjs: 'file_type_js.svg',
    jsx: 'file_type_reactjs.svg',
    ts: 'file_type_typescript.svg',
    tsx: 'file_type_reactts.svg',
    py: 'file_type_python.svg',
    java: 'file_type_java.svg',
    c: 'file_type_c.svg',
    h: 'file_type_c.svg',
    cpp: 'file_type_cpp.svg',
    hpp: 'file_type_cpp.svg',
    cc: 'file_type_cpp.svg',
    cs: 'file_type_csharp.svg',
    go: 'file_type_go.svg',
    rs: 'file_type_rust.svg',
    rb: 'file_type_ruby.svg',
    php: 'file_type_php.svg',
    swift: 'file_type_swift.svg',
    kt: 'file_type_kotlin.svg',
    kts: 'file_type_kotlin.svg',
    scala: 'file_type_scala.svg',
    lua: 'file_type_lua.svg',
    dart: 'file_type_dartlang.svg',
    r: 'file_type_r.svg',
    pl: 'file_type_perl.svg',
    jl: 'file_type_julia.svg',
    zig: 'file_type_zig.svg',
    nim: 'file_type_nim.svg',
    // Shell
    sh: 'file_type_shell.svg',
    bash: 'file_type_shell.svg',
    zsh: 'file_type_shell.svg',
    ps1: 'file_type_powershell.svg',
    bat: 'file_type_bat.svg',
    cmd: 'file_type_bat.svg',
    // Web
    html: 'file_type_html.svg',
    htm: 'file_type_html.svg',
    css: 'file_type_css.svg',
    scss: 'file_type_scss.svg',
    less: 'file_type_less.svg',
    vue: 'file_type_vue.svg',
    svelte: 'file_type_svelte.svg',
    // 数据 / 配置
    json: 'file_type_json.svg',
    json5: 'file_type_json.svg',
    yaml: 'file_type_yaml.svg',
    yml: 'file_type_yaml.svg',
    toml: 'file_type_toml.svg',
    ini: 'file_type_ini.svg',
    conf: 'file_type_config.svg',
    cfg: 'file_type_config.svg',
    env: 'file_type_dotenv.svg',
    properties: 'file_type_config.svg',
    lock: 'file_type_lock.svg',
    xml: 'file_type_xml.svg',
    svg: 'file_type_svg.svg',
    sql: 'file_type_sql.svg',
    db: 'file_type_sql.svg',
    sqlite: 'file_type_sql.svg',
    graphql: 'file_type_graphql.svg',
    gql: 'file_type_graphql.svg',
    proto: 'file_type_proto.svg',
    // 文档 / 文本
    md: 'file_type_markdown.svg',
    markdown: 'file_type_markdown.svg',
    txt: 'file_type_text.svg',
    log: 'file_type_log.svg',
    rst: 'file_type_rst.svg',
    tex: 'file_type_tex.svg',
    pdf: 'file_type_pdf.svg',
    doc: 'file_type_word.svg',
    docx: 'file_type_word.svg',
    xls: 'file_type_excel.svg',
    xlsx: 'file_type_excel.svg',
    csv: 'file_type_excel.svg',
    tsv: 'file_type_excel.svg',
    ppt: 'file_type_powerpoint.svg',
    pptx: 'file_type_powerpoint.svg',
    // 图片
    png: 'file_type_image.svg',
    jpg: 'file_type_image.svg',
    jpeg: 'file_type_image.svg',
    gif: 'file_type_image.svg',
    webp: 'file_type_image.svg',
    bmp: 'file_type_image.svg',
    ico: 'file_type_image.svg',
    tif: 'file_type_image.svg',
    tiff: 'file_type_image.svg',
    psd: 'file_type_photoshop.svg',
    ai: 'file_type_ai.svg',
    // 音频 / 视频
    mp3: 'file_type_audio.svg',
    wav: 'file_type_audio.svg',
    flac: 'file_type_audio.svg',
    ogg: 'file_type_audio.svg',
    m4a: 'file_type_audio.svg',
    aac: 'file_type_audio.svg',
    mp4: 'file_type_video.svg',
    avi: 'file_type_video.svg',
    mov: 'file_type_video.svg',
    mkv: 'file_type_video.svg',
    webm: 'file_type_video.svg',
    flv: 'file_type_video.svg',
    wmv: 'file_type_video.svg',
    // 压缩包
    zip: 'file_type_zip.svg',
    rar: 'file_type_zip.svg',
    '7z': 'file_type_zip.svg',
    tar: 'file_type_zip.svg',
    gz: 'file_type_zip.svg',
    bz2: 'file_type_zip.svg',
    xz: 'file_type_zip.svg',
    iso: 'file_type_iso.svg',
    // 可执行 / 安装包
    exe: 'file_type_exe.svg',
    msi: 'file_type_exe.svg',
    dmg: 'file_type_dmg.svg',
    apk: 'file_type_android.svg',
    deb: 'file_type_debian.svg',
    rpm: 'file_type_redhat.svg',
    // 字体
    ttf: 'file_type_font.svg',
    otf: 'file_type_font.svg',
    woff: 'file_type_font.svg',
    woff2: 'file_type_font.svg',
    eot: 'file_type_font.svg',
};

/**
 * 根据文件名返回图标 URL
 * @param {string} filename
 * @returns {string}
 */
function getFileIconUrl(filename) {
    const name = String(filename || '').toLowerCase();
    const idx = name.lastIndexOf('.');
    if (idx === -1 || idx === 0) return DEFAULT_FILE_ICON;
    const ext = name.slice(idx + 1);
    const file = FILE_ICON_SVG_MAP[ext];
    return file ? VSC_ICON_CDN + file : DEFAULT_FILE_ICON;
}
/* ============================================================
 * 文本查看器
 * ============================================================ */
/** 扩展名 → highlight.js 语言名 */
const HLJS_LANG_MAP = {
    md: 'markdown', markdown: 'markdown',
    txt: 'plaintext', log: 'plaintext',
    json: 'json', json5: 'json',
    xml: 'xml', html: 'xml', htm: 'xml', svg: 'xml',
    vue: 'xml', svelte: 'xml',
    css: 'css', scss: 'scss', less: 'less',
    js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    py: 'python', java: 'java',
    c: 'c', h: 'c', cpp: 'cpp', hpp: 'cpp', cc: 'cpp',
    cs: 'csharp', go: 'go', rs: 'rust', rb: 'ruby', php: 'php',
    sh: 'bash', bash: 'bash', zsh: 'bash',
    bat: 'dos', cmd: 'dos', ps1: 'powershell',
    yaml: 'yaml', yml: 'yaml',
    toml: 'ini', ini: 'ini', conf: 'ini', cfg: 'ini',
    sql: 'sql', csv: 'plaintext', tsv: 'plaintext',
    lua: 'lua', dart: 'dart', swift: 'swift',
    kt: 'kotlin', kts: 'kotlin', scala: 'scala',
    r: 'r', pl: 'perl', tex: 'latex',
    graphql: 'graphql', gql: 'graphql', proto: 'protobuf',
    asm: 'x86asm', vb: 'vbnet', pas: 'delphi', f90: 'fortran',
    jl: 'julia', nim: 'nim', zig: 'zig',
    srt: 'plaintext', vtt: 'plaintext'
};

/** 根据文件名推断 highlight.js 语言 */
function detectLang(filename) {
    const name = String(filename || '').toLowerCase();
    const idx = name.lastIndexOf('.');
    if (idx === -1 || idx === 0) return null;
    return HLJS_LANG_MAP[name.slice(idx + 1)] || null;
}
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
    content.className = 'viewer-content';       // 重置 class
    content.textContent = '加载中…';
    overlay.classList.add('show');

    try {
        const res = await fetch(file.file_url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const buf = await res.arrayBuffer();
        const text = new TextDecoder('utf-8', { fatal: false }).decode(buf);

        // 大文件不高亮，避免卡顿
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
 * 其他预览类型判断
 * ============================================================ */

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico', 'avif']);
const VIDEO_EXTS = new Set(['mp4', 'webm', 'ogg', 'ogv', 'mov', 'mkv', 'm4v']);
const AUDIO_EXTS = new Set(['mp3', 'wav', 'ogg', 'oga', 'flac', 'm4a', 'aac', 'opus']);
const OFFICE_EXTS = new Set(['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']);

function getExt(filename) {
    const name = String(filename || '').toLowerCase();
    const idx = name.lastIndexOf('.');
    if (idx === -1 || idx === 0) return '';
    return name.slice(idx + 1);
}

function isImageFile(filename) { return IMAGE_EXTS.has(getExt(filename)); }
function isVideoFile(filename) { return VIDEO_EXTS.has(getExt(filename)); }
function isAudioFile(filename) { return AUDIO_EXTS.has(getExt(filename)); }
function isPdfFile(filename) { return getExt(filename) === 'pdf'; }
function isOfficeFile(filename) { return OFFICE_EXTS.has(getExt(filename)); }

/**
 * 判断文件是否可以预览
 */
function canPreviewFile(filename) {
    return isTextFile(filename) || isZipFile(filename) ||
        isImageFile(filename) || isVideoFile(filename) ||
        isAudioFile(filename) || isPdfFile(filename) ||
        isOfficeFile(filename);
}
/* ============================================================
 * ZIP 预览
 * ============================================================ */

/** 判断是否是 zip */
function isZipFile(filename) {
    const name = String(filename || '').toLowerCase();
    return name.endsWith('.zip') || name.endsWith('.jar') ||
           name.endsWith('.apk') || name.endsWith('.epub');
}

/**
 * 格式化字节
 * @param {number} bytes
 */
function formatBytes(bytes) {
    if (!bytes || bytes < 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let n = bytes;
    while (n >= 1024 && i < units.length - 1) {
        n /= 1024;
        i++;
    }
    return `${n.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

/**
 * 打开 zip 预览
 * @param {{displayName: string, file_url: string}} file
 */
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

        // ---------- 1. 收集所有条目 ----------
        /** @type {Array<{name:string, dir:boolean, size:number, compressed:number}>} */
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

        // ---------- 2. 建树（自动补全中间目录） ----------
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

        // ---------- 3. 统计 ----------
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

        // ---------- 4. 前序展开成平铺列表（带 depth） ----------
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

        // ---------- 5. 渲染 ----------
        let rowsHtml = '';
        for (const e of rows) {
            const icon = e.dir ? '📁' : '📄';
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
                <thead>
                    <tr>
                        <th>名称</th>
                        <th>大小</th>
                        <th>压缩率</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        `;
    } catch (err) {
        console.error('ZIP 预览失败', err);
        content.textContent = 'ZIP 读取失败：' + err.message;
    }
}
/* ============================================================
 * 各类型预览
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

/** 图片预览 */
function openImagePreview(file) {
    const content = resetViewer(file);
    content.innerHTML = `<img class="viewer-image" src="${file.file_url}" alt="">`;
}

/** PDF 预览（浏览器原生） */
function openPdfPreview(file) {
    const content = resetViewer(file);
    content.innerHTML = `<iframe class="viewer-frame" src="${file.file_url}"></iframe>`;
}

/** 视频预览 */
function openVideoPreview(file) {
    const content = resetViewer(file);
    content.innerHTML = `<video class="viewer-video" src="${file.file_url}" controls preload="metadata"></video>`;
}

/** 音频预览 */
function openAudioPreview(file) {
    const content = resetViewer(file);
    content.innerHTML = `
        <div class="viewer-audio-wrap">
            <div class="viewer-audio-icon">🎵</div>
            <div class="viewer-audio-name">${escapeHtml(file.displayName || '')}</div>
            <audio class="viewer-audio" src="${file.file_url}" controls preload="metadata"></audio>
        </div>`;
}

/** Office 预览（微软在线查看器） */
function openOfficePreview(file) {
    const content = resetViewer(file);
    const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.file_url)}`;
    content.innerHTML = `
        <iframe class="viewer-frame" src="${viewerUrl}"
                allowfullscreen></iframe>
        <div class="viewer-hint">若长时间空白，说明该文件无法在线预览，请直接下载</div>`;
}

/** 统一入口 */
function openPreview(file) {
    const name = file.displayName || file.file_name || '';
    if (isZipFile(name)) return openZipViewer(file);
    if (isTextFile(name)) return openTextViewer(file);
    if (isImageFile(name)) return openImagePreview(file);
    if (isPdfFile(name)) return openPdfPreview(file);
    if (isVideoFile(name)) return openVideoPreview(file);
    if (isAudioFile(name)) return openAudioPreview(file);
    if (isOfficeFile(name)) return openOfficePreview(file);
    downloadFile(name, file.file_url);
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
            <span class="fe-icon"><img src="${DEFAULT_FOLDER_ICON}" alt=""></span>
            <span class="fe-name">${escapeHtml(name)}</span>
            <span class="fe-actions">
                <button class="fe-btn" data-action="zip" type="button">打包</button>
                <button class="fe-btn del" data-action="del-folder" type="button">删除</button>
            </span>
        </div>`;
    }

    for (const file of files) {
        const canOpen = canPreviewFile(file.displayName);
        const openBtn = canOpen
            ? `<button class="fe-btn" data-action="open" type="button">打开</button>`
            : '';
        html += `
    <div class="fe-item fe-file"
         data-type="file"
         data-name="${escapeHtml(file.displayName)}"
         data-id="${escapeHtml(file.id)}"
         data-path="${escapeHtml(file.storage_path)}">
        <span class="fe-icon"><img src="${getFileIconUrl(file.displayName)}" alt=""
        onerror="this.onerror=null;this.src='${DEFAULT_FILE_ICON}'"></span>
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
                if (file) openPreview(file);
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
        if (canPreviewFile(file.displayName)) {
            openPreview(file);
        } else {
            downloadFile(file.displayName, file.file_url);
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