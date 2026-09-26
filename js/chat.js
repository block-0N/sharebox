/* ============================================================
 * 聊天室
 * ============================================================ */

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
            <span class="msg-content">[${new Date(i.created_at).toLocaleString()}] <b>${escapeHtml(i.username)}</b>：${escapeHtml(i.content)}</span>
            <button class="msg-del" type="button" title="删除此消息">×</button>
        </div>`).join("");
    box.scrollTop = box.scrollHeight;
}

/**
 * 发送消息
 */
async function sendMsg() {
    const name = document.getElementById("userName").value || "匿名";
    const content = document.getElementById("msgInput").value.trim();
    if (!content) return;
    const { error } = await sb.from("messages").insert({ username: name, content });
    if (error) {
        console.error("发送失败", error);
        await dlgAlert("发送失败", error.message);
        return;
    }
    document.getElementById("msgInput").value = "";
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