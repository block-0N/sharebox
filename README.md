# ShareBox

基于 Electron + Supabase 的桌面文件分享工具。

## 功能

- 公共聊天室（Realtime 消息推送 + 系统通知）
- 公共网盘（上传 / 下载 / 预览 / 搜索 / 多标签页 / 拖拽移动）
- 内联重命名、右键菜单、框选、多选
- 深色模式、系统托盘
- 类型识别（200+ 扩展名，vscode-icons）

## 技术栈

- Electron 33 + electron-builder 26
- 原生 JS（无框架、无打包器，`<script>` 顺序加载）
- Supabase（Postgres + Storage + Realtime）

## 目录结构

```
index.html          入口
main.js             Electron 主进程
js/                 渲染进程模块（按依赖顺序加载）
  config.js         配置 + 图标映射 + 类型判断
  utils.js          工具 / Toast / 主题 / 通知
  dialog.js         通用弹窗
  preview.js        文件预览（文本/MD/图片/PDF/音视频/Office/ZIP/HEX）
  chat.js           聊天室
  upload.js         上传
  explorer.js       文件树 / 列表 / 多选 / 拖拽 / 搜索
  actions.js        右键菜单 / 复制粘贴 / 重命名 / 删除
  tabs.js           标签页
  main.js           入口初始化
css/                样式
build/              electron-builder 资源（图标 / 安装器侧栏，不进 asar）
assets/             运行时图标（进 asar）
env.js              Supabase 配置（此文件含公开 key，可提交）
```

## 本地开发

```powershell
# 1. 安装依赖
npm.cmd install

# 2. 启动 Electron
npm.cmd start
```

只调 UI（js/css/html）时可以不起 Electron，用 Python 起静态服务在浏览器里看：

```powershell
python -m http.server 8080
# 然后打开 http://localhost:8080
```

**注意**：`main.js`（Electron 主进程）只在 Electron 里生效，浏览器里测不到。

## Supabase 配置

配置在 `env.js`：

```js
window.__SHAREBOX_ENV__ = {
    SUPABASE_URL: "https://xxx.supabase.co",
    SUPABASE_ANON_KEY: "sb_publishable_xxx"
};
```

换环境改这一个文件即可。

## 发版流程

```powershell
# 1. 改 package.json 里的 version（跟 tag 保持一致）
# 2. 提交
git add .
git commit -m "release: v1.3.1"
git push

# 3. 打 tag 并推送（触发 CI）
git tag v1.3.1
git push origin v1.3.1
```

CI 会自动：
- 三平台（Windows / macOS / Linux）构建安装包
- 图标尺寸校验（macOS 要求 icon.png ≥ 512×512）
- 创建 GitHub Release 并上传产物

## 已知限制

- 打包未签名：Windows 首次运行会弹"未知发布者"，macOS 需要右键打开
- Storage 容量按 Supabase 免费套餐 1 GB 显示
- 浏览器里测试时通知走 Web Notification API；Electron 里走系统通知