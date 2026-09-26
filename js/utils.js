/* ============================================================
 * 通用工具
 * ============================================================ */

/**
 * HTML 转义
 */
function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;',
        '"': '&quot;', "'": '&#39;'
    }[c]));
}

function formatMs(ms) {
    const s = Math.round(ms / 1000);
    if (s < 60) return `预计剩余 ${s}秒`;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `预计剩余 ${m}分${sec}秒`;
}

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

function formatTime(t) {
    if (!t) return '';
    const d = t instanceof Date ? t : new Date(t);
    if (isNaN(d.getTime())) return '';
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 给 Promise 加超时
 */
function withTimeout(promise, ms = 15000, label = '请求') {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(
            () => reject(new Error(`${label}超时（${ms / 1000}秒）`)),
            ms
        );
    });
    return Promise.race([promise, timeoutPromise]).finally(() => {
        clearTimeout(timer);
    });
}

/**
 * 在容器里显示加载中
 */
function showLoading(container, msg) {
    if (!container) return;
    container.innerHTML = `
        <div class="loading-placeholder">
            <div class="spinner"></div>
            <div>${escapeHtml(msg || '正在加载…')}</div>
        </div>`;
}

/**
 * 在容器里显示加载失败
 */
function showLoadError(container, msg) {
    if (!container) return;
    container.innerHTML = `
        <div class="loading-placeholder">
            <div class="loading-icon">⚠</div>
            <div class="loading-error">${escapeHtml(msg || '加载失败')}</div>
        </div>`;
}

/* ============================================================
 * 主题切换
 * ============================================================ */

function initThemeToggle() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const dark = document.body.classList.toggle('dark');
        btn.textContent = dark ? '☀️ 浅色' : '🌙 深色';

        const light = document.getElementById('hljsLight');
        const darkLink = document.getElementById('hljsDark');
        if (light) light.media = dark ? 'not all' : 'all';
        if (darkLink) darkLink.media = dark ? 'all' : 'not all';
    });
}

/* ============================================================
 * 系统通知
 * ============================================================ */

let notifyEnabled = localStorage.getItem('notifyEnabled') === '1';

function updateNotifyBtn() {
    const btn = document.getElementById('notifyToggle');
    if (!btn) return;
    if (notifyEnabled) {
        btn.classList.add('on');
        btn.textContent = '🔔 通知';
        btn.title = '点击关闭桌面通知';
    } else {
        btn.classList.remove('on');
        btn.textContent = '🔕 通知';
        btn.title = '点击开启桌面通知';
    }
}

function initNotifyToggle() {
    const btn = document.getElementById('notifyToggle');
    if (!btn) return;
    updateNotifyBtn();

    btn.addEventListener('click', async () => {
        if (notifyEnabled) {
            notifyEnabled = false;
            localStorage.setItem('notifyEnabled', '0');
            updateNotifyBtn();
            return;
        }

        if (!('Notification' in window)) {
            await dlgAlert('不支持', '当前环境不支持系统通知');
            return;
        }

        let perm = Notification.permission;
        if (perm === 'default') {
            perm = await Notification.requestPermission();
        }
        if (perm !== 'granted') {
            await dlgAlert('通知被拒绝', '请在浏览器/系统设置里允许本页面发送通知');
            return;
        }

        notifyEnabled = true;
        localStorage.setItem('notifyEnabled', '1');
        updateNotifyBtn();
    });
}

function showNotification(title, body) {
    if (!notifyEnabled) return;

    // Electron 环境走 IPC
    if (window.shareboxAPI && window.shareboxAPI.notify) {
        window.shareboxAPI.notify(title, body);
        return;
    }

    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
        const n = new Notification(title, {
            body,
            icon: './build/icon.png',
            tag: 'sharebox-chat'
        });
        n.onclick = () => {
            window.focus();
            const chatTab = document.querySelector('.tab[data-tab="chat"]');
            if (chatTab) chatTab.click();
            n.close();
        };
    } catch (e) {
        console.warn('通知发送失败', e);
    }
}

/* ============================================================
 * 主标签切换（聊天室 / 网盘）
 * ============================================================ */

function initMainTabs() {
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