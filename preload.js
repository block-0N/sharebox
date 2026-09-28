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
    }
});