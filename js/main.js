/* ============================================================
 * 入口：初始化顺序很重要
 * ============================================================ */

// 1. UI 初始化（不依赖数据）
initThemeToggle();
initNotifyToggle();
initTextViewer();
initChatEvents();

// 2. 标签页要在 explorer 事件之前，因为 explorer 依赖 activeTabId
initMainTabs();
initFolderTabs();

// 3. 资源管理器事件
initExplorerEvents();
initContextMenu();
initKeyboardShortcuts();
initSearch();
initRubberBand();

// 4. 拖拽上传初始化（轮询等待 dropArea）
initUploadMenu();
tryInitDrop();

// 5. 加载数据
loadMessages();
loadFiles();

// 6. Realtime 监听
initChatRealtime();