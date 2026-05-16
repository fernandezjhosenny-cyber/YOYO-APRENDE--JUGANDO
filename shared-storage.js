(() => {
  const isLocalMode =
    window.location.protocol === "file:" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost";

  if (isLocalMode) {
    window.__YOYO_SHARED_SYNC__ = {
      refresh() {},
      flush() {},
      keys: [],
    };
    return;
  }

  const SHARED_KEYS = [
    "yoyo_rg_t",
    "yoyo_rg_s",
    "yoyo_rg_p",
    "yoyo_rg_u",
    "yoyo_classroom_mgmt_v2",
    "yoyo_owner_teacher_id",
    "yoyo_rg_mail_outbox",
  ];

  const managed = new Set(SHARED_KEYS);
  const original = {
    getItem: Storage.prototype.getItem,
    setItem: Storage.prototype.setItem,
    removeItem: Storage.prototype.removeItem,
    clear: Storage.prototype.clear,
  };

  const snapshot = window.__YOYO_SHARED_STATE__ && typeof window.__YOYO_SHARED_STATE__ === "object"
    ? window.__YOYO_SHARED_STATE__
    : { keys: {} };

  const mirror = new Map();
  const queue = new Map();
  let flushTimer = null;
  let refreshTimer = null;
  let refreshing = false;
  let lastUpdatedAt = Number(snapshot.updatedAt || 0) || 0;

  function rawGet(key) {
    return original.getItem.call(window.localStorage, key);
  }

  function rawSet(key, value) {
    original.setItem.call(window.localStorage, key, value);
  }

  function rawRemove(key) {
    original.removeItem.call(window.localStorage, key);
  }

  function applySnapshot(data) {
    const keys = data && data.keys && typeof data.keys === "object" ? data.keys : {};
    const updatedAt = Number(data && data.updatedAt || 0) || 0;
    if (updatedAt && updatedAt < lastUpdatedAt) {
      return false;
    }
    let changed = false;
    SHARED_KEYS.forEach((key) => {
      const nextValue = typeof keys[key] === "string" ? keys[key] : null;
      const currentValue = mirror.has(key) ? mirror.get(key) : rawGet(key);
      if (nextValue === null) {
        if (typeof currentValue === "string") {
          mirror.delete(key);
          rawRemove(key);
          changed = true;
        }
        return;
      }
      if (currentValue !== nextValue) {
        mirror.set(key, nextValue);
        rawSet(key, nextValue);
        changed = true;
      }
    });
    if (updatedAt) {
      lastUpdatedAt = Math.max(lastUpdatedAt, updatedAt);
    }
    return changed;
  }

  function seedFromLocalIfMissing(data) {
    const keys = data && data.keys && typeof data.keys === "object" ? data.keys : {};
    SHARED_KEYS.forEach((key) => {
      const sharedValue = typeof keys[key] === "string" ? keys[key] : null;
      const localValue = rawGet(key);
      if (sharedValue !== null) {
        mirror.set(key, sharedValue);
        rawSet(key, sharedValue);
        return;
      }
      if (typeof localValue === "string") {
        mirror.set(key, localValue);
        queue.set(key, localValue);
      }
    });
    scheduleFlush(40);
  }

  function buildPayload() {
    const updates = {};
    queue.forEach((value, key) => {
      updates[key] = value;
    });
    return { updates };
  }

  function scheduleFlush(delay = 120) {
    if (flushTimer) {
      clearTimeout(flushTimer);
    }
    flushTimer = setTimeout(flushQueuedUpdates, delay);
  }

  function flushQueuedUpdates() {
    flushTimer = null;
    if (!queue.size) return;
    const payload = buildPayload();
    queue.clear();

    fetch("/api/shared-storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      credentials: "same-origin",
    })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (data) {
          applySnapshot(data);
        }
      })
      .catch(() => {});
  }

  function refreshFromServer() {
    if (refreshing || document.hidden) return;
    refreshing = true;
    fetch("/api/shared-storage", {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
    })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (data) {
          applySnapshot(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        refreshing = false;
      });
  }

  function clearRefreshTimer() {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
  }

  function scheduleRefresh(delay = 30000) {
    clearRefreshTimer();
    if (document.hidden) return;
    refreshTimer = setTimeout(() => {
      refreshFromServer();
      scheduleRefresh(30000);
    }, delay);
  }

  applySnapshot(snapshot);
  seedFromLocalIfMissing(snapshot);

  Storage.prototype.getItem = function patchedGetItem(key) {
    if (this === window.localStorage && managed.has(key)) {
      if (mirror.has(key)) return mirror.get(key);
      const fallback = rawGet(key);
      if (typeof fallback === "string") {
        mirror.set(key, fallback);
        return fallback;
      }
      return null;
    }
    return original.getItem.call(this, key);
  };

  Storage.prototype.setItem = function patchedSetItem(key, value) {
    const stringValue = String(value);
    original.setItem.call(this, key, stringValue);
    if (this === window.localStorage && managed.has(key)) {
      mirror.set(key, stringValue);
      queue.set(key, stringValue);
      scheduleFlush();
    }
  };

  Storage.prototype.removeItem = function patchedRemoveItem(key) {
    original.removeItem.call(this, key);
    if (this === window.localStorage && managed.has(key)) {
      mirror.delete(key);
      queue.set(key, null);
      scheduleFlush();
    }
  };

  Storage.prototype.clear = function patchedClear() {
    original.clear.call(this);
    if (this === window.localStorage) {
      SHARED_KEYS.forEach((key) => {
        mirror.delete(key);
        queue.set(key, null);
      });
      scheduleFlush();
    }
  };

  window.addEventListener("focus", () => {
    refreshFromServer();
    scheduleRefresh(30000);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearRefreshTimer();
      return;
    }
    refreshFromServer();
    scheduleRefresh(30000);
  });

  window.addEventListener("beforeunload", () => {
    clearRefreshTimer();
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    if (!queue.size) return;
    const payload = JSON.stringify(buildPayload());
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/shared-storage", blob);
        queue.clear();
      }
    } catch {}
  });

  scheduleRefresh(10000);
  window.__YOYO_SHARED_SYNC__ = {
    refresh: refreshFromServer,
    flush: flushQueuedUpdates,
    keys: [...SHARED_KEYS],
  };
})();
