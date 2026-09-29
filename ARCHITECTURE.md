# ShareBox 架构说明

面向接手者的技术文档。建议先读 [README.md](./README.md) 了解功能，再看这里了解实现。

## 目录

- [整体架构](#整体架构)
- [进程间通信](#进程间通信)
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
│  - 本地 HTTP 服务 127.0.0.1:51234          │
│  - BrowserWindow 加载 index.html           │
│  - 系统托盘                                │
│  - 单实例锁 + 命令行参数                    │
│  - Windows 右键菜单注册表                   │
│  - 自定义图标目录（fs.watch）                │
│  - settings.json 读写                       │
│  - IPC handlers                            │
└─────────────────┬──────────────────────────┘
                  │ preload.js (contextBridge)
                  │ window.shareboxAPI
┌─────────────────▼──────────────────────────┐
│ 渲染进程（浏览器环境）                     │
│  - 无打包器的 <script> 顺序加载            │
│  - 全局函数通信                            │
│  - 全局状态：tabs / fileTree / storageMeta │
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

---

## 进程间通信

`preload.js` 通过 `contextBridge` 暴露 `window.shareboxAPI`：

```js
window.shareboxAPI = {
    icons: {
        list, getDir, openFolder, pick, add, delete, reload,
        pickDir, setDir, onChanged
    },
    contextMenu: {
        isRegistered, register, unregister,
        readFile, onUploadRequest
    }
}
```

**主进程 → 渲染进程的推送**：
- `custom-icons:changed`：图标目录变化 → 渲染进程刷新列表和图标
- `context-menu:upload-request`：右键菜单触发的上传请求 → 渲染进程执行上传

**监听器注意**：`onChanged` / `onUploadRequest` 里都调用了 `removeAllListeners` 防累积（页面刷新后重复注册）。

---

## 渲染进程模块职责

按 `index.html` 里的加载顺序说明。

| 模块 | 职责 | 依赖 |
|---|---|---|
| `config.js` | Supabase client、`FILE_ICON_SVG_MAP`、`FILE_TYPE_LABELS`、类型判断函数、`getFileIconUrl`（含自定义图标优先级） | env.js |
| `media-cache.js` | IndexedDB 缓存（200 MB / 2000 条 LRU）、`initGridLazyLoad` | — |
| `utils.js` | `escapeHtml` / `formatBytes` / `formatMs` / `formatTime`、Toast、主题、通知、主标签、**外部链接拦截** | — |
| `dialog.js` | `dlgAlert` / `dlgConfirm` / `dlgPrompt` / `dlgChoose` / `dlgNewFile` / `dlgOpenWith` | — |
| `preview.js` | `openPreview` 入口 + 各类型预览（text / md / html / image / pdf / video / audio / office / zip / hex） | utils, dialog |
| `share.js` | 分享对话框、分享消息编码/解码、卡片渲染、点击处理 | dialog, upload, preview |
| `favorites.js` | 收藏 CRUD、快速访问/收藏夹视图渲染 | explorer |
| `chat.js` | 聊天加载/渲染/发送、Markdown 渲染、工具栏、语法提示、Realtime 订阅 | utils, dialog, config |
| `upload.js` | `uploadSingleFileWithPath`、拖拽上传、进度条、隐藏文件过滤 | explorer, dialog |
| `explorer.js` | **核心**：文件树、8 种视图渲染、选择/框选/拖拽、搜索、面包屑、状态栏、标签页数据层 | config, utils |
| `actions.js` | 复制粘贴、重命名、删除、下载、新建、键盘快捷键 | explorer, dialog |
| `context-menus.js` | 右键菜单分发、所有场景菜单项、属性对话框、`copyToClipboard` | explorer, favorites, actions |
| `tabs.js` | 标签页 UI（渲染、切换、关闭、拖拽排序） | explorer |
| `settings.js` | 设置面板（Windows 右键菜单 + 自定义图标入口） | — |
| `custom-icons.js` | 自定义图标管理（仅 Electron） | — |
| `main.js` | 入口初始化，按顺序调用所有 `init*` | 所有 |

**加载顺序敏感**：后加载的模块可以调用先加载模块里定义的函数。反过来不行。

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
    path TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,            -- 'file' | 'folder'
    storage_path TEXT,
    created_at TIMESTAMPTZ
);
```

**关键设计**：
- `file_list` 用**完整路径**（`file_name`）表示层级，不存 `parent_id`。文件夹是"虚拟"的
- `storage_path` 是随机名，避免 Storage 里重名
- `favorites.path` 用 `file_name` 做 UNIQUE

### 前端文件树

```js
fileTree = {
    _files: { "a.txt": {...} },
    _children: { "docs": { _files, _children, _totalSize, _latestMtime } },
    _totalSize: 12345,
    _latestMtime: "..."
}
```

`loadFiles()` 每次全量拉 `file_list` 重建树（文件数 < 1000 时性能可接受）。

### Storage

- Bucket: `public_netdisk`（public 权限）
- 分享文件放在 `文件/` 目录下

---

## 关键设计决策

### 1. 单击 vs 双击 vs 拖拽（Pointer Events）

- **pointerdown** 记录 `lastMousedownItemEl` 和 `lastMousedownSoleSelected`（仅单选时进入重命名）
- **pointermove 位移 < 5px**：视为单击/双击
- **pointermove 位移 ≥ 5px**：激活拖拽，**此时才 `setPointerCapture`**
  - ⚠️ **不能在 pointerdown 里捕获** —— 会隐式改变 click/dblclick 的 target
- **click** 延迟 200ms 触发内联重命名（等 dblclick 先来）
- **dblclick** 打开文件/进入文件夹（取消重命名 timer）
- `suppressClick()` 时间戳（180ms）防拖拽结束误触单击

### 2. 8 种视图切换

- `tab.viewMode` 按 tab 独立保存（`'details'` 默认）
- 快速访问/收藏夹视图强制 `details`
- 网格视图（超大/大/中/小/平铺）图片直接显示 `file_url`
- 详细信息视图有表头，点列名排序

### 3. 图片缓存

- **IndexedDB**：`sharebox-media-cache`，store `media`（keyPath: `url`）
- **LRU 清理**：超 200 MB 或 2000 条时删最旧到 70%
- **内存缓存**：80 条最近访问的 object URL
- **懒加载**：`IntersectionObserver` + `data-src`，提前 300px 预加载
- **图片预览**：`openImagePreview` 走 `mediaCache.fetch`

### 4. 自定义图标

- **目录**：`%APPDATA%\sharebox\custom-icons\`（可通过 settings.json 更换）
- **命名**：`<ext>.svg/png/...`（如 `psd.svg` 映射到 `.psd`）
- **fs.watch**：目录变化 → `broadcastCustomIcons` → 渲染进程重渲染
- **优先级**：`window.__CUSTOM_ICONS__[ext]` > `FILE_ICON_SVG_MAP`
- **更换目录**：主进程复制旧目录文件到新目录（同名跳过）→ 更新 settings.json → 重启 watcher

### 5. 系统右键菜单

- **注册表**：`HKEY_CURRENT_USER\Software\Classes\*\shell\ShareBox`（文件和目录两种）
- **命令**：`"electron.exe" "app路径" --upload %1`（`%1` 不加引号，Windows 会加）
- **参数解析**：从 `--upload` 后面从后往前找最后一个绝对路径（跳过 Electron 注入的 `--allow-file-access-from-files`）
- **单实例锁**：第二次启动 → `second-instance` 事件 → 唤起窗口 + 处理 argv

### 6. 分享消息编码

分享消息在 `messages.content` 里：

```
📎SHARE:{"url":"https://.../a.txt","name":"a.txt","size":1234}
```

`renderChatMarkdown` 检测到前缀后**跳过 Markdown 渲染**，直接生成卡片 HTML。

### 7. 右键菜单分发

`showContextMenu(x, y)` 按当前选中状态分发到 6 种构造器：
- `buildMenuItemsForFile` / `ForFolder` / `ForMulti`
- `buildMenuItemsForQuick` / `ForFavorite`
- `buildMenuItemsForBlank`（按 `getView()` 区分 path / quick / favorites）

**空白区判断**：用 `isPointOnText` 精确判断点是否在字符上（不用 `closest`，因为 `.fe-name { flex: 1 }` 有大量空白）。

### 8. 完全本地化

所有外部依赖在 `assets/lib/`：
- `highlight.min.js` + 2 个 CSS
- `jszip.min.js`
- `marked.min.js`
- `supabase-js.js`

图标在 `assets/file-icons/`（90+ SVG）。**离线可用**。

### 9. CSP 策略

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

`unsafe-inline` 是因为用了内联 `onclick` 和 `style`，兼容性优先。

### 10. 设置面板合并

顶部只有一个 ⚙ 按钮，面板里有两个 section：
- **Windows 右键菜单**：显示状态 + 注册/取消注册按钮
- **自定义图标**：目录路径 + 打开目录 / 重载 / 更改目录 + 内联添加表单

两个模块通过 `window.shareboxCustomIcons`（由 `custom-icons.js` 暴露）互相调用，`settings.js` 负责面板整体开关。

---

## 开发注意事项

### 修改代码后

- **纯 UI 改动**（js/css/html）→ F12 强刷（Ctrl+Shift+R）
- **主进程改动**（main.js / preload.js）→ 必须重启 Electron
- **打包测试** → 打 tag 走 CI

### 新增模块

1. `index.html` 里按依赖顺序加 `<script>`（**在 `js/main.js` 之前**）
2. 如果是初始化函数，在 `js/main.js` 里调用
3. 全局函数直接声明（`function xxx() {}`），不用 `export`

### 修改 Supabase schema

```powershell
supabase migration new 名字
# 编辑 sql
supabase db push
```

**不要**在 Dashboard 里手动改 schema。

### 数据库权限

新建表记得 **GRANT**（否则 `anon` 访问会 permission denied）：

```sql
GRANT SELECT, INSERT, DELETE ON public.表名 TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.表名_id_seq TO anon;
```

### 新增图标

1. SVG 放到 `assets/file-icons/`
2. `js/config.js` 的 `FILE_ICON_SVG_MAP` 加映射：`新扩展名: 'file_type_xxx.svg'`
3. 可选：`FILE_TYPE_LABELS` 加中文类型标签

---

## 常见坑

| 坑 | 症状 | 修法 |
|---|---|---|
| `setPointerCapture` 在 pointerdown 里 | 双击失效 | 延迟到移动 > 5px 才捕获 |
| `navigator.clipboard.writeText` 在右键菜单里 | `NotAllowedError`（焦点丢失） | 用 `copyToClipboard` 兜底（execCommand） |
| 忘记 GRANT | `permission denied for table xxx` | 迁移里加 GRANT |
| `npm version` 版本没变 | CI 报 "Version not changed" | 改用 `npm pkg set version=` |
| `build/` 目录路径 | 打包后图标 404 | `build/` 不进 asar，改用 `assets/` |
| 端口 51234 被占用 | 第二个实例启动失败 | 单实例锁 + `server.on('error')` |
| CDN 抽风 | 预览/MD/ZIP 全挂 | 已本地化，不要再引外链 |
| 分享链接中文乱码 | 浏览器打开纯文本乱码 | Supabase Storage 丢 charset，上游问题 |
| `context-menu` 事件 target | 空白区右键触发项菜单 | 用 `isPointOnText` 精确判断 |
| Electron 里 icon 路径 | 打包后通知图标空白 | 用 `assets/` 而不是 `build/` |
| `onUploadRequest` 累积 | 一个请求触发多次 | `removeAllListeners` 先去重 |
| Windows 右键菜单参数 | 拿到 `--allow-file-access-from-files` | 从后往前找绝对路径 |
| PowerShell here-string 粘贴 | 长脚本被拆坏 | 长改动分小段或直接手改 VSCode |

---

## 版本管理

- 当前版本：`v1.3.3`（package.json）
- 发版：改 version → commit → tag `vX.Y.Z` → push（自动触发 CI）
- 迁移记录：`supabase/migrations/` 提交到 git，`.temp/` 和 `.branches/` 忽略

## CI / CD

`.github/workflows/build.yml`：

- **触发**：`workflow_dispatch` 或推送 `v*` tag
- **矩阵**：`windows-latest` / `macos-latest` / `ubuntu-latest`
- **步骤**：
  1. Checkout
  2. Setup Node 22
  3. 设置镜像（npmmirror）
  4. **Validate icons**（检查 `build/icon.png` ≥ 512×512）
  5. `npm ci`（从 lockfile 精确还原）
  6. 从 tag 设置 version（`npm pkg set version=`）
  7. `electron-builder --publish never`
  8. 上传 artifact
- **release job**：`softprops/action-gh-release` 创建 Release

**CI 不运行应用**，只验证打包成功。运行时问题（preload 路径、IPC 名称）需下载安装包实测。
