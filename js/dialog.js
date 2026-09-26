/* ============================================================
 * 通用弹窗
 * ============================================================ */

/**
 * 打开弹窗，Promise 返回结果
 * @param {object} opts
 * @param {string} [opts.title]
 * @param {string} [opts.message]
 * @param {boolean} [opts.showInput]
 * @param {string} [opts.defaultValue]
 * @param {boolean} [opts.showCancel] 默认 true
 * @param {boolean} [opts.danger]
 * @param {string} [opts.okText]
 * @returns {Promise<any>}
 */
function _openDialog(opts) {
    return new Promise(resolve => {
        const overlay = document.getElementById('dialog');
        const titleEl = document.getElementById('dialogTitle');
        const msgEl = document.getElementById('dialogMessage');
        const inputEl = document.getElementById('dialogInput');
        const okBtn = document.getElementById('dialogOk');
        const cancelBtn = document.getElementById('dialogCancel');

        titleEl.textContent = opts.title || '';
        msgEl.textContent = opts.message || '';

        const isPrompt = !!opts.showInput;
        inputEl.style.display = isPrompt ? 'block' : 'none';
        if (isPrompt) inputEl.value = opts.defaultValue || '';

        cancelBtn.style.display = opts.showCancel === false ? 'none' : '';

        okBtn.textContent = opts.okText || '确定';
        okBtn.className = 'dialog-btn ' + (opts.danger ? 'danger' : 'primary');

        overlay.classList.add('show');
        if (isPrompt) {
            setTimeout(() => { inputEl.focus(); inputEl.select(); }, 50);
        }

        const cleanup = () => {
            overlay.classList.remove('show');
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            overlay.removeEventListener('click', onOverlay);
            document.removeEventListener('keydown', onKey);
            inputEl.removeEventListener('keydown', onInputKey);
        };

        const done = (result) => { cleanup(); resolve(result); };
        const onOk = () => done(isPrompt ? inputEl.value : true);
        const onCancel = () => done(isPrompt ? null : false);
        const onOverlay = (e) => { if (e.target === overlay) onCancel(); };
        const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
        const onInputKey = (e) => {
            if (e.key === 'Enter') { e.preventDefault(); onOk(); }
        };

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        overlay.addEventListener('click', onOverlay);
        document.addEventListener('keydown', onKey);
        if (isPrompt) inputEl.addEventListener('keydown', onInputKey);
    });
}

function dlgAlert(title, message, okText) {
    return _openDialog({ title, message, okText: okText || '好', showCancel: false });
}

function dlgConfirm(title, message, danger) {
    return _openDialog({ title, message, danger: !!danger });
}

function dlgPrompt(title, message, defaultValue) {
    return _openDialog({ title, message, defaultValue, showInput: true });
}

/**
 * 多选项弹窗（横向按钮）
 */
function dlgChoose(title, message, options) {
    return new Promise(resolve => {
        const overlay = document.getElementById('dialog');
        const titleEl = document.getElementById('dialogTitle');
        const msgEl = document.getElementById('dialogMessage');
        const inputEl = document.getElementById('dialogInput');
        const okBtn = document.getElementById('dialogOk');
        const cancelBtn = document.getElementById('dialogCancel');
        const actions = cancelBtn.parentElement;

        const prevInput = inputEl.style.display;
        const prevOk = okBtn.style.display;
        const prevCancel = cancelBtn.style.display;

        titleEl.textContent = title || '';
        msgEl.textContent = message || '';
        inputEl.style.display = 'none';
        okBtn.style.display = 'none';
        cancelBtn.style.display = 'none';

        const dynBtns = [];
        for (const opt of options) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'dialog-btn ' + (opt.danger ? 'danger' : (opt.primary ? 'primary' : ''));
            btn.textContent = opt.label;
            actions.appendChild(btn);
            dynBtns.push({ btn, opt });
        }

        const cleanup = () => {
            overlay.classList.remove('show');
            dynBtns.forEach(({ btn }) => btn.remove());
            inputEl.style.display = prevInput;
            okBtn.style.display = prevOk;
            cancelBtn.style.display = prevCancel;
            overlay.removeEventListener('click', onOverlay);
            document.removeEventListener('keydown', onKey);
        };

        const finish = (value) => { cleanup(); resolve(value); };

        dynBtns.forEach(({ btn, opt }) => {
            btn.addEventListener('click', () => finish(opt.value));
        });

        const onOverlay = (e) => { if (e.target === overlay) finish(null); };
        const onKey = (e) => { if (e.key === 'Escape') finish(null); };

        overlay.addEventListener('click', onOverlay);
        document.addEventListener('keydown', onKey);
        overlay.classList.add('show');
    });
}

/**
 * 新建文件弹窗：文件名 + 内容
 */
function dlgNewFile(defaultName) {
    return new Promise(resolve => {
        const overlay = document.getElementById('newFileDialog');
        const nameInput = document.getElementById('newFileName');
        const contentArea = document.getElementById('newFileContent');
        const okBtn = document.getElementById('newFileOk');
        const cancelBtn = document.getElementById('newFileCancel');

        nameInput.value = defaultName || 'untitled.txt';
        contentArea.value = '';

        const cleanup = () => {
            overlay.classList.remove('show');
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            overlay.removeEventListener('click', onOverlay);
            document.removeEventListener('keydown', onKey);
        };

        const finish = (v) => { cleanup(); resolve(v); };
        const onOk = () => finish({ name: nameInput.value, content: contentArea.value });
        const onCancel = () => finish(null);
        const onOverlay = (e) => { if (e.target === overlay) onCancel(); };
        const onKey = (e) => { if (e.key === 'Escape') onCancel(); };

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        overlay.addEventListener('click', onOverlay);
        document.addEventListener('keydown', onKey);

        overlay.classList.add('show');
        setTimeout(() => { nameInput.focus(); nameInput.select(); }, 50);
    });
}

/**
 * 打开方式列表弹窗（竖列表）
 */
function dlgOpenWith(title, message, options) {
    return new Promise(resolve => {
        const overlay = document.getElementById('openWithDialog');
        const titleEl = document.getElementById('openWithTitle');
        const msgEl = document.getElementById('openWithMessage');
        const listEl = document.getElementById('openWithList');
        const cancelBtn = document.getElementById('openWithCancel');

        titleEl.textContent = title || '打开方式';
        msgEl.textContent = message || '';
        listEl.innerHTML = '';

        const cleanup = () => {
            overlay.classList.remove('show');
            cancelBtn.removeEventListener('click', onCancel);
            overlay.removeEventListener('click', onOverlay);
            document.removeEventListener('keydown', onKey);
        };

        const finish = (v) => { cleanup(); resolve(v); };

        for (const opt of options) {
            const el = document.createElement('div');
            el.className = 'open-with-item';
            el.innerHTML =
                `<span class="open-with-icon">${opt.icon || '📄'}</span>` +
                `<span class="open-with-name">${escapeHtml(opt.label)}</span>` +
                (opt.default ? '<span class="open-with-default">推荐</span>' : '');
            el.addEventListener('click', () => finish(opt.value));
            listEl.appendChild(el);
        }

        const onCancel = () => finish(null);
        const onOverlay = (e) => { if (e.target === overlay) onCancel(); };
        const onKey = (e) => { if (e.key === 'Escape') onCancel(); };

        cancelBtn.addEventListener('click', onCancel);
        overlay.addEventListener('click', onOverlay);
        document.addEventListener('keydown', onKey);
        overlay.classList.add('show');
    });
}