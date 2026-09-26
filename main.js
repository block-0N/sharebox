const { app, BrowserWindow, Menu, Tray, nativeImage } = require('electron');
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
        icon: path.join(__dirname, 'build', 'icon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
        },
    });

    mainWindow.loadURL(`http://127.0.0.1:${PORT}/index.html`);

    // 关闭时最小化到托盘，不退出
    mainWindow.on('close', (e) => {
        if (!isQuitting) {
            e.preventDefault();
            mainWindow.hide();
            // 首次关闭提示
            if (tray && !mainWindow._trayTipShown) {
                mainWindow._trayTipShown = true;
                tray.displayBalloon({
                    title: 'ShareBox 仍在运行',
                    content: '程序已最小化到系统托盘，右键图标可退出'
                });
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
function createTray() {
    const iconPath = path.join(__dirname, 'build', 'icon.ico');
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
    buildMenu();
    createWindow();
    createTray();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
    isQuitting = true;
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    } else if (mainWindow) {
        mainWindow.show();
    }
});