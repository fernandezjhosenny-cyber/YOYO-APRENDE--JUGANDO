(() => {
  const SHARED_KEYS = [
    "yoyo_rg_t",
    "yoyo_rg_s",
    "yoyo_rg_p",
    "yoyo_rg_x",
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
    SHARED_KEYS.forEach((key) => {
      if (typeof keys[key] === "string") {
        mirror.set(key, keys[key]);
        rawSet(key, keys[key]);
      }
    });
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
    if (refreshing) return;
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
  });

  window.addEventListener("beforeunload", () => {
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

  refreshTimer = setInterval(refreshFromServer, 4000);
  window.__YOYO_SHARED_SYNC__ = {
    refresh: refreshFromServer,
    flush: flushQueuedUpdates,
    keys: [...SHARED_KEYS],
  };
})();
