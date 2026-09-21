// Supabase信息
const SUPABASE_URL = "https://ekphociqviwojbonbcbd.supabase.co";
const ANON_KEY = "sb_publishable_ebvcoe-OiDqlZJTkIsvZ1g_KsDf4sSU";
const sb = window.supabase.createClient(SUPABASE_URL, ANON_KEY);
/** 文件夹占位文件名 */
const FOLDER_PLACEHOLDER = '.gitkeep';
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
    apk: 'file_type_exe.svg',
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

        // 先尝试严格 UTF-8，失败则回退 GBK
        let text;
        try {
            text = new TextDecoder('utf-8', { fatal: true }).decode(buf);
        } catch (e) {
            // 非法 UTF-8 序列 → 大概率是 GBK
            try {
                text = new TextDecoder('gbk', { fatal: false }).decode(buf);
            } catch (e2) {
                // 连 GBK 都不支持就退回宽松 UTF-8
                text = new TextDecoder('utf-8', { fatal: false }).decode(buf);
            }
        }

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
            await dlgAlert('复制失败，可能浏览器未授予剪贴板权限');
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
    return openUnknownFile(file);
}
/**
 * 手动选择打开方式（右键「打开方式」）
 * @param {{displayName?: string, file_name?: string, file_url: string}} file
 */
async function chooseOpenMethod(file) {
    const label = file.displayName || file.file_name || '文件';
    const name = String(label).toLowerCase();

    // 按文件类型给出可选方式
    const opts = [];

    // 大部分文本/图片/音频/视频/pdf/office/zip 都可以尝试文本查看
    opts.push({ label: '文本查看', value: 'text' });

    // 16 进制对所有文件都适用
    opts.push({ label: '16进制查看', value: 'hex', primary: true });

    if (isImageFile(name)) opts.push({ label: '图片预览', value: 'image' });
    if (isPdfFile(name)) opts.push({ label: 'PDF 预览', value: 'pdf' });
    if (isVideoFile(name)) opts.push({ label: '视频播放', value: 'video' });
    if (isAudioFile(name)) opts.push({ label: '音频播放', value: 'audio' });
    if (isOfficeFile(name)) opts.push({ label: 'Office 预览', value: 'office' });
    if (isZipFile(name)) opts.push({ label: 'ZIP 查看', value: 'zip' });

    opts.push({ label: '下载', value: 'download' });

    const choice = await dlgChoose('选择打开方式', label, opts);
    if (choice === 'text') return openTextViewer(file);
    if (choice === 'hex') return openHexViewer(file);
    if (choice === 'image') return openImagePreview(file);
    if (choice === 'pdf') return openPdfPreview(file);
    if (choice === 'video') return openVideoPreview(file);
    if (choice === 'audio') return openAudioPreview(file);
    if (choice === 'office') return openOfficePreview(file);
    if (choice === 'zip') return openZipViewer(file);
    if (choice === 'download') return downloadFile(label, file.file_url);
}
/**
 * 未知类型：让用户选择打开方式
 * @param {{displayName?: string, file_name?: string, file_url: string}} file
 */
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

/**
 * 16 进制查看
 * @param {{displayName?: string, file_name?: string, file_url: string}} file
 */
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

        const MAX = 4 * 1024 * 1024;   // 4MB 上限
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

/**
 * 生成 16 进制 dump 的 HTML
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function renderHexDump(bytes) {
    const total = bytes.length;
    const lines = [];

    for (let i = 0; i < total; i += 16) {
        const offset = i.toString(16).padStart(8, '0');

        // hex 部分，每 8 字节插个空格分隔
        const hexParts = [];
        for (let j = 0; j < 16; j++) {
            if (j === 8) hexParts.push('');
            if (i + j < total) hexParts.push(bytes[i + j].toString(16).padStart(2, '0'));
            else hexParts.push('  ');
        }

        // ASCII 部分
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
 * 通用工具
 * ============================================================ */
/**
 * 深色模式切换（不持久化）
 */
function initThemeToggle() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const dark = document.body.classList.toggle('dark');
        btn.textContent = dark ? '☀️ 浅色' : '🌙 深色';

        // 切换 highlight.js 主题
        const light = document.getElementById('hljsLight');
        const darkLink = document.getElementById('hljsDark');
        if (light) light.media = dark ? 'not all' : 'all';
        if (darkLink) darkLink.media = dark ? 'all' : 'not all';
    });
}
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
 * 通用弹窗
 * ============================================================ */

/**
 * 打开弹窗，Promise 返回结果
 * @param {object} opts
 * @param {string} [opts.title]
 * @param {string} [opts.message]
 * @param {boolean} [opts.showInput]
 * @param {string} [opts.defaultValue]
 * @param {boolean} [opts.showCancel] 默认 true
 * @param {boolean} [opts.danger]
 * @param {string} [opts.okText]
 * @returns {Promise<any>} alert→true, confirm→bool, prompt→string|null
 */
function _openDialog(opts) {
    return new Promise(resolve => {
        const overlay = document.getElementById('dialog');
        const titleEl = document.getElementById('dialogTitle');
        const msgEl = document.getElementById('dialogMessage');
        const inputEl = document.getElementById('dialogInput');
        const okBtn = document.getElementById('dialogOk');
        const cancelBtn = document.getElementById('dialogCancel');

        titleEl.textContent = opts.title || '';
        msgEl.textContent = opts.message || '';

        const isPrompt = !!opts.showInput;
        inputEl.style.display = isPrompt ? 'block' : 'none';
        if (isPrompt) inputEl.value = opts.defaultValue || '';

        cancelBtn.style.display = opts.showCancel === false ? 'none' : '';

        okBtn.textContent = opts.okText || '确定';
        okBtn.className = 'dialog-btn ' + (opts.danger ? 'danger' : 'primary');

        overlay.classList.add('show');
        if (isPrompt) {
            setTimeout(() => { inputEl.focus(); inputEl.select(); }, 50);
        }

        const cleanup = () => {
            overlay.classList.remove('show');
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            overlay.removeEventListener('click', onOverlay);
            document.removeEventListener('keydown', onKey);
            inputEl.removeEventListener('keydown', onInputKey);
        };

        const done = (result) => { cleanup(); resolve(result); };
        const onOk = () => done(isPrompt ? inputEl.value : true);
        const onCancel = () => done(isPrompt ? null : false);
        const onOverlay = (e) => { if (e.target === overlay) onCancel(); };
        const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
        const onInputKey = (e) => {
            if (e.key === 'Enter') { e.preventDefault(); onOk(); }
        };

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        overlay.addEventListener('click', onOverlay);
        document.addEventListener('keydown', onKey);
        if (isPrompt) inputEl.addEventListener('keydown', onInputKey);
    });
}

/** 提示 */
function dlgAlert(title, message, okText) {
    return _openDialog({ title, message, okText: okText || '好', showCancel: false });
}

/** 确认，返回 boolean */
function dlgConfirm(title, message, danger) {
    return _openDialog({ title, message, danger: !!danger });
}

/** 输入，返回 string | null */
function dlgPrompt(title, message, defaultValue) {
    return _openDialog({ title, message, defaultValue, showInput: true });
}
/**
 * 多选项弹窗
 * @param {string} title
 * @param {string} message
 * @param {Array<{label:string, value:any, primary?:boolean, danger?:boolean}>} options
 * @returns {Promise<any>} 选中的 value 或 null（取消）
 */
function dlgChoose(title, message, options) {
    return new Promise(resolve => {
        const overlay = document.getElementById('dialog');
        const titleEl = document.getElementById('dialogTitle');
        const msgEl = document.getElementById('dialogMessage');
        const inputEl = document.getElementById('dialogInput');
        const okBtn = document.getElementById('dialogOk');
        const cancelBtn = document.getElementById('dialogCancel');
        const actions = cancelBtn.parentElement;

        const prevInput = inputEl.style.display;
        const prevOk = okBtn.style.display;
        const prevCancel = cancelBtn.style.display;

        titleEl.textContent = title || '';
        msgEl.textContent = message || '';
        inputEl.style.display = 'none';
        okBtn.style.display = 'none';
        cancelBtn.style.display = 'none';

        const dynBtns = [];
        for (const opt of options) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'dialog-btn ' + (opt.danger ? 'danger' : (opt.primary ? 'primary' : ''));
            btn.textContent = opt.label;
            actions.appendChild(btn);
            dynBtns.push({ btn, opt });
        }

        const cleanup = () => {
            overlay.classList.remove('show');
            dynBtns.forEach(({ btn }) => btn.remove());
            inputEl.style.display = prevInput;
            okBtn.style.display = prevOk;
            cancelBtn.style.display = prevCancel;
            overlay.removeEventListener('click', onOverlay);
            document.removeEventListener('keydown', onKey);
        };

        const finish = (value) => { cleanup(); resolve(value); };

        dynBtns.forEach(({ btn, opt }) => {
            btn.addEventListener('click', () => finish(opt.value));
        });

        const onOverlay = (e) => { if (e.target === overlay) finish(null); };
        const onKey = (e) => { if (e.key === 'Escape') finish(null); };

        overlay.addEventListener('click', onOverlay);
        document.addEventListener('keydown', onKey);

        overlay.classList.add('show');
    });
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
        await dlgAlert("消息加载错误：" + error.message);
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
        await dlgAlert("发送失败：" + error.message);
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
 * 网盘 - Storage 元数据（大小 / 修改时间）
 * ============================================================ */

/** storage_path → { size, updatedAt } */
let storageMeta = {};

/**
 * 拉取 storage 里所有对象的元数据（分页）
 */
async function fetchStorageMeta() {
    const bucket = 'public_netdisk';
    const pageSize = 100;
    const maxPages = 10;   // 最多 1000 个对象，够个人测试
    const map = {};

    for (let page = 0; page < maxPages; page++) {
        const { data, error } = await sb.storage.from(bucket).list('', {
            limit: pageSize,
            offset: page * pageSize,
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
    }
    return map;
}

/**
 * 时间格式化
 * @param {string|Date|null} t
 * @returns {string}
 */
function formatTime(t) {
    if (!t) return '';
    const d = t instanceof Date ? t : new Date(t);
    if (isNaN(d.getTime())) return '';
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 递归计算文件夹汇总大小 / 最新修改时间
 * 结果写到节点上：_totalSize、_latestMtime
 * @param {any} node
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
/* ============================================================
 * 网盘 - 状态与树结构
 * ============================================================ */
/** 排序字段：'name' | 'size' | 'type' | 'mtime' */
let sortKey = 'name';
/** 是否递增 */
let sortAsc = true;
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

        // 先建父目录链
        let node = tree;
        for (const p of parts) {
            if (!node._children[p]) node._children[p] = { _files: {}, _children: {} };
            node = node._children[p];
        }

        // 占位文件：父目录已创建，到此为止
        if (filename === FOLDER_PLACEHOLDER) continue;

        // 正常文件：挂到 node
        const meta = storageMeta[item.storage_path] || {};
        node._files[filename] = {
            ...item,
            displayName: filename,
            _size: meta.size ?? 0,
            _mtime: meta.updatedAt || item.created_at || null
        };
    }
    // 汇总每个文件夹的大小 / 修改时间
    computeFolderStats(tree);
    return tree;
}

/**
 * 加载文件列表并重建树
 */
async function loadFiles() {
    const [listRes, metaMap] = await Promise.all([
        sb.from("file_list").select("*").order("created_at", { desc: true }),
        fetchStorageMeta()
    ]);
    if (listRes.error) {
        console.error("文件列表加载失败", listRes.error);
        return;
    }
    storageMeta = metaMap;
    fileTree = buildTree(listRes.data || []);
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
    // 搜索模式
    if (searchQuery) {
        renderSearchResults(wrap, searchQuery);
        wrap.scrollTop = 0;
        return;
    }
    const node = getNodeByPath(currentPath);
    if (!node) {
        wrap.innerHTML = `<div class="nofile">文件夹不存在</div>`;
        return;
    }

    const folders = Object.keys(node._children).sort((a, b) => {
        const na = node._children[a];
        const nb = node._children[b];
        let v = 0;
        if (sortKey === 'name') {
            v = a.localeCompare(b, 'zh');
        } else if (sortKey === 'size') {
            v = (na._totalSize || 0) - (nb._totalSize || 0);
        } else if (sortKey === 'type') {
            v = a.localeCompare(b, 'zh');
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
            <span class="fe-meta fe-size">${sizeText}</span>
            <span class="fe-meta fe-mtime">${mtimeText}</span>
            <span class="fe-actions">
                <button class="fe-btn" data-action="zip" type="button">打包</button>
                <button class="fe-btn del" data-action="del-folder" type="button">删除</button>
            </span>
        </div>`;
    }

    for (const file of files) {
        const openBtn = `<button class="fe-btn" data-action="open" type="button">打开</button>`;
        const sizeText = formatBytes(file._size || 0);
        const mtimeText = formatTime(file._mtime);
        html += `
    <div class="fe-item fe-file"
         data-type="file"
         data-name="${escapeHtml(file.displayName)}"
         data-id="${escapeHtml(file.id)}"
         data-path="${escapeHtml(file.storage_path)}">
        <span class="fe-icon"><img src="${getFileIconUrl(file.displayName)}" alt=""
        onerror="this.onerror=null;this.src='${DEFAULT_FILE_ICON}'"></span>
        <span class="fe-name">${escapeHtml(file.displayName)}</span>
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
        if (suppressNextClick) return;

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
    });

    // 双击：进入文件夹 / 下载文件
    list.addEventListener("dblclick", e => {
        if (suppressNextClick) return;
        const item = e.target.closest(".fe-item");
        if (!item) return;
        if (item.dataset.type === "folder") {
            currentPath.push(item.dataset.name);
            renderExplorer();
            return;
        }
        const file = findFileByStoragePath(item.dataset.path);
        if (!file) return;
        openPreview(file);
    });

    // 面包屑点击
    bar.addEventListener("click", e => {
        const crumb = e.target.closest(".crumb");
        if (!crumb) return;
        const idx = parseInt(crumb.dataset.idx, 10);
        currentPath = currentPath.slice(0, idx + 1);

        // 清空搜索
        if (searchQuery) {
            searchQuery = '';
            const input = document.getElementById('searchInput');
            if (input) input.value = '';
        }
        renderExplorer();
    });

    // 上一级
    upBtn.addEventListener("click", () => {
        if (currentPath.length === 0) return;
        currentPath.pop();

        if (searchQuery) {
            searchQuery = '';
            const input = document.getElementById('searchInput');
            if (input) input.value = '';
        }
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
    const ok = await dlgConfirm('删除文件', '确定删除该文件？', true);
    if (!ok) return;
    const { error: dbErr } = await sb.from("file_list").delete().eq("id", rowId);
    if (dbErr) { console.error("删除记录失败", dbErr); await dlgAlert("删除失败"); return; }
    const { error: stErr } = await sb.storage.from("public_netdisk").remove([storagePath]);
    if (stErr) { console.error("删除存储失败", stErr); }
    loadFiles();
}

/**
 * 删除文件夹（rAF 平滑进度，5 个一批）
 * @param {string} folderPrefix
 */
async function delFolder(folderPrefix) {
    const ok = await dlgConfirm('删除文件夹', `确定删除【${folderPrefix}】及其内部所有文件吗？该操作不可恢复！`, true);
    if (!ok) return;

    const { data: allFiles, error } = await sb.from("file_list").select("*");
    if (error) { console.error("查询文件失败", error); await dlgAlert("查询文件失败"); return; }

    const prefix1 = folderPrefix + "/";
    const prefix2 = "/" + folderPrefix + "/";
    const targetFiles = allFiles.filter(item => {
        const name = item.file_name || "";
        return name.startsWith(prefix1) || name.startsWith(prefix2);
    });

    if (targetFiles.length === 0) { await dlgAlert("文件夹内无文件"); return; }

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
        await dlgAlert('下载失败');
    }
}

/**
 * 文件夹打包 ZIP 下载
 * @param {string} folderPrefix
 */
async function downloadFolderZip(folderPrefix) {
    const ok = await dlgConfirm('打包下载', `确定打包【${folderPrefix}】下所有文件为 ZIP？`);
    if (!ok) return;

    const { data: allFiles, error } = await sb.from("file_list").select("*");
    if (error) { console.error("查询文件失败", error); await dlgAlert("查询文件失败"); return; }

    const prefix1 = folderPrefix + "/";
    const prefix2 = "/" + folderPrefix + "/";
    const targetFiles = allFiles.filter(item => {
        const name = item.file_name || "";
        return name.startsWith(prefix1) || name.startsWith(prefix2);
    });

    if (targetFiles.length === 0) { await dlgAlert("文件夹内无文件"); return; }

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
        await dlgAlert("你的浏览器不支持 File System Access API，请使用最新版 Chrome 或 Edge");
        return;
    }

    let handles;
    try {
        handles = await window.showOpenFilePicker({ multiple: true });
    } catch (e) {
        if (e.name === 'AbortError') return;   // 用户取消
        console.error("showOpenFilePicker 失败:", e);
        await dlgAlert("选择文件失败：" + e.message);
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
        await dlgAlert("你的浏览器不支持 File System Access API，请使用最新版 Chrome 或 Edge");
        return;
    }

    let dirHandle;
    try {
        dirHandle = await window.showDirectoryPicker();
    } catch (e) {
        if (e.name === 'AbortError') return;
        console.error("showDirectoryPicker 失败:", e);
        await dlgAlert("选择文件夹失败：" + e.message);
        return;
    }

    const items = [];
    await collectDirFiles(dirHandle, dirHandle.name, items);

    if (items.length === 0) {
        await dlgAlert("文件夹内没有文件");
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
 * 网盘 - 右键菜单 / 剪贴板 / 键盘快捷键
 * ============================================================ */

/* ============================================================
 * 网盘 - 多选 / 框选
 * ============================================================ */

let dragState = null;          // 框选
let dragMoveState = null;      // 拖拽移动
let suppressNextClick = false;

/**
 * 取当前所有选中的项
 */
function getSelectedItems() {
    const els = document.querySelectorAll('#fileList .fe-item.selected');
    return Array.from(els).map(el => ({
        type: el.dataset.type,
        name: el.dataset.name,
        id: el.dataset.id,
        path: el.dataset.path,
        el
    }));
}

/**
 * 初始化框选 / 拖拽移动
 */
function initRubberBand() {
    const list = document.getElementById('fileList');
    if (!list) return;

    list.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        if (e.target.closest('button')) return;
        if (e.target.closest('#contextMenu')) return;
        if (e.target.closest('.context-submenu')) return;

        const item = e.target.closest('.fe-item');

        // 起点在"已选中的条目"上 → 拖拽移动模式
        if (item && item.classList.contains('selected')) {
            dragMoveState = {
                startX: e.clientX,
                startY: e.clientY,
                activated: false,
                ghostEl: null,
                hoverFolder: null,
                items: getSelectedItems()
            };
            return;
        }

        // 其他情况 → 框选模式
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
            const dx = e.clientX - state.startX;
            const dy = e.clientY - state.startY;
            if (!state.activated && Math.hypot(dx, dy) < 5) return;

            if (!state.activated) {
                state.activated = true;
                const ghost = document.createElement('div');
                ghost.className = 'drag-ghost';
                ghost.textContent = `移动 ${state.items.length} 项`;
                document.body.appendChild(ghost);
                state.ghostEl = ghost;
                document.body.style.cursor = 'grabbing';
            }

            state.ghostEl.style.left = (e.clientX + 12) + 'px';
            state.ghostEl.style.top = (e.clientY + 12) + 'px';

            // 检测下方是否有文件夹
            const under = document.elementFromPoint(e.clientX, e.clientY);
            const folderEl = under && under.closest('.fe-item.fe-folder');
            let newHover = null;
            if (folderEl) {
                const folderName = folderEl.dataset.name;
                // 不能把文件夹拖到自己里面
                const hasSelf = state.items.some(it => it.type === 'folder' && it.name === folderName);
                if (!hasSelf) newHover = folderEl;
            }

            if (state.hoverFolder && state.hoverFolder !== newHover) {
                state.hoverFolder.classList.remove('drop-target');
            }
            if (newHover && state.hoverFolder !== newHover) {
                newHover.classList.add('drop-target');
            }
            state.hoverFolder = newHover;
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
            document.body.style.cursor = '';

            if (state.activated) {
                suppressNextClick = true;
                setTimeout(() => { suppressNextClick = false; }, 0);
                if (state.hoverFolder) {
                    const targetFolder = state.hoverFolder.dataset.name;
                    moveItemsTo(state.items, targetFolder);
                }
            }
            return;
        }

        /* ---------- 框选收尾 ---------- */
        if (!dragState) return;

        if (dragState.activated) {
            if (dragState.bandEl) dragState.bandEl.remove();
            suppressNextClick = true;
            setTimeout(() => { suppressNextClick = false; }, 0);
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
/** 剪贴板：{ mode: 'copy'|'cut', entries: [{...}] } */
let clipboard = null;

/**
 * 取当前选中的项
 */
function getSelectedItem() {
    const items = getSelectedItems();
    return items.length > 0 ? items[0] : null;
}

/**
 * 在内存文件树里找同目录下是否已有同名文件，有则加 (1)(2)…
 * @param {string[]} parentPath 目标文件夹路径段
 * @param {string} relName 相对名字（可能含子目录 "a/b.txt"）
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
            if (error) { await dlgAlert('读取失败：' + error.message); continue; }
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
}

/**
 * 粘贴剪贴板内容到当前目录
 */
async function pasteHere() {
    if (!clipboard || clipboard.entries.length === 0) {
        console.log('剪贴板为空');
        return;
    }

    const mode = clipboard.mode;
    const entries = clipboard.entries.slice();

    for (const entry of entries) {
        // 冲突处理
        const safeRel = resolveNameConflict(currentPath, entry.newRelName);
        const targetFileName = buildFullPath(currentPath, safeRel);

        // 生成新的 storage 路径
        const ext = (entry.storagePath.split('.').pop() || 'bin');
        const newStoragePath = `${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;

        // Storage 复制
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

        // 剪切模式：删原文件
        if (mode === 'cut') {
            await sb.from('file_list').delete().eq('id', entry.originalId);
            await sb.storage.from('public_netdisk').remove([entry.storagePath]);
        }
    }

    if (mode === 'cut') clipboard = null;
    loadFiles();
}

/**
 * 重命名选中项（用 delete + insert 绕过缺失的 UPDATE 策略）
 */
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

/**
 * 删除选中项
 */
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
/* ---------- 新建文件 / 文件夹 ---------- */

/**
 * 新建空文件
 */
async function createNewFile() {
    const name = await dlgPrompt('新建文件', '请输入文件名（含扩展名）', 'untitled.txt');
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    if (/[\/\\]/.test(trimmed)) {
        await dlgAlert('名称不合法', '文件名不能包含 / 或 \\');
        return;
    }

    const node = getNodeByPath(currentPath);
    if (node && node._files[trimmed]) {
        await dlgAlert('已存在', '当前目录已存在同名文件');
        return;
    }

    const fullPath = buildFullPath(currentPath, trimmed);
    const file = new File([""], trimmed, { type: "text/plain" });
    const ok = await uploadSingleFileWithPath(file, fullPath);
    if (!ok) {
        await dlgAlert('创建失败', '创建文件失败，请重试');
        return;
    }
    loadFiles();
}

/**
 * 新建文件夹（通过写一个占位文件 .gitkeep 让目录出现在列表里）
 */
async function createNewFolder() {
    const name = await dlgPrompt('新建文件夹', '请输入文件夹名', '新建文件夹');
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    if (/[\/\\]/.test(trimmed)) {
        await dlgAlert('名称不合法', '文件夹名不能包含 / 或 \\');
        return;
    }

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
/* ---------- 拖拽移动 ---------- */

/**
 * 在目标目录里找一个不冲突的名字
 * @param {Array} allFiles file_list 全量数据
 * @param {string} targetPrefix 目标文件夹完整路径，如 "docs/sub"
 * @param {string} name 原文件/文件夹名
 * @returns {string} 不冲突的名字
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
 * 把选中的项移动到目标文件夹（只改 file_list 的 file_name，不动 Storage）
 * @param {Array} items 选中项快照
 * @param {string} targetFolder 目标文件夹名（当前目录下的直接子目录）
 */
async function moveItemsTo(items, targetFolder) {
    if (!items || items.length === 0) return;

    const targetPrefix = buildFullPath(currentPath, targetFolder);
    const { data: allFiles, error } = await sb.from('file_list').select('*');
    if (error) { await dlgAlert('移动失败', error.message); return; }

    /** @type {Array<{id: string, newName: string}>} */
    const plans = [];

    for (const item of items) {
        if (item.type === 'file') {
            const file = findFileByStoragePath(item.path);
            if (!file) continue;
            const safeName = resolveTargetConflict(allFiles, targetPrefix, item.name);
            const newName = buildFullPath(currentPath, targetFolder + '/' + safeName);
            if (newName === file.file_name) continue; // 目标就是当前位置
            plans.push({ id: file.id, newName });
        } else {
            const oldFolderPath = buildFullPath(currentPath, item.name);
            const prefix = oldFolderPath + '/';
            const rows = allFiles.filter(r => r.file_name && r.file_name.startsWith(prefix));
            if (rows.length === 0) continue;

            const safeFolder = resolveTargetConflict(allFiles, targetPrefix, item.name);
            const newFolderPath = buildFullPath(currentPath, targetFolder + '/' + safeFolder);

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
        await dlgAlert('移动失败', insErr.message);
        loadFiles();
        return;
    }

    loadFiles();
}
/* ---------- 右键菜单 ---------- */

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

/**
 * 显示右键菜单
 * @param {number} x
 * @param {number} y
 */
function showContextMenu(x, y) {
    const menu = ensureContextMenu();
    const sels = getSelectedItems();
    const sel = sels.length > 0 ? sels[0] : null;
    const n = sels.length;

    /** @type {Array<{label?:string, action?:Function, sep?:boolean, disabled?:boolean, danger?:boolean, shortcut?:string}>} */
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
                    action: () => { currentPath.push(sel.name); renderExplorer(); }
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
                            sortAsc = !sortAsc;
                        } else {
                            sortKey = opt.key;
                            sortAsc = (opt.key === 'name' || opt.key === 'type');
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

    // 清掉上一次留下的子菜单
    document.querySelectorAll('.context-submenu').forEach(el => el.remove());

    /**
     * 渲染一组菜单项到容器里
     * @param {HTMLElement} container
     * @param {Array} list
     * @param {boolean} isSub 是否是子菜单（子菜单里不再递归嵌套）
     */
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

                    // 定位到当前项右侧；越界则放到左侧
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

    // 先显示再测量宽高，避免超出窗口
    menu.style.left = '0px';
    menu.style.top = '0px';
    menu.classList.add('show');
    const rect = menu.getBoundingClientRect();
    const px = Math.min(x, window.innerWidth - rect.width - 8);
    const py = Math.min(y, window.innerHeight - rect.height - 8);
    menu.style.left = px + 'px';
    menu.style.top = py + 'px';
}
/**
 * 判断坐标 (x, y) 是否落在元素的文本实际渲染范围内
 * @param {HTMLElement} el
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
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
/**
 * 初始化右键菜单
 */
function initContextMenu() {
    ensureContextMenu();

    const list = document.getElementById('fileList');
    list.addEventListener('contextmenu', e => {
        e.preventDefault();

        const item = e.target.closest('.fe-item');

        // 判断点在不在"实质内容"上
        let onContent = false;
        if (item) {
            if (item.classList.contains('selected')) {
                // 已选中的条目：整行都算内容，避免多选后右键行尾空白被当成空白
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
            // 点到的项已在选中集合里 → 保留现有选中，做批量操作
            if (!item.classList.contains('selected')) {
                list.querySelectorAll('.fe-item.selected').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
            }
        } else {
            // 右键空白或条目空白部分 → 清空选中，出空白菜单
            list.querySelectorAll('.fe-item.selected').forEach(el => el.classList.remove('selected'));
        }

        showContextMenu(e.clientX, e.clientY);
    });

    // 点其它地方关掉菜单
    document.addEventListener('click', e => {
        if (!e.target.closest('#contextMenu')) hideContextMenu();
    });
    document.addEventListener('scroll', hideContextMenu, true);
    window.addEventListener('resize', hideContextMenu);
}

/* ---------- 键盘快捷键 ---------- */

function initKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
        if (e.target.matches('input, textarea, [contenteditable="true"]')) return;
        if (document.querySelector('#textViewer.show')) return;
        if (document.querySelector('#dialog.show')) return;
        const sel = getSelectedItem();

        if (e.ctrlKey && !e.shiftKey && !e.altKey) {
            const k = e.key.toLowerCase();
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
        } else if (e.key === 'F2') {
            if (sel) { e.preventDefault(); renameSelected(); }
        } else if (e.key === 'Escape') {
            hideContextMenu();
        }
    });
}
/* ============================================================
 * 网盘 - 搜索
 * ============================================================ */

let searchQuery = '';

/**
 * 递归收集文件树里所有文件（带完整路径）
 * @param {any} node
 * @param {string} basePath
 * @param {Array} out
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

/**
 * 按 storage_path 从文件树查找文件
 * @param {string} storagePath
 */
function findFileByStoragePath(storagePath) {
    if (!storagePath) return null;
    const all = [];
    collectAllFiles(fileTree, '', all);
    return all.find(f => f.storage_path === storagePath) || null;
}

/**
 * 渲染搜索结果
 */
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

    matched.sort((a, b) => a.fullPath.localeCompare(b.fullPath, 'zh'));

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

/**
 * 初始化搜索框
 */
function initSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;

    input.addEventListener('input', () => {
        searchQuery = input.value.trim();
        renderFileList();
    });

    input.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            input.value = '';
            searchQuery = '';
            renderFileList();
            input.blur();
        }
    });
}

/* ============================================================
 * 初始化
 * ============================================================ */

initTabs();
initExplorerEvents();
initTextViewer();
initContextMenu();
initKeyboardShortcuts();
initSearch();
initRubberBand();
initThemeToggle();
loadMessages();
loadFiles();