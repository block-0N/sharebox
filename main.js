const { app, BrowserWindow, Menu, Tray, nativeImage, session, Notification, dialog, ipcMain, shell } = require('electron');
let mainWindow = null;
let tray = null;
let isQuitting = false;
const path = require('path');
const http = require('http');
const fs = require('fs');

const PORT = 51234;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
};

/* ============================================================
 * 单实例锁 + 命令行参数
 * ============================================================ */
if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit(0);
}

function parseUploadArg(argv) {
    const idx = argv.indexOf('--upload');
    if (idx < 0) return null;
    for (let i = argv.length - 1; i > idx; i--) {
        let p = String(argv[i] || '');
        if (p.startsWith('-')) continue;
        if (p.startsWith('"') && p.endsWith('"')) p = p.slice(1, -1);
        p = p.trim();
        if (p.startsWith('"') && p.endsWith('"')) p = p.slice(1, -1);
        if (path.isAbsolute(p)) return p;
    }
    return null;
}

app.on('second-instance', (event, commandLine) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    console.log('[second-instance] argv:', JSON.stringify(commandLine));
    const uploadPath = parseUploadArg(commandLine);
    console.log('[second-instance] uploadPath:', JSON.stringify(uploadPath));
    if (uploadPath) {
        mainWindow.webContents.send('context-menu:upload-request', uploadPath);
    }
});

/* ============================================================
 * 系统右键菜单注册
 * ============================================================ */
const REG_ROOT = 'HKEY_CURRENT_USER\\Software\\Classes';
const CTX_MENU_LABEL = '上传到 ShareBox';
const CTX_MENU_KEY = 'ShareBox';

function regAdd(key, valueName, valueData) {
    const { spawnSync } = require('child_process');
    const args = ['add', key, '/f'];
    if (valueName) args.push('/v', valueName);
    else args.push('/ve');
    args.push('/d', valueData);
    const r = spawnSync('reg', args, { encoding: 'utf8', windowsHide: true });
    return r.status === 0;
}

function regDelete(key) {
    const { spawnSync } = require('child_process');
    const r = spawnSync('reg', ['delete', key, '/f'], { encoding: 'utf8', windowsHide: true });
    return r.status === 0;
}

function getExeCommand() {
    if (app.isPackaged) {
        return `"${process.execPath}"`;
    }
    return `"${process.execPath}" "${app.getAppPath()}"`;
}

function getExeIcon() {
    if (app.isPackaged) {
        return `"${process.execPath}",0`;
    }
    const ico = path.join(__dirname, 'assets', 'icon.ico');
    if (fs.existsSync(ico)) return `"${ico}"`;
    return '';
}

function isContextMenuRegistered() {
    if (process.platform !== 'win32') return false;
    const { spawnSync } = require('child_process');
    const r = spawnSync('reg', ['query', `${REG_ROOT}\\*\\shell\\${CTX_MENU_KEY}`], { encoding: 'utf8', windowsHide: true });
    return r.status === 0;
}

function registerContextMenu() {
    if (process.platform !== 'win32') throw new Error('仅 Windows 支持');
    const cmd = `${getExeCommand()} --upload %1`;
    const icon = getExeIcon();
    const targets = [
        `${REG_ROOT}\\*\\shell\\${CTX_MENU_KEY}`,
        `${REG_ROOT}\\Directory\\shell\\${CTX_MENU_KEY}`
    ];
    for (const key of targets) {
        regAdd(key, '', CTX_MENU_LABEL);
        if (icon) regAdd(key, 'Icon', icon);
        regAdd(key + '\\command', '', cmd);
    }
    return true;
}

function unregisterContextMenu() {
    if (process.platform !== 'win32') throw new Error('仅 Windows 支持');
    const targets = [
        `${REG_ROOT}\\*\\shell\\${CTX_MENU_KEY}`,
        `${REG_ROOT}\\Directory\\shell\\${CTX_MENU_KEY}`
    ];
    for (const key of targets) regDelete(key);
    return true;
}

function startServer() {
    return new Promise((resolve) => {
        const server = http.createServer((req, res) => {
            let urlPath = decodeURIComponent(req.url.split('?')[0]);
            if (urlPath === '/') urlPath = '/index.html';

            const filePath = path.join(__dirname, urlPath);
            if (!filePath.startsWith(__dirname)) {
                res.writeHead(403); res.end('Forbidden'); return;
            }

            fs.readFile(filePath, (err, data) => {
                if (err) { res.writeHead(404); res.end('Not found'); return; }
                const ext = path.extname(filePath).toLowerCase();
                res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
                res.end(data);
            });
        });
        server.on('error', (err) => {
            const msg = err.code === 'EADDRINUSE'
                ? `端口 ${PORT} 已被占用。\n\n可能已有一个 ShareBox 正在运行。\n请先关闭它，稍候重试。`
                : `本地服务启动失败：${err.message}`;
            dialog.showErrorBox('ShareBox 启动失败', msg);
            app.quit();
        });
        server.listen(PORT, '127.0.0.1', () => resolve(server));
    });
}

function buildMenu() {
    const template = [
        {
            label: '文件',
            submenu: [
                { label: '重新加载', role: 'reload' },
                { label: '强制重新加载', role: 'forceReload' },
                { label: '开发者工具', role: 'toggleDevTools' },
                { type: 'separator' },
                { label: '退出', role: 'quit' }
            ]
        },
        {
            label: '编辑',
            submenu: [
                { label: '撤销', role: 'undo' },
                { label: '重做', role: 'redo' },
                { type: 'separator' },
                { label: '剪切', role: 'cut' },
                { label: '复制', role: 'copy' },
                { label: '粘贴', role: 'paste' },
                { label: '全选', role: 'selectAll' }
            ]
        },
        {
            label: '视图',
            submenu: [
                { label: '放大', role: 'zoomIn' },
                { label: '缩小', role: 'zoomOut' },
                { label: '重置缩放', role: 'resetZoom' },
                { type: 'separator' },
                { label: '全屏', role: 'togglefullscreen' }
            ]
        },
        {
            label: '窗口',
            submenu: [
                { label: '最小化', role: 'minimize' },
                { label: '关闭', role: 'close' }
            ]
        }
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function createWindow() {
    await startServer();

    mainWindow = new BrowserWindow({
        width: 1100,
        height: 750,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, 'assets', 'icon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    mainWindow.webContents.once('did-finish-load', () => {
        const initialUpload = parseUploadArg(process.argv);
        if (initialUpload) {
            setTimeout(() => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('context-menu:upload-request', initialUpload);
                }
            }, 800);
        }
    });

    mainWindow.loadURL(`http://127.0.0.1:${PORT}/index.html`);
    // 外部链接用系统浏览器打开
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith(`http://127.0.0.1:${PORT}`)) {
            return { action: 'allow' };
        }
        if (/^https?:\/\//i.test(url)) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (url.startsWith(`http://127.0.0.1:${PORT}`)) return;
        if (/^https?:\/\//i.test(url)) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });

    // 关闭时最小化到托盘，不退出
    mainWindow.on('close', (e) => {
        if (!isQuitting) {
            e.preventDefault();
            mainWindow.hide();
            // 首次关闭提示（用系统通知，比 displayBalloon 可靠）
            if (!mainWindow._trayTipShown) {
                mainWindow._trayTipShown = true;
                if (Notification.isSupported()) {
                    new Notification({
                        title: 'ShareBox 仍在运行',
                        body: '程序已最小化到系统托盘，右键图标可退出'
                    }).show();
                }
            }
        }
    });

    // F12 / Ctrl+Shift+I 开关 DevTools（保留你原来的）
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.type !== 'keyDown') return;
        const key = (input.key || '').toLowerCase();
        if (key === 'f12' || (input.control && input.shift && key === 'i')) {
            if (mainWindow.webContents.isDevToolsOpened()) {
                mainWindow.webContents.closeDevTools();
            } else {
                mainWindow.webContents.openDevTools();
            }
            event.preventDefault();
        }
    });
}
/* ============================================================
 * 自定义图标（仅 Electron）
 * ============================================================ */
let iconsWatcher = null;
let iconsWatchTimer = null;

function getIconsDir() {
    const dir = path.join(app.getPath('userData'), 'custom-icons');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
}

function iconMimeOf(file) {
    const ext = path.extname(file).toLowerCase();
    if (ext === '.svg') return 'image/svg+xml';
    if (ext === '.png') return 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
    if (ext === '.gif') return 'image/gif';
    if (ext === '.webp') return 'image/webp';
    if (ext === '.ico') return 'image/x-icon';
    if (ext === '.bmp') return 'image/bmp';
    return null;
}

function scanCustomIcons() {
    const dir = getIconsDir();
    const files = fs.readdirSync(dir);
    const result = [];
    for (const f of files) {
        const imgExt = path.extname(f);
        const mime = iconMimeOf(f);
        if (!mime) continue;
        const base = path.basename(f, imgExt);
        const ext = base.replace(/^\./, '').toLowerCase();
        if (!ext) continue;
        try {
            const buf = fs.readFileSync(path.join(dir, f));
            const dataUrl = `data:${mime};base64,${buf.toString('base64')}`;
            result.push({ ext, fileName: f, dataUrl });
        } catch (e) {
            console.warn('读取图标失败', f, e.message);
        }
    }
    return result;
}

async function broadcastCustomIcons() {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const icons = scanCustomIcons();
    mainWindow.webContents.send('custom-icons:changed', icons);
}

function startIconsWatch() {
    if (iconsWatcher) return;
    const dir = getIconsDir();
    try {
        iconsWatcher = fs.watch(dir, { persistent: true }, () => {
            if (iconsWatchTimer) clearTimeout(iconsWatchTimer);
            iconsWatchTimer = setTimeout(() => {
                iconsWatchTimer = null;
                broadcastCustomIcons();
            }, 300);
        });
    } catch (e) {
        console.warn('fs.watch 启动失败', e.message);
    }
}

/* ============================================================
 * 右键菜单 IPC
 * ============================================================ */
function initContextMenuIPC() {
    ipcMain.handle('context-menu:isRegistered', () => isContextMenuRegistered());
    ipcMain.handle('context-menu:register', () => {
        try {
            registerContextMenu();
            return { success: true, registered: isContextMenuRegistered() };
        } catch (e) {
            return { success: false, message: e.message };
        }
    });
    ipcMain.handle('context-menu:unregister', () => {
        try {
            unregisterContextMenu();
            return { success: true, registered: isContextMenuRegistered() };
        } catch (e) {
            return { success: false, message: e.message };
        }
    });
    ipcMain.handle('context-menu:readFile', (e, filePath) => {
        if (!path.isAbsolute(filePath)) throw new Error('需要绝对路径');
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) throw new Error('不是文件');
        if (stat.size > 500 * 1024 * 1024) throw new Error('文件过大（>500MB）');
        const buf = fs.readFileSync(filePath);
        return { name: path.basename(filePath), size: stat.size, buffer: buf };
    });
}
function initCustomIcons() {
    getIconsDir();
    startIconsWatch();

    ipcMain.handle('custom-icons:list', () => scanCustomIcons());
    ipcMain.handle('custom-icons:getDir', () => getIconsDir());

    ipcMain.handle('custom-icons:openFolder', async () => {
        await shell.openPath(getIconsDir());
        return { success: true };
    });

    ipcMain.handle('custom-icons:pick', async () => {
        const res = await dialog.showOpenDialog(mainWindow, {
            title: '选择图标文件',
            filters: [
                { name: '图片', extensions: ['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'bmp'] },
                { name: '所有文件', extensions: ['*'] }
            ],
            properties: ['openFile']
        });
        if (res.canceled || !res.filePaths.length) return null;
        const filePath = res.filePaths[0];
        return { filePath, fileName: path.basename(filePath) };
    });

    ipcMain.handle('custom-icons:add', async (e, { srcPath, ext }) => {
        if (!srcPath || !ext) throw new Error('参数缺失');
        const cleanExt = String(ext).trim().toLowerCase().replace(/^\./, '');
        if (!cleanExt) throw new Error('扩展名不能为空');
        if (!/^[a-z0-9_\-]+$/.test(cleanExt)) throw new Error('扩展名只能包含字母、数字、_ 和 -');

        const srcExt = path.extname(srcPath).toLowerCase();
        if (!iconMimeOf('x' + srcExt)) throw new Error('不支持的图片格式');

        const dir = getIconsDir();
        for (const f of fs.readdirSync(dir)) {
            const base = path.basename(f, path.extname(f)).replace(/^\./, '').toLowerCase();
            if (base === cleanExt) fs.unlinkSync(path.join(dir, f));
        }
        const dst = path.join(dir, `${cleanExt}${srcExt}`);
        fs.copyFileSync(srcPath, dst);
        return { success: true, fileName: path.basename(dst) };
    });

    ipcMain.handle('custom-icons:delete', async (e, ext) => {
        if (!ext) throw new Error('参数缺失');
        const cleanExt = String(ext).trim().toLowerCase().replace(/^\./, '');
        const dir = getIconsDir();
        let removed = 0;
        for (const f of fs.readdirSync(dir)) {
            const base = path.basename(f, path.extname(f)).replace(/^\./, '').toLowerCase();
            if (base === cleanExt) {
                fs.unlinkSync(path.join(dir, f));
                removed++;
            }
        }
        return { success: true, removed };
    });

    ipcMain.handle('custom-icons:reload', async () => {
        await broadcastCustomIcons();
        return { success: true };
    });
}
function createTray() {
    const iconPath = path.join(__dirname, 'assets', 'icon.ico');
    let icon = nativeImage.createFromPath(iconPath);

    tray = new Tray(icon);
    tray.setToolTip('ShareBox');

    const menu = Menu.buildFromTemplate([
        {
            label: '显示主窗口',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        { type: 'separator' },
        {
            label: '退出 ShareBox',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(menu);

    // 双击托盘图标恢复窗口
    tray.on('double-click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}
app.whenReady().then(() => {
    app.setAppUserModelId('com.block0n.sharebox');

    // 自动授予通知权限
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === 'notifications') {
            callback(true);
        } else {
            callback(false);
        }
    });

    buildMenu();
    createWindow();
    createTray();
    initCustomIcons();
    initContextMenuIPC();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
    isQuitting = true;
    if (iconsWatcher) {
        try { iconsWatcher.close(); } catch (e) {}
        iconsWatcher = null;
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    } else if (mainWindow) {
        mainWindow.show();
    }
});
