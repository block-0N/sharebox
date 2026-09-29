/* ============================================================
 * 设置面板（含 Windows 右键菜单 + 自定义图标）
 * ============================================================ */
(function () {
    if (typeof window.shareboxAPI === 'undefined') return;

    let ctxRegistered = false;

    async function updateCtxUI() {
        const status = document.getElementById('ctxStatus');
        const btn = document.getElementById('btnToggleCtx');
        if (!status || !btn) return;

        if (!window.shareboxAPI.contextMenu) {
            status.textContent = '仅 Windows 支持';
            btn.textContent = '不可用';
            btn.disabled = true;
            return;
        }

        try {
            ctxRegistered = await window.shareboxAPI.contextMenu.isRegistered();
            if (ctxRegistered) {
                status.textContent = '已注册';
                status.className = 'settings-status registered';
                btn.textContent = '取消注册';
                btn.className = 'dialog-btn del';
            } else {
                status.textContent = '未注册';
                status.className = 'settings-status';
                btn.textContent = '注册';
                btn.className = 'dialog-btn primary';
            }
            btn.disabled = false;
        } catch (e) {
            status.textContent = '检测失败：' + (e.message || e);
            btn.textContent = '重试';
            btn.disabled = false;
        }
    }

    async function toggleCtx() {
        const btn = document.getElementById('btnToggleCtx');
        if (!btn) return;
        btn.disabled = true;
        const oldText = btn.textContent;
        btn.textContent = '处理中…';
        try {
            const res = ctxRegistered
                ? await window.shareboxAPI.contextMenu.unregister()
                : await window.shareboxAPI.contextMenu.register();
            if (res && res.success) {
                showToast(ctxRegistered ? '已取消注册' : '已注册', 'success');
            } else {
                await dlgAlert('操作失败', (res && res.message) || '未知错误');
            }
        } catch (e) {
            await dlgAlert('操作失败', e.message || String(e));
        }
        await updateCtxUI();
    }

    async function openSettings() {
        const overlay = document.getElementById('settingsDialog');
        if (!overlay) return;
        overlay.classList.add('show');
        await updateCtxUI();
        if (window.shareboxCustomIcons) {
            await window.shareboxCustomIcons.initDir();
            await window.shareboxCustomIcons.refresh();
        }
    }

    function closeSettings() {
        if (window.shareboxCustomIcons) window.shareboxCustomIcons.reset();
        const overlay = document.getElementById('settingsDialog');
        if (overlay) overlay.classList.remove('show');
    }

    /* ---------- 系统右键菜单上传 ---------- */

    async function handleUploadRequest(filePath) {
        if (!filePath) return;
        try {
            const res = await window.shareboxAPI.contextMenu.readFile(filePath);
            if (!res || !res.name || !res.buffer) {
                await dlgAlert('上传失败', '读取文件失败');
                return;
            }

            const bytes = res.buffer instanceof Uint8Array
                ? res.buffer
                : new Uint8Array(res.buffer);

            const file = new File([bytes], res.name);

            const basePath = typeof getCurrentPath === 'function' ? getCurrentPath() : [];
            const targetPath = buildFullPath(basePath, res.name);

            await doUploadItems([{ file, path: targetPath }], false);
        } catch (e) {
            await dlgAlert('上传失败', e.message || String(e));
        }
    }

    function init() {
        const settingsBtn = document.getElementById('btnSettings');
        if (settingsBtn) {
            // 有主进程支持才显示按钮
            if (window.shareboxAPI.contextMenu || window.shareboxAPI.icons) {
                settingsBtn.style.display = '';
                settingsBtn.addEventListener('click', openSettings);
            }
        }

        const closeBtn = document.getElementById('btnCloseSettings');
        if (closeBtn) closeBtn.addEventListener('click', closeSettings);

        const toggleBtn = document.getElementById('btnToggleCtx');
        if (toggleBtn) toggleBtn.addEventListener('click', toggleCtx);

        const overlay = document.getElementById('settingsDialog');
        if (overlay) {
            overlay.addEventListener('click', e => {
                if (e.target === overlay) closeSettings();
            });
        }

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                const ov = document.getElementById('settingsDialog');
                if (ov && ov.classList.contains('show')) closeSettings();
            }
        });

        if (window.shareboxAPI.contextMenu && window.shareboxAPI.contextMenu.onUploadRequest) {
            window.shareboxAPI.contextMenu.onUploadRequest(handleUploadRequest);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 0);
    }
})();