// Supabase 信息
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
    js: 'file_type_js.svg', mjs: 'file_type_js.svg', cjs: 'file_type_js.svg',
    jsx: 'file_type_reactjs.svg', ts: 'file_type_typescript.svg', tsx: 'file_type_reactts.svg',
    py: 'file_type_python.svg', java: 'file_type_java.svg',
    c: 'file_type_c.svg', h: 'file_type_c.svg',
    cpp: 'file_type_cpp.svg', hpp: 'file_type_cpp.svg', cc: 'file_type_cpp.svg',
    cs: 'file_type_csharp.svg', go: 'file_type_go.svg', rs: 'file_type_rust.svg',
    rb: 'file_type_ruby.svg', php: 'file_type_php.svg', swift: 'file_type_swift.svg',
    kt: 'file_type_kotlin.svg', kts: 'file_type_kotlin.svg', scala: 'file_type_scala.svg',
    lua: 'file_type_lua.svg', dart: 'file_type_dartlang.svg', r: 'file_type_r.svg',
    pl: 'file_type_perl.svg', jl: 'file_type_julia.svg', zig: 'file_type_zig.svg',
    nim: 'file_type_nim.svg',
    sh: 'file_type_shell.svg', bash: 'file_type_shell.svg', zsh: 'file_type_shell.svg',
    ps1: 'file_type_powershell.svg', bat: 'file_type_bat.svg', cmd: 'file_type_bat.svg',
    html: 'file_type_html.svg', htm: 'file_type_html.svg',
    css: 'file_type_css.svg', scss: 'file_type_scss.svg', less: 'file_type_less.svg',
    vue: 'file_type_vue.svg', svelte: 'file_type_svelte.svg',
    json: 'file_type_json.svg', json5: 'file_type_json.svg',
    yaml: 'file_type_yaml.svg', yml: 'file_type_yaml.svg',
    toml: 'file_type_toml.svg', ini: 'file_type_ini.svg',
    conf: 'file_type_config.svg', cfg: 'file_type_config.svg',
    env: 'file_type_dotenv.svg', properties: 'file_type_config.svg',
    lock: 'file_type_lock.svg', xml: 'file_type_xml.svg', svg: 'file_type_svg.svg',
    sql: 'file_type_sql.svg', db: 'file_type_sql.svg', sqlite: 'file_type_sql.svg',
    graphql: 'file_type_graphql.svg', gql: 'file_type_graphql.svg',
    proto: 'file_type_proto.svg',
    md: 'file_type_markdown.svg', markdown: 'file_type_markdown.svg',
    txt: 'file_type_text.svg', log: 'file_type_log.svg',
    rst: 'file_type_rst.svg', tex: 'file_type_tex.svg',
    pdf: 'file_type_pdf.svg', doc: 'file_type_word.svg', docx: 'file_type_word.svg',
    xls: 'file_type_excel.svg', xlsx: 'file_type_excel.svg',
    csv: 'file_type_excel.svg', tsv: 'file_type_excel.svg',
    ppt: 'file_type_powerpoint.svg', pptx: 'file_type_powerpoint.svg',
    png: 'file_type_image.svg', jpg: 'file_type_image.svg', jpeg: 'file_type_image.svg',
    gif: 'file_type_image.svg', webp: 'file_type_image.svg', bmp: 'file_type_image.svg',
    ico: 'file_type_image.svg', tif: 'file_type_image.svg', tiff: 'file_type_image.svg',
    psd: 'file_type_photoshop.svg', ai: 'file_type_ai.svg',
    mp3: 'file_type_audio.svg', wav: 'file_type_audio.svg', flac: 'file_type_audio.svg',
    ogg: 'file_type_audio.svg', m4a: 'file_type_audio.svg', aac: 'file_type_audio.svg',
    mp4: 'file_type_video.svg', avi: 'file_type_video.svg', mov: 'file_type_video.svg',
    mkv: 'file_type_video.svg', webm: 'file_type_video.svg',
    flv: 'file_type_video.svg', wmv: 'file_type_video.svg',
    zip: 'file_type_zip.svg', rar: 'file_type_zip.svg', '7z': 'file_type_zip.svg',
    tar: 'file_type_zip.svg', gz: 'file_type_zip.svg', bz2: 'file_type_zip.svg',
    xz: 'file_type_zip.svg', iso: 'file_type_iso.svg',
    exe: 'file_type_exe.svg', msi: 'file_type_exe.svg', dmg: 'file_type_dmg.svg',
    apk: 'file_type_android.svg', deb: 'file_type_debian.svg', rpm: 'file_type_redhat.svg',
    ttf: 'file_type_font.svg', otf: 'file_type_font.svg', woff: 'file_type_font.svg',
    woff2: 'file_type_font.svg', eot: 'file_type_font.svg',
};

/* ============================================================
 * 扩展名分类
 * ============================================================ */

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico', 'avif']);
const VIDEO_EXTS = new Set(['mp4', 'webm', 'ogg', 'ogv', 'mov', 'mkv', 'm4v']);
const AUDIO_EXTS = new Set(['mp3', 'wav', 'ogg', 'oga', 'flac', 'm4a', 'aac', 'opus']);
const OFFICE_EXTS = new Set(['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']);

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

const HLJS_LANG_MAP = {
    md: 'markdown', markdown: 'markdown', txt: 'plaintext', log: 'plaintext',
    json: 'json', json5: 'json', xml: 'xml', html: 'xml', htm: 'xml', svg: 'xml',
    vue: 'xml', svelte: 'xml', css: 'css', scss: 'scss', less: 'less',
    js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript', py: 'python', java: 'java',
    c: 'c', h: 'c', cpp: 'cpp', hpp: 'cpp', cc: 'cpp',
    cs: 'csharp', go: 'go', rs: 'rust', rb: 'ruby', php: 'php',
    sh: 'bash', bash: 'bash', zsh: 'bash',
    bat: 'dos', cmd: 'dos', ps1: 'powershell',
    yaml: 'yaml', yml: 'yaml', toml: 'ini', ini: 'ini', conf: 'ini', cfg: 'ini',
    sql: 'sql', csv: 'plaintext', tsv: 'plaintext',
    lua: 'lua', dart: 'dart', swift: 'swift',
    kt: 'kotlin', kts: 'kotlin', scala: 'scala',
    r: 'r', pl: 'perl', tex: 'latex',
    graphql: 'graphql', gql: 'graphql', proto: 'protobuf',
    asm: 'x86asm', vb: 'vbnet', pas: 'delphi', f90: 'fortran',
    jl: 'julia', nim: 'nim', zig: 'zig',
    srt: 'plaintext', vtt: 'plaintext'
};

/* ============================================================
 * 类型判断工具
 * ============================================================ */

/**
 * 取文件扩展名（小写，不含点）
 */
function getExt(filename) {
    const name = String(filename || '').toLowerCase();
    const idx = name.lastIndexOf('.');
    if (idx === -1 || idx === 0) return '';
    return name.slice(idx + 1);
}

function isImageFile(name) { return IMAGE_EXTS.has(getExt(name)); }
function isVideoFile(name) { return VIDEO_EXTS.has(getExt(name)); }
function isAudioFile(name) { return AUDIO_EXTS.has(getExt(name)); }
function isPdfFile(name)   { return getExt(name) === 'pdf'; }
function isOfficeFile(name){ return OFFICE_EXTS.has(getExt(name)); }

function isZipFile(filename) {
    const name = String(filename || '').toLowerCase();
    return name.endsWith('.zip') || name.endsWith('.jar') ||
        name.endsWith('.apk') || name.endsWith('.epub');
}

function isTextFile(filename) {
    const name = String(filename || '').toLowerCase();
    const idx = name.lastIndexOf('.');
    if (idx === -1 || idx === 0) return true;
    return TEXT_EXTS.has(name.slice(idx + 1));
}

function canPreviewFile(filename) {
    return isTextFile(filename) || isZipFile(filename) ||
        isImageFile(filename) || isVideoFile(filename) ||
        isAudioFile(filename) || isPdfFile(filename) ||
        isOfficeFile(filename);
}

function detectLang(filename) {
    const name = String(filename || '').toLowerCase();
    const idx = name.lastIndexOf('.');
    if (idx === -1 || idx === 0) return null;
    return HLJS_LANG_MAP[name.slice(idx + 1)] || null;
}

/**
 * 根据文件名返回图标 URL
 */
function getFileIconUrl(filename) {
    const name = String(filename || '').toLowerCase();
    const idx = name.lastIndexOf('.');
    if (idx === -1 || idx === 0) return DEFAULT_FILE_ICON;
    const ext = name.slice(idx + 1);
    const file = FILE_ICON_SVG_MAP[ext];
    return file ? VSC_ICON_CDN + file : DEFAULT_FILE_ICON;
}