/* ============================================================
 * 聊天室
 * ============================================================ */

/**
 * 聊天内容 Markdown 渲染
 * @param {*} text 
 * @returns 
 */
function renderChatMarkdown(text) {
    const src = String(text || '');
    if (!src) return '';

    // 分享消息 → 渲染成卡片（微信风格）
    const shareData = parseShareMessage(src);
    if (shareData) return renderShareCard(shareData);

    if (!window.marked) return escapeHtml(src).replace(/\n/g, '<br>');

    // 自定义 renderer：禁用 raw HTML，防 XSS
    const renderer = new marked.Renderer();
    renderer.html = (arg) => {
        const raw = typeof arg === 'string' ? arg : (arg && arg.text) || '';
        return escapeHtml(raw);
    };

    let html;
    try {
        html = marked.parse(src, {
            gfm: true,
            breaks: true,
            renderer
        });
    } catch (e) {
        console.warn('Markdown 渲染失败，回退纯文本', e);
        return escapeHtml(src).replace(/\n/g, '<br>');
    }

    // 所有链接：新窗口打开
    html = html.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');
    return html;
}

/** 用于丢弃过期的加载结果 */
let loadMessagesToken = 0;

/**
 * 加载历史消息
 */
async function loadMessages() {
    const token = ++loadMessagesToken;
    const box = document.getElementById("msgBox");
    showLoading(box, '正在加载聊天记录…');

    let data, error;
    try {
        const res = await withTimeout(
            sb.from("messages").select("*").order("created_at", { asc: true }),
            10000,
            '加载聊天记录'
        );
        if (token !== loadMessagesToken) return;
        data = res.data;
        error = res.error;
    } catch (e) {
        if (token !== loadMessagesToken) return;
        showLoadError(box, e.message);
        return;
    }

    if (error) {
        if (token !== loadMessagesToken) return;
        console.error("消息加载错误", error);
        showLoadError(box, '聊天记录加载失败：' + error.message);
        return;
    }
    renderMsg(data || []);
}

/**
 * 渲染消息列表
 */
function renderMsg(list) {
    const box = document.getElementById("msgBox");
    if (!list.length) {
        box.innerHTML = `
            <div class="loading-placeholder">
                <div class="loading-icon">💬</div>
                <div>暂无消息，来说点什么吧</div>
            </div>`;
        return;
    }
    box.innerHTML = list.map(i => `
        <div class="msg-item" data-id="${i.id}">
            <span class="msg-content">
                <span class="msg-meta">[${new Date(i.created_at).toLocaleString()}] <b>${escapeHtml(i.username)}</b>：</span>
                <span class="msg-body">${renderChatMarkdown(i.content)}</span>
            </span>
            <button class="msg-del" type="button" title="删除此消息">×</button>
        </div>`).join("");
    box.scrollTop = box.scrollHeight;
}

/**
 * 发送消息
 */
async function sendMsg() {
    const input = document.getElementById("msgInput");
    const name = document.getElementById("userName").value || "匿名";
    const content = input.value.trim();
    if (!content) return;
    const { error } = await sb.from("messages").insert({ username: name, content });
    if (error) {
        console.error("发送失败", error);
        await dlgAlert("发送失败", error.message);
        return;
    }
    input.value = "";
    autoResizeChatInput();
    updateMdHint();
}

/** 输入框高度随内容自适应（1~6 行） */
function autoResizeChatInput() {
    if (window.innerWidth > 720) return;
    const input = document.getElementById('msgInput');
    if (!input) return;
    input.style.height = 'auto';
    const minH = 76;
    const maxH = 200;
    const h = Math.max(input.scrollHeight, minH);
    input.style.height = Math.min(h, maxH) + 'px';
}

/* ============================================================
 * 输入提示：光标处触发 Markdown 语法提示
 * ============================================================ */
function updateMdHint() {
    const input = document.getElementById('msgInput');
    const hint = document.getElementById('mdHint');
    if (!input || !hint) return;

    const pos = input.selectionStart;
    const before = input.value.slice(0, pos);
    const lineStartIdx = before.lastIndexOf('\n') + 1;
    const currentLine = before.slice(lineStartIdx);

    let tip = '';

    // ---------- 行首模式（前面必须是行首或只有空白） ----------
    if (currentLine.length <= 6) {
        if (/^#{1,6}\s?$/.test(currentLine)) {
            tip = '# 标题（1~6 个 # 表示级别）';
        } else if (/^>\s?$/.test(currentLine)) {
            tip = '> 引用文字';
        } else if (/^[-*+]\s?$/.test(currentLine)) {
            tip = '- 无序列表';
        } else if (/^\d+\.\s?$/.test(currentLine)) {
            tip = '1. 有序列表';
        } else if (/^```\w*$/.test(currentLine)) {
            tip = '``` 代码块（可加语言名如 ```js）';
        }
    }

    // ---------- 行内模式 ----------
    if (!tip) {
        const last2 = before.slice(-2);
        const last1 = before.slice(-1);
        if (last2 === '**') tip = '**加粗文字**';
        else if (last2 === '~~') tip = '~~删除线~~';
        else if (last2 === '![') tip = '![图片描述](URL)';
        else if (last1 === '[') tip = '[链接文字](URL)';
        else if (last1 === '`' && before.slice(-2) !== '``') tip = '` 行内代码 `';
    }

    if (tip) {
        hint.textContent = tip;
        hint.classList.add('show');
    } else {
        hint.classList.remove('show');
    }
}

/** 初始化聊天输入：Enter 发送、Shift+Enter 换行 */
function initChatInput() {
    const input = document.getElementById('msgInput');
    if (!input) return;

    input.addEventListener('keydown', e => {
        // Ctrl/Cmd + B / I / K 快捷格式化
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
            const k = e.key.toLowerCase();
            if (k === 'b') { e.preventDefault(); applyMarkdownAction(input, 'bold'); return; }
            if (k === 'i') { e.preventDefault(); applyMarkdownAction(input, 'italic'); return; }
            if (k === 'k') { e.preventDefault(); applyMarkdownAction(input, 'link'); return; }
        }

        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            sendMsg();
        }
    });

    input.addEventListener('input', () => {
        autoResizeChatInput();
        updateMdHint();
    });
    input.addEventListener('click', updateMdHint);
    input.addEventListener('keyup', updateMdHint);
    autoResizeChatInput();
}

/* ============================================================
 * Markdown 工具栏
 * ============================================================ */

/**
 * 把 Markdown 语法应用到 textarea（支持选中/未选中两种情况）
 * @param {HTMLTextAreaElement} input
 * @param {string} action
 */
function applyMarkdownAction(input, action) {
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const value = input.value;
    const sel = value.slice(start, end);

    // 包裹类：前后加标记
    const wrap = (prefix, suffix, placeholder) => {
        const text = sel || placeholder;
        input.setRangeText(prefix + text + suffix, start, end, 'end');
        // 未选中时，选中 placeholder，方便直接输入替换
        if (!sel) {
            input.setSelectionRange(start + prefix.length, start + prefix.length + placeholder.length);
        }
    };

    // 行首前缀类
    const prefixLine = (prefix) => {
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        input.setRangeText(prefix, lineStart, lineStart, 'end');
        input.setSelectionRange(start + prefix.length, start + prefix.length);
    };

    switch (action) {
        case 'bold': wrap('**', '**', '加粗'); break;
        case 'italic': wrap('*', '*', '斜体'); break;
        case 'strike': wrap('~~', '~~', '删除线'); break;
        case 'code': wrap('`', '`', '代码'); break;
        case 'codeblock': {
            const text = sel || '代码';
            input.setRangeText('```\n' + text + '\n```', start, end, 'end');
            break;
        }
        case 'link': wrap('[', '](https://)', '链接文字'); break;
        case 'image': wrap('![', '](https://)', '图片描述'); break;
        case 'h': prefixLine('## '); break;
        case 'quote': prefixLine('> '); break;
        case 'ul': prefixLine('- '); break;
        case 'ol': prefixLine('1. '); break;
        default: return;
    }

    // 触发 input 事件，让自适应高度/统计等逻辑感知
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

/** 初始化工具栏 */
function initChatToolbar() {
    const bar = document.getElementById('mdToolbar');
    const input = document.getElementById('msgInput');
    if (!bar || !input) return;

    // mousedown preventDefault：防止点击按钮时 textarea 失焦（否则选择范围丢失）
    bar.addEventListener('mousedown', e => {
        if (e.target.closest('.md-btn')) e.preventDefault();
    });

    bar.addEventListener('click', e => {
        const btn = e.target.closest('.md-btn');
        if (!btn) return;
        applyMarkdownAction(input, btn.dataset.md);
        input.focus();
    });
}

/**
 * 初始化聊天室事件（刷新按钮 + 消息删除）
 */
function initChatEvents() {
    // 刷新按钮
    const btn = document.getElementById('btnChatRefresh');
    if (btn) {
        btn.addEventListener('click', () => loadMessages());
    }

    // 消息删除（事件委托）
    const box = document.getElementById('msgBox');
    if (box) {
        box.addEventListener('click', async (e) => {
            const delBtn = e.target.closest('.msg-del');
            if (!delBtn) return;
            const item = delBtn.closest('.msg-item');
            if (!item) return;

            const id = item.dataset.id;
            if (!id) return;

            const ok = await dlgConfirm('删除消息', '确定删除这条消息？', true);
            if (!ok) return;

            const { error } = await sb.from('messages').delete().eq('id', id);
            if (error) {
                console.error('删除消息失败', error);
                await dlgAlert('删除失败', error.message);
                return;
            }
            loadMessages();
        });
    }
}

/**
 * 初始化 Realtime 监听
 */
function initChatRealtime() {
    sb.channel("public_chat")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, payload => {
            loadMessages();

            // 页面在后台时弹系统通知
            if (document.visibilityState === 'hidden') {
                const row = payload.new || {};
                const name = row.username || '匿名';
                const content = row.content || '';
                showNotification(`💬 ${name}`, content);
            }
        })
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, () => loadMessages())
        .subscribe();
}