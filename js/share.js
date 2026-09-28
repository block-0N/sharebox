/* ============================================================
 * 分享文件
 * ============================================================ */

/** 分享消息前缀（不显示给用户，仅内部识别） */
const SHARE_PREFIX = '📎SHARE:';

/** 分享文件上传目标目录（网盘里） */
const SHARE_FOLDER = '文件';

/* ---------- 数据层 ---------- */

function buildShareMessage(url, name, size) {
    const data = { url, name };
    if (size && size > 0) data.size = size;
    return SHARE_PREFIX + JSON.stringify(data);
}

function parseShareMessage(content) {
    if (typeof content !== 'string') return null;
    if (!content.startsWith(SHARE_PREFIX)) return null;
    try {
        const data = JSON.parse(content.slice(SHARE_PREFIX.length));
        if (!data || !data.url) return null;
        return data;
    } catch (e) {
        return null;
    }
}

/* ---------- 渲染 ---------- */

function renderShareCard(data) {
    const name = escapeHtml(data.name || '分享文件');
    const sizeText = data.size ? formatBytes(data.size) : '点击查看或下载';
    const icon = getFileIconUrl(data.name || '');
    const payload = escapeHtml(JSON.stringify(data));

    return `<div class="share-card" data-share="${payload}" title="点击查看或下载">
        <div class="share-card-icon">
            <img src="${icon}" alt="" onerror="this.onerror=null;this.src='${DEFAULT_FILE_ICON}'">
        </div>
        <div class="share-card-info">
            <div class="share-card-name">${name}</div>
            <div class="share-card-meta">${sizeText}</div>
        </div>
    </div>`;
}

/* ---------- 工具 ---------- */

/** 从 URL 猜文件名（第三方链接或网盘直链） */
function fileNameFromUrl(url) {
    try {
        const u = new URL(url);
        const seg = u.pathname.split('/').filter(Boolean).pop() || '';
        return decodeURIComponent(seg) || '分享文件';
    } catch (e) {
        const seg = String(url).split('?')[0].split('#')[0].split('/').filter(Boolean).pop();
        try { return decodeURIComponent(seg || '分享文件'); }
        catch { return seg || '分享文件'; }
    }
}

/** 上传文件到 /文件 目录，返回 { url, name, size } */
async function uploadShareFile() {
    if (!window.showOpenFilePicker) {
        throw new Error('当前环境不支持选择文件（请手动输入链接）');
    }
    const [handle] = await window.showOpenFilePicker();
    const file = await handle.getFile();

    const fullPath = `${SHARE_FOLDER}/${file.name}`;
    const ok = await uploadSingleFileWithPath(file, fullPath);
    if (!ok) throw new Error('上传失败');

    // 查询刚上传的记录
    const { data: rows, error } = await sb.from('file_list')
        .select('*')
        .eq('file_name', fullPath)
        .order('created_at', { ascending: false })
        .limit(1);
    if (error || !rows || !rows[0]) throw new Error('上传成功但读取记录失败');

    const row = rows[0];
    // 刷新文件列表（让新文件出现在网盘里）
    if (typeof loadFiles === 'function') loadFiles();

    return { url: row.file_url, name: file.name, size: file.size };
}

/* ---------- 分享对话框 ---------- */

function openShareDialog() {
    return new Promise(resolve => {
        const overlay = document.getElementById('shareDialog');
        const urlInput = document.getElementById('shareUrlInput');
        const uploadBtn = document.getElementById('shareUploadBtn');
        const statusEl = document.getElementById('shareUploadStatus');
        const okBtn = document.getElementById('shareOk');
        const cancelBtn = document.getElementById('shareCancel');

        urlInput.value = '';
        statusEl.textContent = '';
        statusEl.className = 'share-upload-status';

        /** 已上传文件元数据（如果用户上传了） */
        let uploaded = null;

        const cleanup = () => {
            overlay.classList.remove('show');
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            uploadBtn.removeEventListener('click', onUpload);
            overlay.removeEventListener('click', onOverlay);
            document.removeEventListener('keydown', onKey);
        };
        const finish = (v) => { cleanup(); resolve(v); };

        const onOk = () => {
            const url = urlInput.value.trim();
            if (!url) {
                if (typeof dlgAlert === 'function') dlgAlert('提示', '请输入链接或先上传文件');
                return;
            }
            // 如果 URL 就是刚上传得到的，用已知信息；否则从 URL 猜
            if (uploaded && uploaded.url === url) {
                finish({ url, name: uploaded.name, size: uploaded.size });
            } else {
                finish({ url, name: fileNameFromUrl(url) });
            }
        };

        const onCancel = () => finish(null);
        const onOverlay = (e) => { if (e.target === overlay) onCancel(); };
        const onKey = (e) => { if (e.key === 'Escape') onCancel(); };

        const onUpload = async () => {
            uploadBtn.disabled = true;
            statusEl.textContent = '选择文件中…';
            statusEl.className = 'share-upload-status';
            try {
                const result = await uploadShareFile();
                uploaded = result;
                urlInput.value = result.url;
                statusEl.textContent = `✓ 已上传：${result.name}（${formatBytes(result.size)}）`;
                statusEl.className = 'share-upload-status success';
            } catch (e) {
                if (e.name === 'AbortError') {
                    statusEl.textContent = '';
                } else {
                    statusEl.textContent = e.message || '上传失败';
                    statusEl.className = 'share-upload-status error';
                }
            }
            uploadBtn.disabled = false;
        };

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        uploadBtn.addEventListener('click', onUpload);
        overlay.addEventListener('click', onOverlay);
        document.addEventListener('keydown', onKey);
        overlay.classList.add('show');
        setTimeout(() => urlInput.focus(), 50);
    });
}

/* ---------- 点击卡片 → 弹窗选择操作 ---------- */

async function handleShareCardClick(data) {
    if (!data || !data.url) return;
    const fallbackName = fileNameFromUrl(data.url);
    const displayName = data.name || fallbackName;

    const choice = await dlgChoose(
        '分享文件',
        displayName,
        [
            { label: '预览', value: 'preview', primary: true },
            { label: '下载', value: 'download' },
            { label: '复制链接', value: 'copy' }
        ]
    );
    if (!choice) return;

    if (choice === 'preview') {
        // 构造一个符合 openPreview 接口的伪 file 对象
        const fileObj = {
            displayName,
            file_name: displayName,
            file_url: data.url,
            storage_path: null,
            _size: data.size || 0
        };
        openPreview(fileObj);
    } else if (choice === 'download') {
        downloadFile(displayName, data.url);
    } else if (choice === 'copy') {
        try {
            await navigator.clipboard.writeText(data.url);
            showToast('分享链接已复制', 'success');
        } catch (e) {
            showToast('复制失败', 'error');
        }
    }
}

/* ---------- 初始化 ---------- */

function initShare() {
    // 分享按钮
    const btn = document.getElementById('btnShareFile');
    if (btn) {
        btn.addEventListener('click', async () => {
            const data = await openShareDialog();
            if (!data) return;
            const name = document.getElementById('userName').value || '匿名';
            const content = buildShareMessage(data.url, data.name, data.size);
            const { error } = await sb.from('messages').insert({ username: name, content });
            if (error) {
                await dlgAlert('分享失败', error.message);
                return;
            }
            showToast('已分享到聊天室', 'success');
        });
    }

    // 事件委托：点击分享卡片
    const box = document.getElementById('msgBox');
    if (box) {
        box.addEventListener('click', (e) => {
            const card = e.target.closest('.share-card');
            if (!card) return;
            e.stopPropagation();
            try {
                const data = JSON.parse(card.dataset.share);
                handleShareCardClick(data);
            } catch (err) {
                console.error('解析分享数据失败', err);
            }
        });
    }
}