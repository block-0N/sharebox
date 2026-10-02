/* ============================================================
 * 设置面板（Windows 右键菜单 + 自定义图标 + 数据存储路径）
 * ============================================================ */
(function () {
    if (typeof window.shareboxAPI === 'undefined') return;

    let ctxRegistered = false;

    /* ============================================================
     * Windows 右键菜单
     * ============================================================ */
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

    /* ============================================================
     * 数据 / 缓存目录
     * ============================================================ */
    async function updatePathsUI() {
        const dataEl = document.getElementById('dataDirValue');
        const cacheEl = document.getElementById('cacheDirValue');
        if (!dataEl || !cacheEl) return;
        if (!window.shareboxAPI.paths) return;

        try {
            const dataDir = await window.shareboxAPI.paths.getDataDir();
            dataEl.textContent = dataDir;
            dataEl.title = dataDir;
        } catch (e) { dataEl.textContent = '（读取失败）'; }

        try {
            const cacheDir = await window.shareboxAPI.paths.getCacheDir();
            cacheEl.textContent = cacheDir;
            cacheEl.title = cacheDir;
        } catch (e) { cacheEl.textContent = '（读取失败）'; }
    }

    /** 询问是否立即重启 */
    async function askRestart() {
        const ok = await dlgConfirm(
            '需要重启',
            '更改已保存，需要重启应用才能生效。\n\n是否立即重启？',
            false
        );
        if (ok) {
            try {
                await window.shareboxAPI.paths.restart();
            } catch (e) {
                await dlgAlert('重启失败', '请手动退出应用后重新打开。\n\n' + (e.message || ''));
            }
        } else {
            showToast('请手动退出应用后重新打开', 'info', 5000);
        }
    }

    async function changeDataDir() {
        try {
            const newDir = await window.shareboxAPI.paths.pickDataDir();
            if (!newDir) return;

            // 目标目录已有内容的提示
            let extra = '';
            try {
                // 让主进程检查一遍（或直接提示）
                const currentDir = await window.shareboxAPI.paths.getDataDir();
                if (newDir === currentDir) {
                    await dlgAlert('提示', '选择的目录就是当前数据目录');
                    return;
                }
            } catch (e) { }

            const ok = await dlgConfirm(
                '更改数据目录',
                `将数据目录更改为：\n\n${newDir}\n\n` +
                `当前数据会自动复制到新目录（同名跳过）。\n` +
                `目标目录里已有的文件不会被删除。\n\n继续？`,
                false
            );
            if (!ok) return;

            showToast('正在复制数据…', 'info', 2000);

            const res = await window.shareboxAPI.paths.setDataDir(newDir);
            if (res && res.success) {
                showToast(
                    `已更改，复制 ${res.migrated} 项` +
                    (res.skipped ? `，跳过 ${res.skipped} 项` : ''),
                    'success',
                    3000
                );
                await askRestart();
            } else {
                await dlgAlert('更改失败', (res && res.message) || '未知错误');
            }
        } catch (e) {
            await dlgAlert('更改失败', e.message || String(e));
        }
    }

    async function changeCacheDir() {
        try {
            const newDir = await window.shareboxAPI.paths.pickCacheDir();
            if (!newDir) return;

            const currentDir = await window.shareboxAPI.paths.getCacheDir();
            if (newDir === currentDir) {
                await dlgAlert('提示', '选择的目录就是当前缓存目录');
                return;
            }

            const ok = await dlgConfirm(
                '更改缓存目录',
                `将缓存目录更改为：\n\n${newDir}\n\n` +
                `缓存是临时文件，不会迁移（重启后自动重建）。\n\n继续？`,
                false
            );
            if (!ok) return;

            const res = await window.shareboxAPI.paths.setCacheDir(newDir);
            if (res && res.success) {
                showToast('已更改缓存目录', 'success');
                await askRestart();
            } else {
                await dlgAlert('更改失败', (res && res.message) || '未知错误');
            }
        } catch (e) {
            await dlgAlert('更改失败', e.message || String(e));
        }
    }

    async function resetDefaults() {
        const ok = await dlgConfirm(
            '恢复默认路径',
            '将数据目录和缓存目录恢复为系统默认位置。\n\n' +
            '当前自定义目录里的文件不会被删除。\n\n继续？',
            true
        );
        if (!ok) return;
        try {
            const res = await window.shareboxAPI.paths.resetDefaults();
            if (res && res.success) {
                showToast('已恢复默认路径', 'success');
                await askRestart();
            } else {
                await dlgAlert('操作失败', (res && res.message) || '未知错误');
            }
        } catch (e) {
            await dlgAlert('操作失败', e.message || String(e));
        }
    }

    /* ============================================================
     * 面板开关
     * ============================================================ */
    async function openSettings() {
        const overlay = document.getElementById('settingsDialog');
        if (!overlay) return;
        overlay.classList.add('show');
        await updateCtxUI();
        await updatePathsUI();
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

    /* ============================================================
     * 系统右键菜单上传
     * ============================================================ */
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

    /* ============================================================
     * 初始化
     * ============================================================ */
    function init() {
        const settingsBtn = document.getElementById('btnSettings');
        if (settingsBtn) {
            if (window.shareboxAPI.contextMenu || window.shareboxAPI.icons || window.shareboxAPI.paths) {
                settingsBtn.style.display = '';
                settingsBtn.addEventListener('click', openSettings);
            }
        }

        const closeBtn = document.getElementById('btnCloseSettings');
        if (closeBtn) closeBtn.addEventListener('click', closeSettings);

        const toggleBtn = document.getElementById('btnToggleCtx');
        if (toggleBtn) toggleBtn.addEventListener('click', toggleCtx);

        const changeDataBtn = document.getElementById('btnChangeDataDir');
        if (changeDataBtn) changeDataBtn.addEventListener('click', changeDataDir);

        const changeCacheBtn = document.getElementById('btnChangeCacheDir');
        if (changeCacheBtn) changeCacheBtn.addEventListener('click', changeCacheDir);

        const resetBtn = document.getElementById('btnResetDefaults');
        if (resetBtn) resetBtn.addEventListener('click', resetDefaults);

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