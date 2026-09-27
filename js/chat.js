/* ============================================================
 * 聊天室
 * ============================================================ */

/* ============================================================
 * 聊天内容 Markdown 渲染
 * ============================================================ */
function renderChatMarkdown(text) {
    const src = String(text || '');
    if (!src) return '';
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
}

/** 输入框高度随内容自适应（1~6 行） */
function autoResizeChatInput() {
    const input = document.getElementById('msgInput');
    if (!input) return;
    input.style.height = 'auto';
    const minH = 76;
    const maxH = 200;
    const h = Math.max(input.scrollHeight, minH);
    input.style.height = Math.min(h, maxH) + 'px';
}

/** 初始化聊天输入：Enter 发送、Shift+Enter 换行 */
function initChatInput() {
    const input = document.getElementById('msgInput');
    if (!input) return;

    input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            sendMsg();
        }
    });

    input.addEventListener('input', autoResizeChatInput);
    autoResizeChatInput();
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