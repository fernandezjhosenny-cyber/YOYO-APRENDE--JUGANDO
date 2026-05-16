(function () {
  const ATTEMPTS_KEY = "yoyo_rg_attempts";
  const SESSION_KEY = "yoyo_rg_x";
  const PROGRESS_KEY = "yoyo_rg_p";
  const MAX_ATTEMPTS = 2;
  const CLICK_DEBOUNCE_MS = 700;
  const app = document.getElementById("app");
  if (!app) return;

  let rafId = 0;
  let bannerSignature = "";
  const recentClicks = new Map();

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getStudentSession() {
    const session = readJson(SESSION_KEY, null);
    return session && session.role === "student" ? session : null;
  }

  function ensureStore() {
    return readJson(ATTEMPTS_KEY, {});
  }

  function defaultRecord() {
    return {
      attemptsUsed: 0,
      locked: false,
      bestScore: 0,
      bestPercent: 0,
      updatedAt: ""
    };
  }

  function getRecord(studentId, topicId, gameId, levelId) {
    const store = ensureStore();
    return store?.[studentId]?.[topicId]?.[gameId]?.[levelId] || defaultRecord();
  }

  function setRecord(studentId, topicId, gameId, levelId, patch) {
    const store = ensureStore();
    store[studentId] = store[studentId] || {};
    store[studentId][topicId] = store[studentId][topicId] || {};
    store[studentId][topicId][gameId] = store[studentId][topicId][gameId] || {};
    const current = store[studentId][topicId][gameId][levelId] || defaultRecord();
    const next = {
      ...current,
      ...patch
    };
    store[studentId][topicId][gameId][levelId] = next;
    writeJson(ATTEMPTS_KEY, store);
    return next;
  }

  function summarizeStudent(studentId) {
    const store = ensureStore();
    const byStudent = store[studentId] || {};
    const rows = [];
    Object.entries(byStudent).forEach(([topicId, topicGames]) => {
      Object.entries(topicGames || {}).forEach(([gameId, levels]) => {
        Object.entries(levels || {}).forEach(([levelId, item]) => {
          rows.push({
            topicId,
            gameId,
            levelId,
            attemptsUsed: Number(item?.attemptsUsed || 0),
            locked: Boolean(item?.locked),
            bestScore: Number(item?.bestScore || 0),
            bestPercent: Number(item?.bestPercent || 0),
            updatedAt: item?.updatedAt || ""
          });
        });
      });
    });
    return {
      rows: rows.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)),
      exhaustedLevels: rows.filter((item) => item.locked).length,
      totalAttempts: rows.reduce((sum, item) => sum + item.attemptsUsed, 0)
    };
  }

  function getCurrentCard() {
    return app.querySelector(".play-card[data-g]");
  }

  function getCurrentGameId(card) {
    return String(card?.dataset?.g || "");
  }

  function getCurrentTopicId(gameId) {
    return String(gameId || "").split("-")[0] || "general";
  }

  function getCurrentLevelId(card) {
    if (!card) return "nivel-1";
    const text = card.textContent || "";
    const match = text.match(/(?:Nivel|Pregunta|Paso)\s+(\d+)/i);
    if (match) return `nivel-${match[1]}`;
    return "nivel-1";
  }

  function isAttemptTrigger(button) {
    if (!button) return false;
    const text = (button.textContent || "").trim().toLowerCase();
    const datasetKeys = Object.keys(button.dataset || {});
    if (datasetKeys.some((key) => /(^v$|check|verify|create)/i.test(key))) return true;
    return /verificar|crear mi oda|crear oda|comprobar|revisar/i.test(text);
  }

  function ensureStyle() {
    if (document.getElementById("attempts-engine-style")) return;
    const style = document.createElement("style");
    style.id = "attempts-engine-style";
    style.textContent = `
      .attempts-banner{margin-top:12px;padding:10px 12px;border-radius:14px;background:#f8f5ff;color:#5d6a84;font-weight:700;display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}
      .attempts-banner.locked{background:#fff1f2;color:#b91c1c}
      .attempts-banner-copy{display:grid;gap:4px}
      .attempts-banner-note{font-size:.8rem;font-weight:700;opacity:.9}
      .attempts-banner .attempts-pill{display:inline-flex;padding:6px 10px;border-radius:999px;background:#efe8ff;color:#6d28d9;font-size:.82rem;font-weight:900}
      .attempts-banner.locked .attempts-pill{background:#fee2e2;color:#b91c1c}
      .attempts-disabled{opacity:.55;pointer-events:none}
    `;
    document.head.appendChild(style);
  }

  function syncRecordFromProgress(studentId, topicId, gameId, levelId) {
    const progress = readJson(PROGRESS_KEY, {});
    const entry = progress?.[studentId]?.[gameId];
    if (!entry) return;
    const current = getRecord(studentId, topicId, gameId, levelId);
    const rawMax = Math.max(1, Number(entry.rawMax || 10) || 10);
    const rawScore = Math.max(
      0,
      Number(
        Object.prototype.hasOwnProperty.call(entry, "bestScore")
          ? entry.bestScore
          : Object.prototype.hasOwnProperty.call(entry, "rawScore")
            ? entry.rawScore
            : entry.score
      ) || 0
    );
    const entryPercent = Object.prototype.hasOwnProperty.call(entry, "bestPercent")
      ? Number(entry.bestPercent || 0)
      : Object.prototype.hasOwnProperty.call(entry, "percent")
        ? Number(entry.percent || 0)
        : rawScore / rawMax;
    const percent100 = Math.max(0, Math.min(100, Math.round(entryPercent <= 1 ? entryPercent * 100 : entryPercent)));
    if (rawScore > Number(current.bestScore || 0) || percent100 > Number(current.bestPercent || 0)) {
      setRecord(studentId, topicId, gameId, levelId, {
        bestScore: Math.max(Number(current.bestScore || 0), rawScore),
        bestPercent: Math.max(Number(current.bestPercent || 0), percent100),
        updatedAt: entry.updatedAt || new Date().toISOString()
      });
    }
  }

  function renderAttemptState() {
    const session = getStudentSession();
    const card = getCurrentCard();
    if (!session || !card) {
      bannerSignature = "";
      return;
    }
    ensureStyle();

    const gameId = getCurrentGameId(card);
    const topicId = getCurrentTopicId(gameId);
    const levelId = getCurrentLevelId(card);
    if (!gameId) return;

    syncRecordFromProgress(session.id, topicId, gameId, levelId);
    const record = getRecord(session.id, topicId, gameId, levelId);

    let banner = card.querySelector(".attempts-banner");
    if (!banner) {
      banner = document.createElement("div");
      banner.className = "attempts-banner";
      const anchor = card.querySelector(".play-top") || card.querySelector(".game-board") || card.firstElementChild;
      anchor?.insertAdjacentElement("afterend", banner);
    }

    const remaining = Math.max(0, MAX_ATTEMPTS - Number(record.attemptsUsed || 0));
    const locked = Boolean(record.locked) || Number(record.attemptsUsed || 0) >= MAX_ATTEMPTS;
    const note = Number(record.bestScore || 0) > 0
      ? `Mejor puntuacion: ${record.bestScore} · Mejor porcentaje: ${record.bestPercent || 0}%`
      : "Tu mejor puntuacion se guardara automaticamente.";
    const html = locked
      ? `<div class="attempts-banner-copy"><span>Has alcanzado el límite de intentos para este nivel.</span><span class="attempts-banner-note">${note}</span></div><span class="attempts-pill">Intentos agotados</span>`
      : `<div class="attempts-banner-copy"><span>Intentos restantes: ${remaining}/${MAX_ATTEMPTS}</span><span class="attempts-banner-note">${note}</span></div><span class="attempts-pill">Usados: ${record.attemptsUsed || 0}</span>`;
    const signature = `${gameId}|${levelId}|${record.attemptsUsed}|${locked}|${record.bestScore}|${record.bestPercent}`;

    if (bannerSignature !== signature || banner.innerHTML !== html) {
      bannerSignature = signature;
      banner.className = `attempts-banner${locked ? " locked" : ""}`;
      banner.innerHTML = html;
    }

    const buttons = Array.from(card.querySelectorAll("button")).filter(isAttemptTrigger);
    buttons.forEach((button) => {
      if (locked) {
        button.disabled = true;
        button.classList.add("attempts-disabled");
        button.title = "Has alcanzado el límite de intentos para este nivel.";
      } else {
        button.classList.remove("attempts-disabled");
        button.disabled = false;
        button.removeAttribute("title");
      }
    });
  }

  function scheduleRender() {
    if (rafId) return;
    rafId = window.requestAnimationFrame(() => {
      rafId = 0;
      renderAttemptState();
    });
  }

  function consumeAttempt(studentId, topicId, gameId, levelId) {
    const key = `${studentId}:${gameId}:${levelId}`;
    const now = Date.now();
    const last = recentClicks.get(key) || 0;
    if (now - last < CLICK_DEBOUNCE_MS) {
      return { allowed: false, duplicate: true, record: getRecord(studentId, topicId, gameId, levelId) };
    }
    recentClicks.set(key, now);

    const record = getRecord(studentId, topicId, gameId, levelId);
    if (Number(record.attemptsUsed || 0) >= MAX_ATTEMPTS || record.locked) {
      return { allowed: false, locked: true, record };
    }

    const nextUsed = Number(record.attemptsUsed || 0) + 1;
    const nextRecord = setRecord(studentId, topicId, gameId, levelId, {
      attemptsUsed: nextUsed,
      locked: nextUsed >= MAX_ATTEMPTS,
      updatedAt: new Date().toISOString()
    });
    return { allowed: true, record: nextRecord };
  }

  function tryConsumeAttempt(card) {
    const session = getStudentSession();
    if (!session || !card) return { allowed: true };
    const gameId = getCurrentGameId(card);
    const topicId = getCurrentTopicId(gameId);
    const levelId = getCurrentLevelId(card);
    const result = consumeAttempt(session.id, topicId, gameId, levelId);
    if (!result.allowed) {
      scheduleRender();
      return result;
    }

    window.setTimeout(() => {
      syncRecordFromProgress(session.id, topicId, gameId, levelId);
      scheduleRender();
    }, 120);

    scheduleRender();
    return result;
  }

  app.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("button") : null;
    const card = event.target instanceof Element ? event.target.closest(".play-card[data-g]") : null;
    if (!button || !card || !isAttemptTrigger(button)) return;
    const result = tryConsumeAttempt(card);
    if (!result.allowed) {
      event.preventDefault();
      event.stopImmediatePropagation();
      scheduleRender();
    }
  }, true);

  const appObserver = new MutationObserver((mutations) => {
    const meaningful = mutations.some((mutation) => {
      const target = mutation.target instanceof Element ? mutation.target : null;
      return !target || !target.closest(".attempts-banner");
    });
    if (meaningful) scheduleRender();
  });

  appObserver.observe(app, { childList: true, subtree: true });
  scheduleRender();

  window.__YOYO_ATTEMPTS__ = {
    consumeAttempt,
    getRecord,
    summarizeStudent,
    renderAttemptState,
    maxAttempts: MAX_ATTEMPTS
  };
})();
