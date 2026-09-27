// Supabase 信息 —— 从 env.js 读取
const __ENV = window.__SHAREBOX_ENV__ || {};
const SUPABASE_URL = __ENV.SUPABASE_URL;
const ANON_KEY = __ENV.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
    document.body.innerHTML = `
        <div style="padding:40px;font-family:system-ui;line-height:1.8;color:#334155">
            <h2 style="color:#dc2626">缺少 Supabase 配置</h2>
            <p>请检查项目根目录的 <code>env.js</code> 是否存在，且填好了
            <code>SUPABASE_URL</code> 和 <code>SUPABASE_ANON_KEY</code>。</p>
        </div>`;
    throw new Error('Supabase 配置缺失：请检查 env.js');
}

const sb = window.supabase.createClient(SUPABASE_URL, ANON_KEY);

/** 文件夹占位文件名 */
const FOLDER_PLACEHOLDER = '.gitkeep';

/* ============================================================
 * 文件图标（vscode-icons）
 * ============================================================ */

const VSC_ICON_CDN = './assets/file-icons/';
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

    // ---------- 补充 ----------
    diff: 'file_type_diff.svg', patch: 'file_type_diff.svg',
    asm: 'file_type_assembly.svg', s: 'file_type_assembly.svg',
    coffee: 'file_type_coffeescript.svg',
    f90: 'file_type_fortran.svg', f95: 'file_type_fortran.svg', for: 'file_type_fortran.svg',
    vb: 'file_type_vb.svg', vbs: 'file_type_vb.svg',
    hs: 'file_type_haskell.svg', lhs: 'file_type_haskell.svg',
    ex: 'file_type_elixir.svg', exs: 'file_type_elixir.svg',
    erl: 'file_type_erlang.svg', hrl: 'file_type_erlang.svg',
    clj: 'file_type_clojure.svg', cljs: 'file_type_clojure.svg', cljc: 'file_type_clojure.svg',
    pas: 'file_type_pascal.svg',
    pro: 'file_type_prolog.svg',
    tcl: 'file_type_tcl.svg',
    vim: 'file_type_vim.svg',
    gitignore: 'file_type_git.svg', gitattributes: 'file_type_git.svg', gitmodules: 'file_type_git.svg',
    stl: 'file_type_3d.svg', obj3d: 'file_type_3d.svg', fbx: 'file_type_3d.svg',
    gltf: 'file_type_3d.svg', glb: 'file_type_3d.svg', dae: 'file_type_3d.svg',
    '3ds': 'file_type_3d.svg', blend: 'file_type_3d.svg', ply: 'file_type_3d.svg',
    epub: 'file_type_ebook.svg', mobi: 'file_type_ebook.svg', azw: 'file_type_ebook.svg',
    azw3: 'file_type_ebook.svg', fb2: 'file_type_ebook.svg', djvu: 'file_type_ebook.svg',
    pem: 'file_type_certificate.svg', crt: 'file_type_certificate.svg', cer: 'file_type_certificate.svg',
    odt: 'file_type_openoffice.svg', ods: 'file_type_openoffice.svg', odp: 'file_type_openoffice.svg',
    bin: 'file_type_binary.svg', dat: 'file_type_binary.svg',
    styl: 'file_type_stylus.svg',
    xaml: 'file_type_xaml.svg',
    fs: 'file_type_fsharp.svg', fsx: 'file_type_fsharp.svg',
    ml: 'file_type_ocaml.svg', mli: 'file_type_ocaml.svg',
    scpt: 'file_type_applescript.svg',
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

/** 扩展名 → 中文类型标签 */
/** 扩展名 → 中文类型标签 */
const FILE_TYPE_LABELS = {
    // ---------- 文档 / 文本 ----------
    txt: '文本文档',
    rtf: '富文本文档',
    md: 'Markdown 文档',
    markdown: 'Markdown 文档',
    mdx: 'MDX 文档',
    rst: 'reStructuredText',
    tex: 'LaTeX 文档',
    latex: 'LaTeX 文档',
    bib: 'BibTeX 文献',
    adoc: 'AsciiDoc 文档',
    org: 'Org 文档',
    log: '日志文件',
    srt: 'SRT 字幕',
    vtt: 'WebVTT 字幕',
    ass: 'ASS 字幕',
    ssa: 'SSA 字幕',
    sub: 'SUB 字幕',
    idx: '字幕索引',
    po: 'Gettext 翻译',
    pot: 'Gettext 模板',

    // ---------- 数据 / 配置 ----------
    json: 'JSON 数据',
    json5: 'JSON5 数据',
    jsonc: 'JSON with Comments',
    jsonl: 'JSON Lines',
    ndjson: 'NDJSON 数据',
    xml: 'XML 文档',
    yaml: 'YAML 配置',
    yml: 'YAML 配置',
    toml: 'TOML 配置',
    ini: 'INI 配置',
    conf: '配置文件',
    cfg: '配置文件',
    config: '配置文件',
    env: '环境变量',
    properties: 'Java 属性',
    lock: '依赖锁文件',
    editorconfig: 'EditorConfig',
    gitignore: 'Git 忽略规则',
    gitattributes: 'Git 属性',
    gitmodules: 'Git 子模块',
    dockerignore: 'Docker 忽略',
    npmrc: 'npm 配置',
    nvmrc: 'nvm 版本',
    babelrc: 'Babel 配置',
    eslintrc: 'ESLint 配置',
    prettierrc: 'Prettier 配置',
    csv: 'CSV 表格',
    tsv: 'TSV 表格',
    parquet: 'Parquet 数据',
    avro: 'Avro 数据',
    orc: 'ORC 数据',
    hdf5: 'HDF5 数据',
    h5: 'HDF5 数据',
    npy: 'NumPy 数组',
    npz: 'NumPy 归档',
    pkl: 'Python Pickle',
    pickle: 'Python Pickle',
    mat: 'MATLAB 数据',
    rdata: 'R 数据',
    rds: 'R 数据',
    sav: 'SPSS 数据',
    dta: 'Stata 数据',
    sqlite: 'SQLite 数据库',
    sqlite3: 'SQLite 数据库',
    db: '数据库文件',
    mdb: 'Access 数据库',
    accdb: 'Access 数据库',
    mdf: 'SQL Server 数据',
    ldf: 'SQL Server 日志',

    // ---------- 网页 ----------
    html: 'HTML 网页',
    htm: 'HTML 网页',
    xhtml: 'XHTML 网页',
    css: 'CSS 样式表',
    scss: 'SCSS 样式表',
    sass: 'Sass 样式表',
    less: 'LESS 样式表',
    styl: 'Stylus 样式',
    vue: 'Vue 组件',
    svelte: 'Svelte 组件',
    astro: 'Astro 组件',

    // ---------- 编程语言 ----------
    js: 'JavaScript',
    mjs: 'JavaScript 模块',
    cjs: 'CommonJS 模块',
    jsx: 'React 组件',
    ts: 'TypeScript',
    tsx: 'React TypeScript',
    coffee: 'CoffeeScript',
    dart: 'Dart 代码',
    py: 'Python 源码',
    pyw: 'Python 源码',
    pyi: 'Python 类型存根',
    pyc: 'Python 字节码',
    ipynb: 'Jupyter Notebook',
    rb: 'Ruby 源码',
    erb: 'ERB 模板',
    php: 'PHP 源码',
    phtml: 'PHP 模板',
    java: 'Java 源码',
    class: 'Java 字节码',
    jar: 'Java 归档',
    kt: 'Kotlin 源码',
    kts: 'Kotlin 脚本',
    scala: 'Scala 源码',
    groovy: 'Groovy 源码',
    gradle: 'Gradle 构建',
    clj: 'Clojure 源码',
    cljs: 'ClojureScript',
    cljc: 'Clojure 源码',
    lisp: 'Lisp 源码',
    el: 'Emacs Lisp',
    scm: 'Scheme 源码',
    rkt: 'Racket 源码',
    ex: 'Elixir 源码',
    exs: 'Elixir 脚本',
    erl: 'Erlang 源码',
    hrl: 'Erlang 头文件',
    hs: 'Haskell 源码',
    lhs: 'Literate Haskell',
    ml: 'OCaml 源码',
    mli: 'OCaml 接口',
    fs: 'F# 源码',
    fsx: 'F# 脚本',
    cob: 'COBOL 源码',
    cbl: 'COBOL 源码',
    ada: 'Ada 源码',
    adb: 'Ada 主体',
    ads: 'Ada 规范',
    pro: 'Prolog 源码',
    pas: 'Pascal 源码',
    pp: 'Puppet 清单',
    vb: 'Visual Basic',
    vbs: 'VBScript',
    c: 'C 源代码',
    h: 'C 头文件',
    cpp: 'C++ 源代码',
    cxx: 'C++ 源代码',
    cc: 'C++ 源代码',
    hpp: 'C++ 头文件',
    hxx: 'C++ 头文件',
    cs: 'C# 源码',
    csx: 'C# 脚本',
    go: 'Go 源码',
    rs: 'Rust 源码',
    swift: 'Swift 源码',
    m: 'Objective-C',
    mm: 'Objective-C++',
    lua: 'Lua 脚本',
    r: 'R 脚本',
    rmd: 'R Markdown',
    jl: 'Julia 源码',
    zig: 'Zig 源码',
    nim: 'Nim 源码',
    v: 'V 语言源码',
    hx: 'Haxe 源码',
    sol: 'Solidity 合约',
    asm: '汇编源码',
    s: '汇编源码',
    f90: 'Fortran 源码',
    f95: 'Fortran 源码',
    for: 'Fortran 源码',
    pl: 'Perl 脚本',
    pm: 'Perl 模块',
    tcl: 'Tcl 脚本',
    awk: 'AWK 脚本',
    sed: 'sed 脚本',
    bf: 'Brainfuck 代码',
    wasm: 'WebAssembly 模块',
    wat: 'WebAssembly 文本',

    // ---------- Shell / 脚本 ----------
    sh: 'Shell 脚本',
    bash: 'Bash 脚本',
    zsh: 'Zsh 脚本',
    fish: 'Fish 脚本',
    ksh: 'KornShell 脚本',
    csh: 'C Shell 脚本',
    bat: 'Windows 批处理',
    cmd: 'Windows 批处理',
    ps1: 'PowerShell 脚本',
    psm1: 'PowerShell 模块',
    psd1: 'PowerShell 数据',

    // ---------- 查询语言 ----------
    sql: 'SQL 脚本',
    graphql: 'GraphQL 查询',
    gql: 'GraphQL 查询',
    proto: 'Protobuf 定义',
    thrift: 'Thrift 定义',

    // ---------- 图片 ----------
    png: 'PNG 图片',
    jpg: 'JPEG 图片',
    jpeg: 'JPEG 图片',
    jpe: 'JPEG 图片',
    jfif: 'JPEG 图片',
    gif: 'GIF 图片',
    webp: 'WebP 图片',
    avif: 'AVIF 图片',
    bmp: 'BMP 位图',
    dib: 'BMP 位图',
    ico: '图标文件',
    cur: '光标文件',
    svg: 'SVG 矢量图',
    tif: 'TIFF 图片',
    tiff: 'TIFF 图片',
    heic: 'HEIC 图片',
    heif: 'HEIF 图片',
    jp2: 'JPEG 2000',
    j2k: 'JPEG 2000',
    exr: 'OpenEXR 图片',
    hdr: 'HDR 图片',
    dds: 'DDS 纹理',
    tga: 'TGA 图片',
    pcx: 'PCX 图片',
    psd: 'Photoshop 源文件',
    psb: 'Photoshop 大文件',
    ai: 'Illustrator 源文件',
    eps: 'EPS 矢量图',
    sketch: 'Sketch 源文件',
    fig: 'Figma 设计稿',
    xd: 'Adobe XD 设计稿',
    afdesign: 'Affinity Designer',
    afphoto: 'Affinity Photo',
    xcf: 'GIMP 源文件',

    // ---------- 音频 ----------
    mp3: 'MP3 音频',
    wav: 'WAV 音频',
    flac: 'FLAC 无损音频',
    aac: 'AAC 音频',
    m4a: 'M4A 音频',
    ogg: 'OGG 音频',
    oga: 'OGG 音频',
    opus: 'Opus 音频',
    wma: 'WMA 音频',
    aiff: 'AIFF 音频',
    aif: 'AIFF 音频',
    ape: 'APE 无损音频',
    mid: 'MIDI 音乐',
    midi: 'MIDI 音乐',
    mka: 'Matroska 音频',
    amr: 'AMR 音频',

    // ---------- 视频 ----------
    mp4: 'MP4 视频',
    m4v: 'M4V 视频',
    webm: 'WebM 视频',
    mkv: 'Matroska 视频',
    mov: 'QuickTime 视频',
    avi: 'AVI 视频',
    wmv: 'WMV 视频',
    flv: 'Flash 视频',
    f4v: 'Flash 视频',
    mpg: 'MPEG 视频',
    mpeg: 'MPEG 视频',
    m2v: 'MPEG-2 视频',
    ts_video: 'MPEG-TS 视频',
    m2ts: '蓝光视频',
    mts: 'AVCHD 视频',
    vob: 'DVD 视频',
    ogv: 'OGV 视频',
    rm: 'RealMedia 视频',
    rmvb: 'RealMedia 视频',
    '3gp': '3GP 手机视频',
    '3g2': '3G2 手机视频',

    // ---------- 压缩 / 归档 ----------
    zip: 'ZIP 压缩包',
    rar: 'RAR 压缩包',
    '7z': '7z 压缩包',
    tar: 'TAR 归档',
    gz: 'GZIP 压缩',
    tgz: 'TAR.GZ 归档',
    bz2: 'BZIP2 压缩',
    tbz: 'TAR.BZ2 归档',
    xz: 'XZ 压缩',
    txz: 'TAR.XZ 归档',
    zst: 'Zstandard 压缩',
    lz: 'Lzip 压缩',
    lzma: 'LZMA 压缩',
    z: 'compress 压缩',
    cab: 'Windows 压缩包',
    arj: 'ARJ 压缩包',
    lzh: 'LHA 压缩包',
    iso: '光盘镜像',
    img: '磁盘镜像',
    dmg: 'macOS 磁盘映像',

    // ---------- 可执行 / 安装包 ----------
    exe: 'Windows 可执行',
    com: 'DOS 可执行',
    msi: 'Windows 安装包',
    msix: 'Windows 应用包',
    appx: 'Windows 应用包',
    appxbundle: 'Windows 应用捆绑',
    bat_exe: '批处理',
    scr: '屏幕保护程序',
    dll: '动态链接库',
    sys: '系统驱动',
    so: 'Linux 共享库',
    dylib: 'macOS 动态库',
    a: '静态库',
    lib: '静态库',
    o: '目标文件',
    obj: '目标文件',
    apk: 'Android 安装包',
    aab: 'Android App Bundle',
    ipa: 'iOS 应用包',
    deb: 'Debian 安装包',
    rpm: 'RPM 安装包',
    pkg: 'macOS 安装包',
    snap: 'Snap 包',
    flatpak: 'Flatpak 包',

    // ---------- 字体 ----------
    ttf: 'TrueType 字体',
    otf: 'OpenType 字体',
    ttc: 'TrueType 字体集',
    otc: 'OpenType 字体集',
    woff: 'WOFF 网页字体',
    woff2: 'WOFF2 网页字体',
    eot: 'EOT 网页字体',
    fon: 'Windows 字体',
    pfb: 'PostScript 字体',

    // ---------- 3D / CAD ----------
    stl: 'STL 3D 模型',
    obj3d: 'OBJ 3D 模型',
    fbx: 'FBX 3D 模型',
    dae: 'Collada 3D 模型',
    '3ds': '3ds Max 模型',
    blend: 'Blender 源文件',
    gltf: 'glTF 3D 模型',
    glb: 'glTF 二进制',
    ply: 'PLY 3D 模型',
    dwg: 'AutoCAD 图纸',
    dxf: 'DXF 图纸',
    step: 'STEP 模型',
    stp: 'STEP 模型',
    iges: 'IGES 模型',
    igs: 'IGES 模型',

    // ---------- 电子书 ----------
    epub: 'EPUB 电子书',
    mobi: 'Mobipocket 电子书',
    azw: 'Kindle 电子书',
    azw3: 'Kindle 电子书',
    fb2: 'FictionBook 电子书',
    djvu: 'DjVu 文档',
    cbz: '漫画压缩包',
    cbr: '漫画压缩包',

    // ---------- 光盘 / 镜像 ----------
    nrg: 'Nero 镜像',
    mds: 'Daemon Tools 镜像',
    mdf_disk: 'Daemon Tools 镜像',
    cue: 'CUE 索引',
    bin: '二进制数据',
    dat: '数据文件',

    // ---------- 虚拟机 / 磁盘 ----------
    vmdk: 'VMware 磁盘',
    vdi: 'VirtualBox 磁盘',
    vhd: 'Hyper-V 磁盘',
    vhdx: 'Hyper-V 磁盘',
    qcow2: 'QEMU 磁盘',
    ovf: 'OVF 虚拟机',
    ova: 'OVA 虚拟机',

    // ---------- 备份 / 临时 ----------
    bak: '备份文件',
    backup: '备份文件',
    old: '旧版本文件',
    orig: '原始文件',
    tmp: '临时文件',
    temp: '临时文件',
    swp: 'Vim 交换文件',
    swo: 'Vim 交换文件',
    '~': '备份文件',
    crdownload: '浏览器下载中',
    part: '部分下载',
    partial: '部分下载',

    // ---------- 补丁 / 差异 ----------
    diff: '差异文件',
    patch: '补丁文件',

    // ---------- 其它 ----------
    map: 'Source Map',
    webmanifest: 'Web App 清单',
    appcache: 'AppCache 清单',
    crx: 'Chrome 扩展',
    xpi: 'Firefox 扩展',
    vsix: 'VS Code 扩展',
    torrent: 'BT 种子',
    magnet: '磁力链接',
    pdf: 'PDF 文档',
    xps: 'XPS 文档',
    oxps: 'OpenXPS 文档',
    doc: 'Word 文档',
    docx: 'Word 文档',
    docm: 'Word 宏文档',
    dot: 'Word 模板',
    dotx: 'Word 模板',
    odt: 'OpenDocument 文本',
    pages: 'Pages 文档',
    xls: 'Excel 表格',
    xlsx: 'Excel 表格',
    xlsm: 'Excel 宏表格',
    xlsb: 'Excel 二进制',
    xlt: 'Excel 模板',
    xltx: 'Excel 模板',
    ods: 'OpenDocument 表格',
    numbers: 'Numbers 表格',
    ppt: 'PowerPoint 演示',
    pptx: 'PowerPoint 演示',
    pptm: 'PowerPoint 宏演示',
    pot: 'PowerPoint 模板',
    potx: 'PowerPoint 模板',
    odp: 'OpenDocument 演示',
    key: 'Keynote 演示',
    iwork: 'iWork 文档',
    lnk: '快捷方式'
};

/**
 * 根据文件名返回类型标签
 * @param {string} filename
 * @returns {string}
 */
function getFileTypeLabel(filename) {
    const name = String(filename || '').toLowerCase();
    const idx = name.lastIndexOf('.');
    if (idx === -1 || idx === 0) return '文件';
    const ext = name.slice(idx + 1);
    return FILE_TYPE_LABELS[ext] || (ext.toUpperCase() + ' 文件');
}
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
function isPdfFile(name) { return getExt(name) === 'pdf'; }
function isOfficeFile(name) { return OFFICE_EXTS.has(getExt(name)); }

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