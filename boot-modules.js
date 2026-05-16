(function () {
  const DEBUG = true;
  const SESSION_KEY = "yoyo_rg_x";
  const CORE_TEACHER_SCRIPTS = [
    "teacher-console-lite.js?v=20260515-2"
  ];

  const STUDENT_GAME_SCRIPTS = [
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
  let teacherRenderPending = false;
  let studentScriptsLoaded = false;

  function debugCount(label) {
    if (DEBUG) console.count(label);
  }

  function debugLog(label, payload) {
    if (DEBUG) console.info(label, payload || "");
  }

  function readSession() {
    debugCount("[YOYO_DEBUG] session read");
    try {
      const raw = localStorage.getItem(SESSION_KEY);
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

  async function ensureTeacherScripts() {
    debugCount("[YOYO_DEBUG] ensureTeacherScripts");
    if (teacherScriptsLoaded) return;
    teacherScriptsLoaded = true;
    for (const src of CORE_TEACHER_SCRIPTS) {
      try {
        await loadScript(src);
      } catch (error) {
        console.warn("[YOYO] modulo docente no cargado:", src, error);
      }
    }
  }

  async function ensureStudentScripts() {
    debugCount("[YOYO_DEBUG] ensureStudentScripts");
    if (studentScriptsLoaded) return;
    studentScriptsLoaded = true;
    for (const src of STUDENT_GAME_SCRIPTS) {
      try {
        await loadScript(src);
      } catch (error) {
        console.warn("[YOYO] modulo estudiante no cargado:", src, error);
      }
    }
  }

  async function renderTeacherLite(reason) {
    debugCount("[YOYO_DEBUG] teacher render request");
    debugLog("[YOYO_DEBUG] teacher render reason", reason);
    await ensureTeacherScripts();
    if (typeof window.__YOYO_TEACHER_LITE_RENDER === "function") {
      window.__YOYO_TEACHER_LITE_RENDER(reason);
    }
  }

  function scheduleTeacherRender(reason) {
    debugCount("[YOYO_DEBUG] teacher render scheduled");
    if (teacherRenderPending) return;
    teacherRenderPending = true;
    queueMicrotask(async () => {
      teacherRenderPending = false;
      await renderTeacherLite(reason);
    });
  }

  async function handleSessionChange(source) {
    debugCount("[YOYO_DEBUG] session change handler");
    const session = readSession();
    debugLog("[YOYO_DEBUG] session source", { source, role: session?.role || "none" });
    if (!session) return;
    if (session.role === "teacher") {
      scheduleTeacherRender(source);
      return;
    }
    await ensureStudentScripts();
  }

  function patchStorageEvents() {
    if (window.__yoyoStoragePatchApplied) return;
    window.__yoyoStoragePatchApplied = true;

    const originalSetItem = localStorage.setItem.bind(localStorage);
    const originalRemoveItem = localStorage.removeItem.bind(localStorage);

    localStorage.setItem = function (key, value) {
      const result = originalSetItem(key, value);
      if (key === SESSION_KEY) {
        window.dispatchEvent(new CustomEvent("yoyo:session-changed", { detail: { type: "set", value } }));
      }
      return result;
    };

    localStorage.removeItem = function (key) {
      const result = originalRemoveItem(key);
      if (key === SESSION_KEY) {
        window.dispatchEvent(new CustomEvent("yoyo:session-changed", { detail: { type: "remove" } }));
      }
      return result;
    };
  }

  window.__YOYO_TEACHER_LITE_MOUNT__ = function (reason) {
    debugCount("[YOYO_DEBUG] teacher mount hook");
    scheduleTeacherRender(reason || "teacher-hook");
    return true;
  };

  patchStorageEvents();

  window.addEventListener("yoyo:session-changed", () => handleSessionChange("custom-event"));
  window.addEventListener("storage", () => handleSessionChange("storage-event"));

  if (document.readyState === "complete") {
    handleSessionChange("boot-complete");
  } else {
    window.addEventListener("load", () => handleSessionChange("boot-load"), { once: true });
  }
})();
