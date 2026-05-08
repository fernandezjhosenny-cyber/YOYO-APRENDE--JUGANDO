(function () {
  const CORE_TEACHER_SCRIPTS = [
    "teacher-console-lite.js?v=20260508-2"
  ];

  const DEFERRED_GAME_SCRIPTS = [
    "anuncio-radial-order.js?v=20260505-1",
    "anuncio-radial-fill.js?v=20260505-1",
    "anuncio-radial-classify.js?v=20260505-1",
    "anuncio-radial-memory.js?v=20260505-1",
    "anuncio-radial-detective.js?v=20260505-1",
    "anuncio-radial-target.js?v=20260505-1",
    "anuncio-radial-cubes.js?v=20260505-1",
    "anuncio-radial-pair.js?v=20260505-1",
    "anuncio-radial-wordsearch.js?v=20260505-1",
    "anuncio-radial-timeline.js?v=20260505-1",
    "anuncio-radial-studio.js?v=20260505-1",
    "oda-feedback-cleanup.js?v=20260501-1",
    "oda-order.js?v=20260501-1",
    "oda-fill.js?v=20260501-1",
    "oda-classify.js?v=20260501-1",
    "oda-memory.js?v=20260501-1",
    "oda-detective-simple.js?v=20260502-1",
    "oda-cubes.js?v=20260502-1",
    "oda-pair.js?v=20260502-1",
    "oda-wordsearch.js?v=20260502-1",
    "oda-timeline.js?v=20260502-1",
    "oda-studio.js?v=20260504-1"
  ];

  let teacherScriptsLoaded = false;
  let deferredGamesLoaded = false;

  function readSession() {
    try {
      const raw = localStorage.getItem("yoyo_rg_x");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[data-lazy-src="${src}"]`) || document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.dataset.lazySrc = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      document.body.appendChild(script);
    });
  }

  async function loadSerial(list) {
    for (const src of list) {
      try {
        await loadScript(src);
      } catch (error) {
        console.warn("[YOYO] modulo no cargado:", src, error);
      }
    }
  }

  async function ensureTeacherScripts() {
    if (teacherScriptsLoaded) return;
    teacherScriptsLoaded = true;
    await loadSerial(CORE_TEACHER_SCRIPTS);
  }

  function ensureDeferredGames(delay = 900) {
    if (deferredGamesLoaded) return;
    deferredGamesLoaded = true;
    idle(() => loadSerial(DEFERRED_GAME_SCRIPTS), delay);
  }

  async function ensureStudentGamesNow() {
    if (deferredGamesLoaded) return;
    deferredGamesLoaded = true;
    await loadSerial(DEFERRED_GAME_SCRIPTS);
  }

  function idle(task, fallback = 1200) {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(task, { timeout: fallback });
      return;
    }
    window.setTimeout(task, fallback);
  }

  async function boot() {
    const session = readSession();
    if (!session) {
      ensureDeferredGames(900);
      return;
    }

    if (session.role === "teacher") {
      await ensureTeacherScripts();
      return;
    }

    await ensureStudentGamesNow();
  }

  function watchSessionChanges() {
    const timer = window.setInterval(async () => {
      const session = readSession();
      if (!session) return;
      if (session.role === "teacher") {
        await ensureTeacherScripts();
        window.clearInterval(timer);
        return;
      }
      await ensureStudentGamesNow();
      window.clearInterval(timer);
    }, 700);

    window.addEventListener("storage", async () => {
      const session = readSession();
      if (!session) return;
      if (session.role === "teacher") {
        await ensureTeacherScripts();
        return;
      }
      await ensureStudentGamesNow();
    });
  }

  if (document.readyState === "complete") {
    boot();
  } else {
    window.addEventListener("load", boot, { once: true });
  }

  watchSessionChanges();
})();




