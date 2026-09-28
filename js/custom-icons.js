/* ============================================================
 * 自定义图标（仅 Electron 环境）
 * ============================================================ */
(function () {
    if (typeof window.shareboxAPI === 'undefined' || !window.shareboxAPI.icons) {
        return;
    }

    window.__CUSTOM_ICONS__ = {};

    function applyIcons(list) {
        const map = {};
        for (const it of (list || [])) {
            if (it && it.ext && it.dataUrl) {
                map[String(it.ext).toLowerCase()] = it.dataUrl;
            }
        }
        window.__CUSTOM_ICONS__ = map;
        if (typeof renderFileList === 'function') {
            try { renderFileList(); } catch (e) { console.warn(e); }
        }
    }

    async function refreshDialogList() {
        const el = document.getElementById('customIconsList');
        if (!el) return;
        try {
            const list = await window.shareboxAPI.icons.list();
            if (!list.length) {
                el.innerHTML = '<div class="custom-icons-empty">还没有自定义图标</div>';
                return;
            }
            el.innerHTML = list.map(it => `
                <div class="custom-icon-row">
                    <span class="custom-icon-ext">.${escapeHtml(it.ext)}</span>
                    <span class="custom-icon-preview"><img src="${it.dataUrl}" alt=""></span>
                    <button class="dialog-btn del" data-ext="${escapeHtml(it.ext)}" type="button">删除</button>
                </div>
            `).join('');
            el.querySelectorAll('button[data-ext]').forEach(btn => {
                btn.addEventListener('click', () => removeIcon(btn.dataset.ext));
            });
        } catch (e) {
            el.innerHTML = `<div class="custom-icons-empty">加载失败：${escapeHtml(e.message || String(e))}</div>`;
        }
    }

    async function updateDirPath() {
        const el = document.getElementById('iconDirPath');
        if (!el) return;
        try {
            const dir = await window.shareboxAPI.icons.getDir();
            el.textContent = dir;
            el.title = dir;
        } catch (e) {
            el.textContent = '（读取失败）';
        }
    }

    async function openIconDialog() {
        const overlay = document.getElementById('customIconsDialog');
        if (!overlay) return;
        overlay.classList.add('show');
        await updateDirPath();
        await refreshDialogList();
    }

    function closeIconDialog() {
        const overlay = document.getElementById('customIconsDialog');
        if (overlay) overlay.classList.remove('show');
    }

    function guessExt(fileName) {
        const m = String(fileName || '').match(/^([^.]+)\./);
        return m ? m[1].toLowerCase() : '';
    }

    async function addIcon() {
        try {
            const picked = await window.shareboxAPI.icons.pick();
            if (!picked) return;
            const suggested = guessExt(picked.fileName) || '';
            const input = await dlgPrompt(
                '关联扩展名',
                `为「${picked.fileName}」指定要替换的扩展名（不含点）`,
                suggested
            );
            if (input === null) return;
            const cleanExt = String(input).trim().toLowerCase().replace(/^\./, '');
            if (!cleanExt) {
                await dlgAlert('提示', '扩展名不能为空');
                return;
            }
            await window.shareboxAPI.icons.add(picked.filePath, cleanExt);
            showToast(`已添加 .${cleanExt} 图标`, 'success');
            await refreshDialogList();
        } catch (e) {
            await dlgAlert('添加失败', e.message || String(e));
        }
    }

    async function removeIcon(ext) {
        const ok = await dlgConfirm('删除图标', `确定删除 .${ext} 的自定义图标吗？`, true);
        if (!ok) return;
        try {
            await window.shareboxAPI.icons.delete(ext);
            showToast('已删除', 'success');
            await refreshDialogList();
        } catch (e) {
            await dlgAlert('删除失败', e.message || String(e));
        }
    }

    async function reloadIcons() {
        try {
            await window.shareboxAPI.icons.reload();
            showToast('已重载', 'info');
            await refreshDialogList();
        } catch (e) {
            await dlgAlert('重载失败', e.message || String(e));
        }
    }

    async function openIconFolder() {
        try {
            await window.shareboxAPI.icons.openFolder();
        } catch (e) {
            await dlgAlert('打开目录失败', e.message || String(e));
        }
    }

    function init() {
        const btn = document.getElementById('btnCustomIcons');
        if (btn) {
            btn.style.display = '';
            btn.addEventListener('click', openIconDialog);
        }

        window.shareboxAPI.icons.list().then(applyIcons).catch(e => console.warn('加载自定义图标失败', e));

        window.shareboxAPI.icons.onChanged(list => {
            applyIcons(list);
            if (typeof showToast === 'function') showToast('自定义图标已更新', 'info', 1500);
            const ov = document.getElementById('customIconsDialog');
            if (ov && ov.classList.contains('show')) refreshDialogList();
        });

        const closeBtn = document.getElementById('btnCloseIcons');
        if (closeBtn) closeBtn.addEventListener('click', closeIconDialog);

        const addBtn = document.getElementById('btnAddIcon');
        if (addBtn) addBtn.addEventListener('click', addIcon);

        const reloadBtn = document.getElementById('btnReloadIcons');
        if (reloadBtn) reloadBtn.addEventListener('click', reloadIcons);

        const openDirBtn = document.getElementById('btnOpenIconDir');
        if (openDirBtn) openDirBtn.addEventListener('click', openIconFolder);

        const overlay = document.getElementById('customIconsDialog');
        if (overlay) {
            overlay.addEventListener('click', e => {
                if (e.target === overlay) closeIconDialog();
            });
        }
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                const ov = document.getElementById('customIconsDialog');
                if (ov && ov.classList.contains('show')) closeIconDialog();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 0);
    }
})();