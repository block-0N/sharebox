/* ============================================================
 * IndexedDB 媒体缓存（图片 / 缩略图）
 * ============================================================ */
(function () {
    const DB_NAME = 'sharebox-media-cache';
    const DB_VERSION = 1;
    const STORE = 'media';
    const MAX_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB
    const MAX_ENTRIES = 2000;
    const MEM_CACHE_MAX = 80;

    let dbPromise = null;
    const memCache = new Map();

    function openDB() {
        if (dbPromise) return dbPromise;
        dbPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = e => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE)) {
                    const store = db.createObjectStore(STORE, { keyPath: 'url' });
                    store.createIndex('timestamp', 'timestamp');
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        return dbPromise;
    }

    function trimMemCache() {
        while (memCache.size > MEM_CACHE_MAX) {
            const firstKey = memCache.keys().next().value;
            const u = memCache.get(firstKey);
            try { URL.revokeObjectURL(u); } catch (e) {}
            memCache.delete(firstKey);
        }
    }

    async function get(url) {
        if (memCache.has(url)) return memCache.get(url);
        try {
            const db = await openDB();
            const tx = db.transaction(STORE, 'readonly');
            const req = tx.objectStore(STORE).get(url);
            const result = await new Promise((res, rej) => {
                req.onsuccess = () => res(req.result);
                req.onerror = () => rej(req.error);
            });
            if (!result || !result.blob) return null;
            const objURL = URL.createObjectURL(result.blob);
            memCache.set(url, objURL);
            trimMemCache();
            return objURL;
        } catch (e) {
            console.warn('[media-cache] get 失败', e);
            return null;
        }
    }

    async function put(url, blob) {
        try {
            const db = await openDB();
            const tx = db.transaction(STORE, 'readwrite');
            tx.objectStore(STORE).put({
                url,
                blob,
                timestamp: Date.now(),
                size: blob.size || 0
            });
            await new Promise((res, rej) => {
                tx.oncomplete = res;
                tx.onerror = () => rej(tx.error);
            });
            if (!memCache.has(url)) {
                memCache.set(url, URL.createObjectURL(blob));
                trimMemCache();
            }
            cleanIfNeeded();
            return true;
        } catch (e) {
            console.warn('[media-cache] put 失败', e);
            return false;
        }
    }

    async function fetchCached(url) {
        const cached = await get(url);
        if (cached) return cached;
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const blob = await res.blob();
        await put(url, blob);
        return memCache.get(url) || URL.createObjectURL(blob);
    }

    async function cleanIfNeeded() {
        try {
            const db = await openDB();
            const tx = db.transaction(STORE, 'readonly');
            const store = tx.objectStore(STORE);
            const all = await new Promise(res => {
                const req = store.getAll();
                req.onsuccess = () => res(req.result || []);
            });
            if (all.length <= MAX_ENTRIES && all.reduce((s, x) => s + (x.size || 0), 0) <= MAX_SIZE_BYTES) return;

            all.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            let total = all.reduce((s, x) => s + (x.size || 0), 0);
            const toDelete = [];
            for (const item of all) {
                if (total <= MAX_SIZE_BYTES * 0.7 && (all.length - toDelete.length) < MAX_ENTRIES * 0.7) break;
                toDelete.push(item.url);
                total -= (item.size || 0);
            }
            if (!toDelete.length) return;

            const delTx = db.transaction(STORE, 'readwrite');
            const delStore = delTx.objectStore(STORE);
            for (const u of toDelete) {
                delStore.delete(u);
                if (memCache.has(u)) {
                    try { URL.revokeObjectURL(memCache.get(u)); } catch (e) {}
                    memCache.delete(u);
                }
            }
            console.log(`[media-cache] 清理 ${toDelete.length} 个旧缓存`);
        } catch (e) {
            console.warn('[media-cache] 清理失败', e);
        }
    }

    async function clearAll() {
        try {
            const db = await openDB();
            const tx = db.transaction(STORE, 'readwrite');
            tx.objectStore(STORE).clear();
            await new Promise(res => { tx.oncomplete = res; });
            memCache.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} });
            memCache.clear();
            return true;
        } catch (e) {
            console.warn('[media-cache] clear 失败', e);
            return false;
        }
    }

    async function stats() {
        try {
            const db = await openDB();
            const tx = db.transaction(STORE, 'readonly');
            const all = await new Promise(res => {
                const req = tx.objectStore(STORE).getAll();
                req.onsuccess = () => res(req.result || []);
            });
            return {
                count: all.length,
                size: all.reduce((s, x) => s + (x.size || 0), 0)
            };
        } catch (e) {
            return { count: 0, size: 0 };
        }
    }

    window.mediaCache = { get, put, fetch: fetchCached, clear: clearAll, stats };

/* ============================================================
 * 网格视图懒加载
 * ============================================================ */
let _gridObserver = null;

async function _loadLazyImage(img) {
    if (img.dataset.loaded) return;
    img.dataset.loaded = '1';

    const url = img.dataset.src;
    if (!url) return;

    try {
        let displayURL = url;
        // 只对 Supabase 远程图片走缓存
        if (window.mediaCache && /supabase\.co/i.test(url)) {
            displayURL = await window.mediaCache.fetch(url);
        }
        img.src = displayURL;
    } catch (e) {
        console.warn('[lazy] 加载失败，降级原 URL', url, e.message);
        img.src = url;
    }
}

function initGridLazyLoad() {
    if (_gridObserver) {
        _gridObserver.disconnect();
        _gridObserver = null;
    }

    const list = document.getElementById('fileList');
    if (!list) return;

    const imgs = list.querySelectorAll('img[data-src]');
    if (!imgs.length) return;

    if (typeof IntersectionObserver !== 'function') {
        // 老浏览器兜底：立即全部加载
        imgs.forEach(img => _loadLazyImage(img));
        return;
    }

    _gridObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                _gridObserver.unobserve(entry.target);
                _loadLazyImage(entry.target);
            }
        }
    }, {
        root: list,
        rootMargin: '300px 0px',   // 提前 300px 预加载
        threshold: 0.01
    });

    imgs.forEach(img => _gridObserver.observe(img));
}

window.initGridLazyLoad = initGridLazyLoad;
})();