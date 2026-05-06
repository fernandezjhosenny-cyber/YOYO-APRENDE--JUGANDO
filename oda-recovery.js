(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const SESSION_KEY = "yoyo_rg_x";
  const UI_KEY = "yoyo_rg_u";
  const PROGRESS_KEY = "yoyo_rg_p";
  const RESET_KEY = "yoyo_oda_reset_version";
  const RESET_VERSION = "20260430-1";
  const ODA_STATE_KEYS = [
    "yoyo_oda_order_state",
    "yoyo_oda_fill_state",
    "yoyo_oda_memory_state",
    "yoyo_oda_detective_state",
  ];

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  function getSession() {
    return read(SESSION_KEY, null);
  }

  function getStudentId() {
    const session = getSession();
    return session && session.role === "student" ? session.id : "";
  }

  function resetOdaProgressOnce() {
    const sid = getStudentId();
    if (!sid) return;
    if (localStorage.getItem(RESET_KEY) === RESET_VERSION) return;

    const progress = read(PROGRESS_KEY, {});
    if (progress[sid]) {
      Object.keys(progress[sid]).forEach((key) => {
        if (key.startsWith("oda-")) {
          delete progress[sid][key];
        }
      });
      write(PROGRESS_KEY, progress);
    }

    ODA_STATE_KEYS.forEach((key) => {
      const all = read(key, {});
      if (all[sid]) {
        delete all[sid];
        write(key, all);
      }
    });

    localStorage.setItem(RESET_KEY, RESET_VERSION);
  }

  function setStudentUi(nextState) {
    const sid = getStudentId();
    if (!sid) return;
    const ui = read(UI_KEY, {});
    ui[sid] = { ...(ui[sid] || {}), ...nextState };
    write(UI_KEY, ui);
  }

  function installFallbackNavigation() {
    app.addEventListener("click", (event) => {
      const topicButton = event.target.closest('[data-ot="oda"]');
      if (topicButton) {
        event.preventDefault();
        setStudentUi({ topic: "oda", act: "" });
        location.reload();
        return;
      }

      const activityButton = event.target.closest('[data-oa^="oda-"]');
      if (activityButton) {
        event.preventDefault();
        setStudentUi({ act: activityButton.dataset.oa });
        location.reload();
        return;
      }

      const backTopicButton = event.target.closest("[data-bt]");
      if (backTopicButton) {
        event.preventDefault();
        setStudentUi({ topic: "", act: "" });
        location.reload();
        return;
      }

      const backActivityButton = event.target.closest("[data-ba]");
      if (backActivityButton) {
        event.preventDefault();
        setStudentUi({ act: "" });
        location.reload();
      }
    });
  }

  resetOdaProgressOnce();
  installFallbackNavigation();
})();
