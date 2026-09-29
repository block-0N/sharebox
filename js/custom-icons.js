/* ============================================================
 * 自定义图标（仅 Electron 环境）
 * ============================================================ */
(function () {
    if (typeof window.shareboxAPI === 'undefined' || !window.shareboxAPI.icons) {
        return;
    }

    window.__CUSTOM_ICONS__ = {};

    let pickedFilePath = null;
    let pickedFileName = null;

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
                el.innerHTML = '<div class="custom-icons-empty">还没有自定义图标，点击下方「+ 添加图标」开始</div>';
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

    function showAddForm() {
        const form = document.getElementById('iconAddForm');
        if (!form) return;

        pickedFilePath = null;
        pickedFileName = null;

        const nameEl = document.getElementById('iconAddFileName');
        if (nameEl) {
            nameEl.textContent = '未选择';
            nameEl.classList.remove('has-file');
        }
        const extInput = document.getElementById('iconAddExt');
        if (extInput) extInput.value = '';

        form.classList.add('show');
        const pickBtn = document.getElementById('btnPickIconFile');
        if (pickBtn) pickBtn.focus();
    }

    function hideAddForm() {
        const form = document.getElementById('iconAddForm');
        if (form) form.classList.remove('show');
        pickedFilePath = null;
        pickedFileName = null;
    }

    async function pickIconFile() {
        try {
            const picked = await window.shareboxAPI.icons.pick();
            if (!picked) return;

            pickedFilePath = picked.filePath;
            pickedFileName = picked.fileName;

            const nameEl = document.getElementById('iconAddFileName');
            if (nameEl) {
                nameEl.textContent = picked.fileName;
                nameEl.classList.add('has-file');
                nameEl.title = picked.filePath;
            }

            const extInput = document.getElementById('iconAddExt');
            if (extInput && !extInput.value) {
                const m = String(picked.fileName).match(/^([^.]+)\./);
                if (m) extInput.value = m[1].toLowerCase();
            }
            if (extInput) {
                extInput.focus();
                extInput.select();
            }
        } catch (e) {
            await dlgAlert('选择文件失败', e.message || String(e));
        }
    }

    async function confirmAddIcon() {
        if (!pickedFilePath) {
            await dlgAlert('提示', '请先选择图标文件');
            return;
        }
        const extInput = document.getElementById('iconAddExt');
        const cleanExt = String(extInput ? extInput.value : '').trim().toLowerCase().replace(/^\./, '');

        if (!cleanExt) {
            await dlgAlert('提示', '请填写关联的扩展名');
            if (extInput) extInput.focus();
            return;
        }
        if (!/^[a-z0-9_\-]+$/.test(cleanExt)) {
            await dlgAlert('提示', '扩展名只能包含字母、数字、下划线和横杠');
            if (extInput) extInput.focus();
            return;
        }

        try {
            await window.shareboxAPI.icons.add(pickedFilePath, cleanExt);
            showToast(`已添加 .${cleanExt} 图标`, 'success');
            hideAddForm();
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

    async function changeIconDir() {
        try {
            const newDir = await window.shareboxAPI.icons.pickDir();
            if (!newDir) return;

            const ok = await dlgConfirm(
                '更改图标目录',
                `确定将图标目录更改为：\n\n${newDir}\n\n旧目录里的图标会自动复制到新目录（同名跳过）。`,
                false
            );
            if (!ok) return;

            showToast('正在迁移图标…', 'info', 1500);

            const res = await window.shareboxAPI.icons.setDir(newDir);
            if (res && res.success) {
                showToast(
                    `已切换，迁移 ${res.migrated} 个图标` + (res.skipped ? `，跳过 ${res.skipped} 个同名` : ''),
                    'success',
                    3000
                );
                await updateDirPath();
                await refreshDialogList();
            } else {
                await dlgAlert('切换失败', (res && res.message) || '未知错误');
            }
        } catch (e) {
            await dlgAlert('切换失败', e.message || String(e));
        }
    }

    function init() {
        window.shareboxAPI.icons.list().then(applyIcons).catch(e => console.warn('加载自定义图标失败', e));

        window.shareboxAPI.icons.onChanged(list => {
            applyIcons(list);
            if (typeof showToast === 'function') showToast('自定义图标已更新', 'info', 1500);
            const ov = document.getElementById('settingsDialog');
            if (ov && ov.classList.contains('show')) refreshDialogList();
        });

        const addBtn = document.getElementById('btnAddIcon');
        if (addBtn) addBtn.addEventListener('click', showAddForm);

        const reloadBtn = document.getElementById('btnReloadIcons');
        if (reloadBtn) reloadBtn.addEventListener('click', reloadIcons);

        const openDirBtn = document.getElementById('btnOpenIconDir');
        if (openDirBtn) openDirBtn.addEventListener('click', openIconFolder);


        const changeDirBtn = document.getElementById('btnChangeIconDir');
        if (changeDirBtn) changeDirBtn.addEventListener('click', changeIconDir);

        const pickBtn = document.getElementById('btnPickIconFile');
        if (pickBtn) pickBtn.addEventListener('click', pickIconFile);

        const cancelAddBtn = document.getElementById('btnCancelAddIcon');
        if (cancelAddBtn) cancelAddBtn.addEventListener('click', hideAddForm);

        const confirmAddBtn = document.getElementById('btnConfirmAddIcon');
        if (confirmAddBtn) confirmAddBtn.addEventListener('click', confirmAddIcon);

        const extInput = document.getElementById('iconAddExt');
        if (extInput) {
            extInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    confirmAddIcon();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    hideAddForm();
                }
            });
        }

        window.shareboxCustomIcons = {
            refresh: refreshDialogList,
            reset: hideAddForm,
            initDir: updateDirPath
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 0);
    }
})();