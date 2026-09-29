const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('shareboxAPI', {
    icons: {
        list: () => ipcRenderer.invoke('custom-icons:list'),
        getDir: () => ipcRenderer.invoke('custom-icons:getDir'),
        openFolder: () => ipcRenderer.invoke('custom-icons:openFolder'),
        pick: () => ipcRenderer.invoke('custom-icons:pick'),
        add: (srcPath, ext) => ipcRenderer.invoke('custom-icons:add', { srcPath, ext }),
        delete: (ext) => ipcRenderer.invoke('custom-icons:delete', ext),
        reload: () => ipcRenderer.invoke('custom-icons:reload'),
        onChanged: (cb) => {
            ipcRenderer.on('custom-icons:changed', (e, icons) => {
                try { cb(icons); } catch (err) { console.warn('onChanged cb error', err); }
            });
        }
    },

    contextMenu: {
        isRegistered: () => ipcRenderer.invoke('context-menu:isRegistered'),
        register: () => ipcRenderer.invoke('context-menu:register'),
        unregister: () => ipcRenderer.invoke('context-menu:unregister'),
        readFile: (filePath) => ipcRenderer.invoke('context-menu:readFile', filePath),
        onUploadRequest: (cb) => {
            // 先移除旧监听器，避免刷新页面后累积导致重复触发
            ipcRenderer.removeAllListeners('context-menu:upload-request');
            ipcRenderer.on('context-menu:upload-request', (e, filePath) => {
                try { cb(filePath); } catch (err) { console.warn('upload-request cb error', err); }
            });
        }
    }
});