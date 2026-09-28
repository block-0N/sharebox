# ShareBox 架构说明

面向接手者的技术文档。建议先读 [README.md](./README.md) 了解功能，再看这里了解实现。

## 目录

- [整体架构](#整体架构)
- [渲染进程模块职责](#渲染进程模块职责)
- [数据模型](#数据模型)
- [关键设计决策](#关键设计决策)
- [开发注意事项](#开发注意事项)
- [常见坑](#常见坑)

---

## 整体架构

```
┌────────────────────────────────────────────┐
│ Electron 主进程 (main.js)                  │
│  - 启动本地 HTTP 服务 127.0.0.1:51234      │
│  - BrowserWindow 加载 index.html           │
│  - 系统托盘（关闭最小化）                  │
│  - 通知权限自动授予                        │
└─────────────────┬──────────────────────────┘
                  │ http://127.0.0.1:51234
┌─────────────────▼──────────────────────────┐
│ 渲染进程（浏览器环境）                     │
│  ┌──────────────────────────────────────┐  │
│  │ 无打包器的 <script> 顺序加载         │  │
│  │ config → utils → dialog → ... → main │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │ 全局状态（无框架，靠全局变量通信）   │  │
│  │ tabs / fileTree / storageMeta / ...  │  │
│  └──────────────────────────────────────┘  │
└─────────────────┬──────────────────────────┘
                  │ HTTPS / WSS
┌─────────────────▼──────────────────────────┐
│ Supabase                                   │
│  - Postgres (file_list / messages / favorites) │
│  - Storage (bucket: public_netdisk)        │
│  - Realtime (messages 表推送)              │
└────────────────────────────────────────────┘
```

**为什么不用打包器**：

- 项目规模不大，模块数量有限
- 无 npm 依赖引入（除 electron 本身）
- 改代码后直接 F12 强刷即可，改一行不用等构建
- 代价：加载顺序必须手动维护，模块间靠全局函数通信

**HTTP 服务的用途**：`main.js` 起本地服务是为了用 `http://` 协议加载页面（避免 `file://` 下的各种限制），不是为了防止路径穿越攻击——生产环境可以考虑改成 `loadFile()`（未做）。

---

## 渲染进程模块职责

按 `index.html` 里的加载顺序说明。

| 模块 | 职责 | 依赖 |
|---|---|---|
| `config.js` | Supabase client、`FILE_ICON_SVG_MAP`、`FILE_TYPE_LABELS`、类型判断函数、常量 | env.js |
| `utils.js` | `escapeHtml` / `formatBytes` / `formatMs` / `formatTime`、Toast、主题切换、通知、主标签切换 | — |
| `dialog.js` | 通用弹窗：`dlgAlert` / `dlgConfirm` / `dlgPrompt` / `dlgChoose` / `dlgNewFile` / `dlgOpenWith` | — |
| `preview.js` | `openPreview` 入口 + 各类型预览函数（text / md / html / image / pdf / video / audio / office / zip / hex） | utils, dialog |
| `share.js` | 分享对话框、分享消息编码/解码、卡片渲染、点击处理 | dialog, upload, preview |
| `favorites.js` | 收藏 CRUD、快速访问/收藏夹视图渲染、`openFavoriteItem` | explorer |
| `chat.js` | 聊天室加载/渲染/发送、Markdown 渲染、工具栏、语法提示、Realtime 订阅 | utils, dialog, config |
| `upload.js` | 上传核心 `uploadSingleFileWithPath`、拖拽上传、进度条、隐藏文件过滤 | explorer, dialog |
| `explorer.js` | **核心**：文件树、7 种视图渲染、选择/框选/拖拽、搜索、面包屑、标签页数据层 | config, utils |
| `actions.js` | 复制粘贴、重命名、删除、下载、新建、键盘快捷键 | explorer, dialog |
| `context-menus.js` | 右键菜单分发、所有场景菜单项构造、属性对话框 | explorer, favorites, actions |
| `tabs.js` | 标签页 UI（渲染、切换、关闭、拖拽排序） | explorer |
| `main.js` | 入口初始化，按顺序调用所有 `init*` | 所有 |

**加载顺序敏感**：后加载的模块可以调用先加载模块里定义的函数。反过来不行。新增模块时要注意。

---

## 数据模型

### Supabase 表

```sql
-- 文件列表
CREATE TABLE file_list (
    id BIGSERIAL PRIMARY KEY,
    file_name TEXT NOT NULL,       -- 完整路径，如 "docs/a.txt"
    file_url TEXT NOT NULL,        -- Storage 公开 URL
    storage_path TEXT NOT NULL,    -- Storage 内部名，如 "1790514854035_8998.txt"
    created_at TIMESTAMPTZ
);

-- 聊天室消息
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    username TEXT,
    content TEXT,
    created_at TIMESTAMPTZ
);

-- 收藏
CREATE TABLE favorites (
    id BIGSERIAL PRIMARY KEY,
    path TEXT NOT NULL UNIQUE,     -- 文件的 file_name 或文件夹的完整路径
    name TEXT NOT NULL,            -- 显示名（不含路径）
    type TEXT NOT NULL,            -- 'file' | 'folder'
    storage_path TEXT,             -- 文件才有，用于查找
    created_at TIMESTAMPTZ
);
```

**关键设计**：

- `file_list` 用**完整路径**（`file_name`）表示层级，不存 `parent_id`。文件夹是"虚拟"的，通过路径前缀推导
- `storage_path` 是随机名（`时间戳_随机数.扩展名`），避免 Storage 里重名
- `favorites.path` 用 `file_name` 做 UNIQUE 约束，删除文件时需要手动清理（目前不做级联）

### 前端文件树

```js
fileTree = {
    _files: { "a.txt": {...}, ... },        // 当前目录下的文件
    _children: { "docs": { _files, _children, _totalSize, _latestMtime } },
    _totalSize: 12345,                       // 递归汇总
    _latestMtime: "..."
}
```

`loadFiles()` 每次全量拉 `file_list` 重建树（文件数 < 1000 时性能可接受）。

### Storage

- Bucket: `public_netdisk`（public 权限）
- 上传时随机生成 `storage_path`，`file_list.file_name` 保存真实路径
- 分享文件都放在 `文件/` 目录下

---

## 关键设计决策

### 1. 单击 vs 双击 vs 拖拽的处理

三个交互冲突点，靠**时序 + 阈值**区分：

- **mousedown** 记录 `lastMousedownItemEl` 和 `lastMousedownSoleSelected`
- **pointermove 位移 < 5px**：视为单击/双击，不激活拖拽
- **pointermove 位移 ≥ 5px**：激活拖拽，**此时才 `setPointerCapture`**
- **click** 触发内联重命名（延迟 200ms，等 dblclick 先来）
- **dblclick** 打开文件/进入文件夹（会取消重命名 timer）
- **`suppressClick()`** 时间戳（180ms）防止拖拽结束误触单击

⚠️ **`setPointerCapture` 不能在 pointerdown 里调用** —— 会隐式改变 click/dblclick 的 target，破坏双击。必须等真正移动后。

### 2. 7 种视图切换

- `tab.viewMode` 按 tab 独立保存（`'details'` 默认）
- 快速访问/收藏夹视图强制 `details`（不跟随切换）
- 网格视图（小/中/大/超大）图片文件直接显示 `file_url` 缩略图
- 详细信息视图有表头，点列名切换排序

### 3. 分享消息编码

分享消息在 `messages.content` 里长这样：

```
📎SHARE:{"url":"https://.../a.txt","name":"a.txt","size":1234}
```

`renderChatMarkdown` 检测到前缀后**跳过 Markdown 渲染**，直接生成卡片 HTML。

### 4. 右键菜单分发

`showContextMenu(x, y)` 按**当前选中状态**分发到 6 种构造器：

- `buildMenuItemsForFile` / `ForFolder` / `ForMulti`
- `buildMenuItemsForQuick` / `ForFavorite`
- `buildMenuItemsForBlank`（按 `getView()` 区分 path / quick / favorites）

### 5. 完全本地化

所有外部依赖都在 `assets/lib/`：

- `highlight.min.js` + 两个 CSS（github 主题）
- `jszip.min.js`
- `marked.min.js`
- `supabase-js.js`（UMD）

所有文件图标在 `assets/file-icons/`（90+ SVG）。**离线可用**。

### 6. CSP 策略

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://*.supabase.co;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  frame-src 'self' https://*.supabase.co https://view.officeapps.live.com;
  object-src 'none';
">
```

`unsafe-inline` 是因为用了内联 `onclick` 和 `style`，不是最佳实践但兼容性优先。

---

## 开发注意事项

### 修改代码后

- **浏览器测**：改 `js/` `css/` `index.html` → F12 强刷（Ctrl+Shift+R）
- **桌面端测**：改 `main.js` 或验证托盘/通知 → 关掉旧进程（托盘右键退出）→ `npm.cmd start`

### 新增模块

1. 在 `index.html` 里按依赖顺序加 `<script>` 标签（**在 `js/main.js` 之前**）
2. 如果是初始化函数，在 `js/main.js` 里调用
3. 全局函数直接声明（`function xxx() {}`），不用 `export`

### 修改 Supabase schema

```powershell
supabase migration new 名字
# 编辑 sql
supabase db push
```

**不要**在 Dashboard 里手动改 schema（迁移文件是唯一真相）。

### 数据库权限

新建表记得 **GRANT**（否则 `anon` 访问会 permission denied）：

```sql
GRANT SELECT, INSERT, DELETE ON public.表名 TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.表名_id_seq TO anon;
```

---

## 常见坑

| 坑 | 症状 | 修法 |
|---|---|---|
| `setPointerCapture` 在 pointerdown 里 | 双击失效 | 延迟到移动超过 5px 才捕获 |
| 忘记 GRANT | `permission denied for table xxx` | 迁移里加 GRANT |
| `npm version` 版本没变 | CI 报 "Version not changed" | 改用 `npm pkg set version=` |
| `build/` 目录路径 | 打包后图标 404 | `build/` 不进 asar，改用 `assets/` |
| 端口 51234 被占用 | 第二个实例启动失败 | `main.js` 有 `server.on('error')` 处理 |
| CDN 抽风 | 预览/MD/ZIP 全挂 | 已本地化，不要再引外链 |
| 分享链接中文乱码 | 浏览器打开纯文本乱码 | Supabase Storage 丢 charset，上游问题 |
| `context-menu` 事件 target | 空白区右键触发项菜单 | 用 `isPointOnText` 精确判断，不用 `closest` |
| Electron 里 icon 路径 | 打包后通知图标空白 | 用 `assets/` 而不是 `build/` |

---

## 版本管理

- 当前版本：`v1.3.x`（package.json）
- 发版：改 version → commit → tag `vX.Y.Z` → push（自动触发 CI）
- 迁移记录：`supabase/migrations/` 提交到 git，`.temp/` 和 `.branches/` 忽略
