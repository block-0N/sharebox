# ShareBox

基于 Electron + Supabase 的桌面文件分享工具。轻量、离线可用、完全用原生 JS 写的。

## 功能

### 公共聊天室
- Realtime 实时消息推送 + 系统通知
- **Markdown 渲染**（加粗/斜体/代码/链接/图片/表格…），禁用 raw HTML 防 XSS
- **Markdown 工具栏**（加粗/标题/列表/代码/链接/图片…12 项 + Ctrl+B/I/K 快捷键）
- **输入语法提示**（输入 `#` `-` `**` 等自动弹出格式提示）
- **文件分享**（上传到 `/文件` 或粘贴链接 → 微信卡片样式 → 点击预览/下载/复制）
- **左右分栏布局**（左侧消息列表 / 右侧输入区，窄屏自动堆叠）

### 公共网盘
- **8 种文件视图**：超大图标 / 大图标 / 中等图标 / 小图标 / 列表 / 详细信息 / 平铺 / 内容
- **详细信息表头**，点击列名排序（名称 / 类型 / 大小 / 修改日期）
- **快速访问**：默认视图，含收藏夹 / 全部文件 / 分享的文件 3 个入口
- **收藏夹**：右键收藏文件/文件夹，快速定位
- **多标签页**：Ctrl+T 新建，拖拽排序，独立路径和视图状态
- **搜索**：按文件名和路径过滤
- **右键菜单**：8 种场景（文件/文件夹/多选/快速访问项/收藏夹项/空白）
- **属性对话框**：Windows 11 风格，展示大小、内含数、修改时间、完整路径
- **内联重命名**：单击已选中项的名字进入编辑
- **多选 / 框选 / 拖拽移动**：支持跨标签页拖拽
- **上传**：文件 / 文件夹 / 拖拽，隐藏文件过滤，同名覆盖或保留两者
- **面包屑编辑**：点击进入路径编辑模式，带自动补全
- **状态栏**：显示已选中 / 已复制 / 已剪切数量
- **图片缓存**：IndexedDB 缓存（200 MB / 2000 条），重复访问秒开
- **网格懒加载**：只加载可视区域图片，滚动加载

### 文件预览
- 文本（highlight.js 语法高亮，UTF-8/GBK 自动识别）
- Markdown（marked 渲染 + 代码高亮）
- HTML（沙箱 iframe，禁用 allow-same-origin 防 XSS）
- 图片 / PDF / 视频 / 音频
- Office（`view.officeapps.live.com` 在线预览）
- ZIP（列出内容 + 压缩率 + 图标）
- 十六进制（前 4 MB）

### Electron 桌面专属
- **系统右键菜单**：资源管理器里右键文件/文件夹 → 「上传到 ShareBox」（可在设置里注册/注销）
- **单实例锁**：第二次启动唤起已有窗口
- **命令行参数**：`--upload "路径"` 直接上传
- **外部链接拦截**：点外链 → 系统浏览器打开
- **Supabase 链接内部跳转**：聊天里的文件链接点击后自动切网盘定位
- **自定义图标**：本地图标目录（可更换），按扩展名命名（`psd.svg` → `.psd`）
- **settings.json**：保存在 `%APPDATA%\sharebox\settings.json`
- **系统托盘**：关闭最小化、首次提示
- **深色模式、通知开关**

### 其它
- **完全离线**：所有依赖（hljs / jszip / marked / supabase-js / 90+ 图标）都在本地
- **文件图标**：90+ SVG，覆盖 100+ 扩展名

## 技术栈

- **Electron 33** + electron-builder 26
- **原生 JS**（无框架、无打包器、无运行时依赖，`<script>` 顺序加载）
- **Supabase**（Postgres + Storage + Realtime）

## 目录结构

```
index.html              入口 HTML
main.js                 Electron 主进程（本地 HTTP 服务 + 窗口 + 托盘 + 右键菜单 + 自定义图标）
preload.js              contextBridge 桥接（IPC API）
env.js                  Supabase 配置（含公开 key，可提交）
js/                     渲染进程模块
  config.js             Supabase client、图标映射、类型判断、常量
  media-cache.js        IndexedDB 媒体缓存 + 网格懒加载
  utils.js              工具 / Toast / 主题 / 通知 / 主标签 / 外部链接拦截
  dialog.js             通用弹窗（alert / confirm / prompt / choose / newFile / openWith）
  preview.js            文件预览总入口（按类型分发）
  share.js              文件分享（上传 / 链接 / 卡片 / 文件名解析）
  favorites.js          收藏夹 + 快速访问
  chat.js               聊天室（Markdown / 工具栏 / 语法提示 / Realtime）
  upload.js             上传核心（FSA / 拖拽 / 进度条）
  explorer.js           文件树 / 8 种视图 / 选择 / 拖拽 / 搜索 / 面包屑 / 状态栏
  actions.js            复制粘贴 / 重命名 / 删除 / 下载 / 新建
  context-menus.js      所有右键菜单 + 属性对话框 + copyToClipboard 兜底
  tabs.js               多标签页
  settings.js           设置面板（Windows 右键菜单 + 自定义图标入口）
  custom-icons.js       自定义图标管理（仅 Electron）
  main.js               入口初始化（严格顺序）
css/                    样式（base / chat / explorer / viewer / dialog / menu / share / dark）
build/                  electron-builder 资源（图标 / 安装器侧栏）
assets/
  file-icons/           90+ 文件类型 SVG 图标
  lib/                  本地依赖（hljs / jszip / marked / supabase-js）
  icon.ico              运行时图标
supabase/               Supabase CLI 本地目录
  migrations/           数据库迁移 SQL
  config.toml           项目配置
.github/workflows/      CI（三平台构建）
```

更详细的技术说明见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 本地开发

```powershell
# 安装依赖（只有 electron 和 electron-builder 两个 devDependencies）
npm.cmd install

# 启动 Electron
npm.cmd start
```

**只调 UI** 时（js / css / html 改动），不用起 Electron，用 Python 起静态服务即可：

```powershell
python -m http.server 8080
# 浏览器打开 http://localhost:8080
```

**注意**：
- `main.js`（Electron 主进程）只在 Electron 里生效，浏览器里测不到
- 涉及**托盘、右键菜单、自定义图标、外部链接拦截**的改动必须跑 Electron
- 涉及**纯 UI 渲染、预览、聊天室布局**的改动浏览器里就能测

## Supabase 配置

配置在 `env.js`：

```js
window.__SHAREBOX_ENV__ = {
    SUPABASE_URL: "https://ekphociqviwojbonbcbd.supabase.co",
    SUPABASE_ANON_KEY: "sb_publishable_xxx"
};
```

换环境只改这一个文件。`ANON_KEY` 是公开可发布的，权限由 RLS 策略控制。

### 数据库表

- `file_list`：文件列表（`id / file_name / file_url / storage_path / created_at`）
- `messages`：聊天室消息（`id / username / content / created_at`）
- `favorites`：收藏（`id / path / name / type / storage_path / created_at`）

### 数据库迁移

用 Supabase CLI 管理：

```powershell
# 首次
supabase login
supabase link --project-ref ekphociqviwojbonbcbd

# 改 schema
supabase migration new 描述性名字
# 编辑 supabase/migrations/xxx.sql
supabase db push
```

## 发版流程

```powershell
# 1. 改 package.json 的 version 跟 tag 保持一致
# 2. 提交
git add .
git commit -m "release: v1.3.4"
git push

# 3. 打 tag 并推送（触发 CI）
git tag v1.3.4
git push origin v1.3.4
```

CI 自动：三平台构建安装包 → 图标尺寸校验（macOS ≥ 512×512）→ 创建 GitHub Release。

## 已知限制

- **打包未签名**：Windows 首启会弹"未知发布者"，macOS 需右键打开
- **Storage 容量**：按 Supabase 免费套餐 1 GB 显示（`STORAGE_QUOTA` 常量）
- **通知**：浏览器里走 Web Notification API；Electron 里走系统通知
- **分享链接中文乱码**：Supabase Storage 会丢弃 `charset` 参数，纯文本文件的公开 URL 用浏览器打开可能乱码（已知上游问题，未修）
- **CDN 未使用**：所有资源本地化，但 Office 预览仍走 `view.officeapps.live.com`（无法本地化）
