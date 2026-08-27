// Supabase信息
const SUPABASE_URL = "https://ekphociqviwojbonbcbd.supabase.co";
const ANON_KEY = "sb_publishable_ebvcoe-OiDqlZJTkIsvZ1g_KsDf4sSU";
const sb = window.supabase.createClient(SUPABASE_URL, ANON_KEY);
/*聊天部分*/
// 加载历史消息
async function loadMessages() {
    console.log("开始加载聊天消息");
    const { data, error } = await sb.from("messages").select("*").order("created_at", { asc: true });
    if (error) {
        console.error("消息加载错误", error);
        alert("消息加载错误，错误信息为：" + error + "请刷新后重试或更换浏览器");
    }
    else console.log("消息加载成功，共", data?.length || 0, "条", data);
    renderMsg(data || [])
}
// 渲染消息
function renderMsg(list) {
    console.log("开始渲染消息列表");
    const box = document.getElementById("msgBox");
    box.innerHTML = list.map(i => `
        <div class="msg-item">
            [${new Date(i.created_at).toLocaleString()}]
            <b>${i.username}</b>：${i.content}
        </div>`).join("");
    box.scrollTop = box.scrollHeight;
    console.log("消息渲染完成");
}
// 发送消息
async function sendMsg() {
    const name = document.getElementById("userName").value || "匿名";
    const content = document.getElementById("msgInput").value.trim();
    if (!content) return;
    await sb.from("messages").insert({ username: name, content });
    document.getElementById("msgInput").value = "";
}
// 删除消息
async function delMsg(msgId) {
    const { error } = await sb.from("messages").delete().eq("id", msgId);
    if (error) {
        console.error("删除消息失败", error);
        alert("删除失败");
    }
}
// Realtime实时监听新消息
sb.channel("public_chat")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, payload => {
        loadMessages();
    })
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, payload => {
        loadMessages();
    })
    .subscribe();


/*网盘部分*/
// 全局变量：上传计数
let uploadTotal = 0, uploadFinished = 0;
let dropArea = null;
// 自动轮询等待dropArea元素存在再初始化拖拽
function tryInitDrop() {
    dropArea = document.getElementById('dropArea');
    if (!dropArea) {
        setTimeout(tryInitDrop, 200);
        return;
    }
    console.log("dropArea已找到，初始化拖拽");
    // 逐个绑定事件
    dropArea.addEventListener('dragenter', e => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.style.borderColor = '#2563eb';
    })
    dropArea.addEventListener('dragover', e => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.style.borderColor = '#2563eb';
    })
    dropArea.addEventListener('dragleave', e => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.style.borderColor = '#ccc';
    })
    dropArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.style.borderColor = '#ccc';
        const items = e.dataTransfer.items;
        if (!items) return;
        const entries = Array.from(items).map(item => item.webkitGetAsEntry());
        await traverseEntries(entries);
        loadFiles();
    })
}
tryInitDrop();
// 递归遍历文件夹
async function traverseEntries(entries) {
    const allEntries = [];
    const readAllEntries = async (dirEntry) => {
        return new Promise((resolve) => {
            const reader = dirEntry.createReader();
            let results = [];
            function read() {
                reader.readEntries((batch) => {
                    if (batch.length === 0) {
                        resolve(results);
                        return;
                    }
                    results = results.concat(batch);
                    read();
                })
            }
            read();
        })
    }
    const collect = async (list) => {
        for (const entry of list) {
            if (entry.isFile) {
                allEntries.push(entry);
            } else if (entry.isDirectory) {
                const childList = await readAllEntries(entry);
                await collect(childList);
            }
        }
    }
    await collect(entries);
    uploadTotal = allEntries.length;
    uploadFinished = 0;
    updateProgress(allEntries.length, uploadFinished, 'upload');
    for (const entry of allEntries) {
        const file = await getFileFromEntry(entry);
        await uploadSingleFileWithPath(file, entry.fullPath);
        uploadFinished++;
        updateProgress(allEntries.length, uploadFinished, 'upload');
    }
}
async function getFileFromEntry(entry) {
    return new Promise(resolve => entry.file(file => resolve(file)))
}
// 统一上传入口
async function uploadSingleFileWithPath(file, fullPath) {
    const ext = file.name.split('.').pop();
    const safePath = `${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
    const { data, error } = await sb.storage.from("public_netdisk").upload(safePath, file);
    if (error) {
        console.error("上传失败", fullPath, error.message);
        return;
    }
    const { data: urlData } = sb.storage.from("public_netdisk").getPublicUrl(safePath);
    await sb.from("file_list").insert({
        file_name: fullPath,
        file_url: urlData.publicUrl,
        storage_path: safePath
    });
}
/**
 * 更新进度UI（上传 / 删除 / 打包下载 共用）
 * @param {number} total 
 * @param {number} finished 
 * @param {'upload' | 'delete' | 'downloadZip'} [type='upload'] - 类型：upload上传 | delete删除 | downloadZip打包下载
 * @param {string} [estimateText=''] - 追加预估时间文字
 */
function updateProgress(total, finished, type = 'upload', estimateText = '') {
    const progressDom = document.getElementById('uploadProgress');
    const tipDom = document.getElementById('uploadTip');
    if (!progressDom || !tipDom) return;

    if (total <= 0) {
        progressDom.style.display = 'none';
        tipDom.textContent = '';
        return;
    }
    progressDom.style.display = 'block';
    const percent = Math.round((finished / total) * 100);
    let tipStr = '';
    if (type === 'upload') {
        tipStr = `上传中 ${finished}/${total} (${percent}%)`;
    } else if (type === 'delete') {
        tipStr = `删除中 ${finished}/${total} (${percent}%)`;
        if (estimateText) {
            tipStr += `，${estimateText}`;
        }
    } else if (type === 'downloadZip') {
        tipStr = `打包下载中 ${finished}/${total} (${percent}%)`;
        if (estimateText) {
            tipStr += `，${estimateText}`;
        }
    }
    tipDom.textContent = tipStr;

    if (finished >= total) {
        if (type === 'upload') {
            tipDom.textContent = "上传完成！";
        } else if (type === 'delete') {
            tipDom.textContent = "删除完成！";
        } else if (type === 'downloadZip') {
            tipDom.textContent = "打包完成，ZIP已开始下载";
        }
        setTimeout(() => {
            progressDom.style.display = 'none';
            tipDom.textContent = '';
        }, 1500)
    }
}


// 加载文件列表树形嵌套
async function loadFiles() {
    const { data } = await sb.from("file_list").select("*").order("created_at", { desc: true });
    const wrap = document.getElementById("fileList");
    if (!data || data.length === 0) {
        const nofile = document.createElement('div');
        nofile.className = 'nofile';
        nofile.textContent = '暂无文件'
        wrap.appendChild(nofile);
        return;
    }
    // 构建树形结构
    const tree = { _files: {}, _children: {} };
    function addToTree(pathStr, fileItem) {
        const parts = pathStr.split('/');
        const filename = parts.pop();
        let node = tree;
        for (const p of parts) {
            if (!node._children[p]) node._children[p] = { _files: {}, _children: {} };
            node = node._children[p];
        }
        node._files[filename] = fileItem;
    }
    // 全部文件录入树
    data.forEach(item => {
        addToTree(item.file_name, { ...item, displayName: item.file_name.split('/').pop() });
    });
    let folderIdCounter = 0;
    // 递归渲染树HTML
    function renderTree(node, parentPath = "", depth = 0) {
        let html = "";
        // 遍历子文件夹
        for (const folderName in node._children) {
            const folderNode = node._children[folderName];
            const fid = 'folder-tree-' + folderIdCounter++;
            const fullPath = parentPath ? `${parentPath}/${folderName}` : folderName;
            const childHtml = renderTree(folderNode, fullPath, depth + 1);
            const fileHtml = Object.values(folderNode._files).map(file => `
                <div class="file-item">
                    <a href="${file.file_url}" target="_blank">${file.displayName}</a>
                    <button onclick="downloadFile('${file.displayName}','${file.file_url}')">下载</button>
                    <button class="del" onclick="delFile('${file.id}','${file.storage_path}')">删除</button>
                </div>`).join("");
            html += `
            <div class="folder">
                <div class="folder-item file-item" onclick="toggleFolder('${fid}')">
                    <span>📁 ${folderName}</span>
                    <button onclick="event.stopPropagation();downloadFolderZip('${fullPath}')">下载</button>
                    <button class="del" onclick="event.stopPropagation();delFolder('${fullPath}')">删除</button>
                </div>
                <div id="${fid}" style="padding:4px 12px;display:block;">
                    ${childHtml}
                    ${fileHtml}
                </div>
            </div>`
        }
        // 渲染当前层级直接的文件
        const rootFileHtml = Object.values(node._files).map(file => `
            <div class="file-item" style="padding:4px 0;margin-left:${depth * 16}px">
                <a href="${file.file_url}" target="_blank">${file.displayName}</a>
                <button onclick="downloadFile('${file.displayName}','${file.file_url}')">下载</button>
                <button class="del" onclick="delFile('${file.id}','${file.storage_path}')">删除</button>
            </div>`).join("");
        html += rootFileHtml;
        return html;
    }
    wrap.innerHTML = renderTree(tree);
}
// 删除文件夹（rAF平滑进度 + 预估剩余时间，底层5个一批批量删除）
async function delFolder(folderPrefix) {
    if (!confirm(`确定要删除【${folderPrefix}】及其内部所有文件吗？该操作不可恢复！`)) return;
    console.log("待删除目录前缀：", folderPrefix);
    const { data: allFiles, error } = await sb.from("file_list").select("*");
    if (error) {
        console.error("查询文件失败", error);
        alert("查询文件失败");
        return;
    }
    const prefix1 = folderPrefix + "/";
    const prefix2 = "/" + folderPrefix + "/";
    const targetFiles = allFiles.filter(item => {
        const name = item.file_name;
        return name === folderPrefix || name === "/" + folderPrefix || name.startsWith(prefix1) || name.startsWith(prefix2);
    });
    console.log("筛选待删文件：", targetFiles);
    if (targetFiles.length === 0) {
        alert("文件夹内无文件");
        return;
    }

    const totalCount = targetFiles.length;
    let currentFinished = 0;
    const startTs = performance.now();
    let rafId = null;
    let isDone = false;

    // 时间格式化：毫秒转 分秒/秒
    function formatMs(ms) {
        const s = Math.round(ms / 1000);
        if (s < 60) return `预计剩余 ${s}秒`;
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `预计剩余 ${m}分${sec}秒`;
    }

    // rAF 渲染循环
    function renderLoop() {
        if (isDone) return;
        rafId = requestAnimationFrame(renderLoop);
        const now = performance.now();
        const costMs = now - startTs;
        let estimateText = "预计剩余 计算中…";
        if (currentFinished > 0 && costMs > 0) {
            const speed = currentFinished / costMs; // 文件/ms
            const remainNum = totalCount - currentFinished;
            const remainMs = remainNum / speed;
            estimateText = formatMs(remainMs);
        }
        updateProgress(totalCount, currentFinished, 'delete', estimateText);
    }
    // 启动rAF
    rafId = requestAnimationFrame(renderLoop);

    const storagePaths = targetFiles.map(i => i.storage_path);
    const ids = targetFiles.map(i => i.id);
    const batchSize = 5;
    for (let i = 0; i < storagePaths.length; i += batchSize) {
        const pathBatch = storagePaths.slice(i, i + batchSize);
        const idBatch = ids.slice(i, i + batchSize);
        await sb.storage.from("public_netdisk").remove(pathBatch);
        await sb.from("file_list").delete().in("id", idBatch);
        currentFinished += pathBatch.length;
    }
    // 全部完成
    isDone = true;
    cancelAnimationFrame(rafId);
    updateProgress(totalCount, currentFinished, 'delete');
    setTimeout(() => {
        updateProgress(0, 0, 'delete');
        loadFiles();
    }, 800);
}
// 强制下载文件（blob方案，解决直接预览不弹出下载）
async function downloadFile(fileName, fileUrl) {
    try {
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error('文件获取失败');
        const blob = await res.blob();
        const a = document.createElement('a');
        const blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl); // 释放内存
    } catch (err) {
        console.error('下载失败：', err);
        alert('下载失败');
    }
}
// 文件夹一键打包下载ZIP（复用进度条、预估剩余时间）
async function downloadFolderZip(folderPrefix) {
    if (!confirm(`确定打包【${folderPrefix}】下所有文件为ZIP？文件较多时会等待一段时间`)) return;
    const { data: allFiles, error } = await sb.from("file_list").select("*");
    if (error) {
        console.error("查询文件失败", error);
        alert("查询文件失败");
        return;
    }
    const prefix1 = folderPrefix + "/";
    const prefix2 = "/" + folderPrefix + "/";
    const targetFiles = allFiles.filter(item => {
        const name = item.file_name;
        return name === folderPrefix || name === "/" + folderPrefix || name.startsWith(prefix1) || name.startsWith(prefix2);
    });
    if (targetFiles.length === 0) {
        alert("文件夹内无文件");
        return;
    }

    const totalCount = targetFiles.length;
    let currentFinished = 0;
    const startTs = performance.now();
    let rafId = null;
    let isDone = false;

    // 时间格式化
    function formatMs(ms) {
        const s = Math.round(ms / 1000);
        if (s < 60) return `预计剩余 ${s}秒`;
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `预计剩余 ${m}分${sec}秒`;
    }
    // rAF平滑渲染
    function renderLoop() {
        if (isDone) return;
        rafId = requestAnimationFrame(renderLoop);
        const now = performance.now();
        const costMs = now - startTs;
        let estimateText = "预计剩余 计算中…";
        if (currentFinished > 0 && costMs > 0) {
            const speed = currentFinished / costMs;
            const remainNum = totalCount - currentFinished;
            const remainMs = remainNum / speed;
            estimateText = formatMs(remainMs);
        }
        updateProgress(totalCount, currentFinished, 'downloadZip', estimateText);
    }
    rafId = requestAnimationFrame(renderLoop);

    const zip = new JSZip();
    // 串行拉取文件（避免并发太多请求被浏览器限流，可改成并行，按需调整）
    for (const fileItem of targetFiles) {
        try {
            const res = await fetch(fileItem.file_url);
            if (!res.ok) throw new Error("文件拉取失败");
            const blob = await res.blob();
            zip.file(fileItem.file_name, blob);
        } catch (err) {
            console.error("文件下载失败：", fileItem.file_name, err);
        }
        currentFinished++;
    }
    // 生成zip
    const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE"
    });
    // 触发下载
    const a = document.createElement("a");
    a.href = URL.createObjectURL(zipBlob);
    a.download = `${folderPrefix}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(zipBlob);

    isDone = true;
    cancelAnimationFrame(rafId);
    updateProgress(totalCount, currentFinished, 'downloadZip');
    setTimeout(() => {
        updateProgress(0, 0, 'downloadZip');
    }, 1500);
}


// 折叠展开切换
function toggleFolder(id) {
    const dom = document.getElementById(id);
    dom.style.display = dom.style.display === 'none' ? 'block' : 'none';
}
// 普通按钮上传单文件
async function uploadFile() {
    const fileInput = document.getElementById("fileInput");
    const files = Array.from(fileInput.files);
    uploadTotal = files.length;
    uploadFinished = 0;
    updateProgress(files.length, uploadFinished, 'upload');
    for (const file of files) {
        console.log("正在上传文件：", file.name);
        await uploadSingleFileWithPath(file, file.name);
        uploadFinished++;
        updateProgress(files.length, uploadFinished, 'upload');
    }
    loadFiles();
}
// 普通按钮上传文件夹
async function uploadFolder() {
    const fileInput = document.getElementById("folderInput");
    const files = Array.from(fileInput.files);
    uploadTotal = files.length;
    uploadFinished = 0;
    updateProgress(files.length, uploadFinished, 'upload');
    for (const file of files) {
        await uploadSingleFileWithPath(file, file.webkitRelativePath);
        uploadFinished++;
        updateProgress(files.length, uploadFinished, 'upload');
    }
    loadFiles();
}
// 删除单个文件
async function delFile(rowId, storagePath) {
    await sb.from("file_list").delete().eq("id", rowId);
    await sb.storage.from("public_netdisk").remove([storagePath]);
    console.log("成功删除文件");
    loadFiles();
}

// 初始化
loadMessages();
loadFiles();