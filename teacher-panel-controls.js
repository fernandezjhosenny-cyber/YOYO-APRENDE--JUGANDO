(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const KEYS = {
    session: "yoyo_rg_x",
    students: "yoyo_rg_s",
    ui: "yoyo_rg_u",
    teacherConfig: "yoyo_rg_cfg",
    activeGame: "yoyo_rg_active",
    notice: "yoyo_rg_notice",
  };

  const TOPICS = {
  carta: "La Carta de Agradecimiento",
  receta: "La Receta",
  expositivo: "El Texto Expositivo",
  comentario: "El Comentario",
  anuncio: "El Anuncio Radial",
  oda: "La Oda",
  };

  const LABELS = {
    1: "Ordena la estructura",
    2: "Completa con arrastre",
    3: "Clasifica por colores",
    4: "Memoria visual",
    5: "Apunta al blanco",
    6: "Cubos 3D",
    7: "Relaciona ideas",
    8: "Sopa de palabras",
    9: "Linea del tiempo",
    10: "Carta final",
  };

  const CATALOG = Object.keys(TOPICS).flatMap((topicId) =>
    Array.from({ length: 10 }, (_, index) => ({
      id: `${topicId}-${index + 1}`,
      topicId,
      topicLabel: TOPICS[topicId],
      number: index + 1,
      title: LABELS[index + 1],
    }))
  );

  let timerId = null;
  let timerActivity = "";

  const read = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  const write = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const getSession = () => read(KEYS.session, null);
  const getStudents = () => read(KEYS.students, []);

  const defaultConfig = () => ({
    studentOrder: [],
    activities: CATALOG.reduce((acc, activity) => {
      acc[activity.id] = { enabled: true, duration: 0 };
      return acc;
    }, {}),
  });

  const getTeacherConfig = (teacherId) => {
    const store = read(KEYS.teacherConfig, {});
    const saved = store[teacherId] || {};
    const base = defaultConfig();
    return {
      studentOrder: Array.isArray(saved.studentOrder) ? saved.studentOrder : [],
      activities: Object.keys(base.activities).reduce((acc, activityId) => {
        const current = saved.activities?.[activityId] || {};
        acc[activityId] = {
          enabled: current.enabled !== false,
          duration: Number(current.duration || 0),
        };
        return acc;
      }, {}),
    };
  };

  const setTeacherConfig = (teacherId, config) => {
    const store = read(KEYS.teacherConfig, {});
    store[teacherId] = config;
    write(KEYS.teacherConfig, store);
  };

  const updateTeacherConfig = (teacherId, updater) => {
    const next = updater(getTeacherConfig(teacherId));
    setTeacherConfig(teacherId, next);
  };

  const getStudent = (studentId) => getStudents().find((student) => student.id === studentId) || null;
  const getTeacherIdForStudent = (studentId) => getStudent(studentId)?.teacherId || "";

  const getOrderedStudents = (teacherId) => {
    const students = getStudents().filter((student) => student.teacherId === teacherId);
    const config = getTeacherConfig(teacherId);
    const orderMap = new Map(config.studentOrder.map((studentId, index) => [studentId, index]));
    return [...students].sort((left, right) => {
      const a = orderMap.has(left.id) ? orderMap.get(left.id) : Number.MAX_SAFE_INTEGER;
      const b = orderMap.has(right.id) ? orderMap.get(right.id) : Number.MAX_SAFE_INTEGER;
      if (a !== b) return a - b;
      return String(left.name || "").localeCompare(String(right.name || ""));
    });
  };

  const getActivitySetting = (studentId, activityId) => {
    const teacherId = getTeacherIdForStudent(studentId);
    if (!teacherId) return { enabled: true, duration: 0 };
    return getTeacherConfig(teacherId).activities[activityId] || { enabled: true, duration: 0 };
  };

  const formatDuration = (minutes) => (Number(minutes || 0) > 0 ? `${minutes} min` : "Sin tiempo");

  const readUi = (studentId) => read(KEYS.ui, {})[studentId] || { topic: "", act: "" };

  const writeUi = (studentId, patch) => {
    const current = read(KEYS.ui, {});
    current[studentId] = { ...(current[studentId] || {}), ...patch };
    write(KEYS.ui, current);
  };

  const setNotice = (studentId, message) => {
    const notices = read(KEYS.notice, {});
    notices[studentId] = message;
    write(KEYS.notice, notices);
  };

  const consumeNotice = (studentId) => {
    const notices = read(KEYS.notice, {});
    const message = notices[studentId];
    if (!message) return "";
    delete notices[studentId];
    write(KEYS.notice, notices);
    return message;
  };

  const getActiveGames = () => read(KEYS.activeGame, {});

  const setActiveGame = (studentId, payload) => {
    const active = getActiveGames();
    active[studentId] = payload;
    write(KEYS.activeGame, active);
  };

  const clearActiveGame = (studentId) => {
    const active = getActiveGames();
    if (active[studentId]) {
      delete active[studentId];
      write(KEYS.activeGame, active);
    }
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
      timerActivity = "";
    }
  };

  const closeStudentActivity = (studentId, message) => {
    const active = getActiveGames()[studentId];
    if (!active) return;
    writeUi(studentId, { act: "" });
    setNotice(studentId, message);
    clearActiveGame(studentId);
  };

  const injectTeacherPanel = (teacherId) => {
    const panel = app.querySelector(".real-dashboard .real-panel");
    if (!panel) return;

    const config = getTeacherConfig(teacherId);
    const orderedStudents = getOrderedStudents(teacherId);
    const signature = JSON.stringify({
      order: config.studentOrder,
      activities: config.activities,
      students: orderedStudents.map((student) => student.id),
    });

    const existing = panel.querySelector(".teacher-control-panel");
    if (!existing || existing.dataset.signature !== signature) {
      const section = document.createElement("section");
      section.className = "teacher-control-panel";
      section.dataset.signature = signature;
      section.innerHTML = `
        <div class="teacher-control-head">
          <div>
            <div class="helper-main">Control del docente</div>
            <h3>Habilitar actividades y definir tiempo</h3>
          </div>
          <span class="real-chip">Configura acceso y tiempo por actividad</span>
        </div>
        <div class="teacher-order-panel">
          <h4>Orden de los alumnos</h4>
          <div class="teacher-order-grid">
            ${
              orderedStudents.length
                ? orderedStudents
                    .map(
                      (student, index) => `
                        <article class="teacher-student-card">
                          <div class="teacher-student-head">
                            <div>
                              <div class="teacher-order-line">Orden ${index + 1}</div>
                              <strong>${student.name}</strong>
                            </div>
                            <span class="real-chip">Alumno</span>
                          </div>
                          <div class="teacher-order-actions">
                            <button class="real-ghost order-btn" data-tp-order="${student.id}" data-dir="up" type="button">Subir</button>
                            <button class="real-ghost order-btn" data-tp-order="${student.id}" data-dir="down" type="button">Bajar</button>
                          </div>
                        </article>
                      `
                    )
                    .join("")
                : `<div class="teacher-attempt-empty">Todavia no hay estudiantes unidos.</div>`
            }
          </div>
        </div>
        <div class="teacher-topic-config-grid">
          ${Object.entries(TOPICS)
            .map(([topicId, topicLabel]) => {
              const activities = CATALOG.filter((activity) => activity.topicId === topicId);
              return `
                <article class="teacher-topic-config">
                  <h4>${topicLabel}</h4>
                  <div class="teacher-activity-list">
                    ${activities
                      .map((activity) => {
                        const current = config.activities[activity.id] || { enabled: true, duration: 0 };
                        return `
                          <label class="teacher-activity-row">
                            <div class="teacher-activity-copy">
                              <strong>${activity.number}. ${activity.title}</strong>
                              <span>${current.enabled ? "Habilitada" : "Bloqueada"} | ${formatDuration(current.duration)}</span>
                            </div>
                            <div class="teacher-activity-actions">
                              <input type="checkbox" data-tp-enabled="${activity.id}" ${current.enabled ? "checked" : ""}>
                              <input class="teacher-time-input" type="number" min="0" max="120" step="1" value="${current.duration}" data-tp-duration="${activity.id}">
                              <span class="teacher-time-label">min</span>
                            </div>
                          </label>
                        `;
                      })
                      .join("")}
                  </div>
                </article>
              `;
            })
            .join("")}
        </div>
      `;

      if (existing) existing.replaceWith(section);
      else panel.appendChild(section);
    }
  };

  const injectStudentControls = (studentId) => {
    const panel = app.querySelector(".real-student .real-panel");
    if (!panel) return;

    const notice = consumeNotice(studentId);
    if (notice) {
      panel.querySelector(".student-activity-notice")?.remove();
      const progressPanel = panel.querySelector(".progress-panel");
      const node = document.createElement("div");
      node.className = "student-activity-notice";
      node.textContent = notice;
      progressPanel?.insertAdjacentElement("afterend", node);
    }

    app.querySelectorAll(".activity-box[data-oa]").forEach((card) => {
      const activityId = card.dataset.oa;
      const current = getActivitySetting(studentId, activityId);
      card.disabled = !current.enabled;
      card.classList.toggle("activity-disabled", !current.enabled);

      let status = card.querySelector(".teacher-activity-status");
      if (!status) {
        status = document.createElement("div");
        status.className = "teacher-activity-status";
        card.appendChild(status);
      }
      const html = `
        <span class="real-chip ${current.enabled ? "enabled-chip" : "disabled-chip"}">${current.enabled ? "Habilitada" : "Bloqueada"}</span>
        <span class="real-chip">${formatDuration(current.duration)}</span>
      `;
      if (status.dataset.sig !== html) {
        status.innerHTML = html;
        status.dataset.sig = html;
      }
    });

    const playCard = app.querySelector(".play-card[data-g]");
    if (!playCard) {
      clearActiveGame(studentId);
      return;
    }

    const activityId = playCard.dataset.g;
    const current = getActivitySetting(studentId, activityId);
    if (!current.enabled) {
      playCard.innerHTML = `
        <div class="blocked-activity-card">
          <div class="evaluation-pill">Actividad bloqueada</div>
          <h3>Esta actividad no esta habilitada por el docente.</h3>
          <p>Tu maestro debe activarla en su panel antes de que puedas jugarla.</p>
        </div>
      `;
      clearActiveGame(studentId);
      return;
    }

    const top = playCard.querySelector(".play-top");
    if (top) {
      let timer = playCard.querySelector(".teacher-timer-banner");
      if (!timer) {
        timer = document.createElement("div");
        timer.className = "teacher-timer-banner";
        top.appendChild(timer);
      }
      timer.innerHTML = `
        <span class="evaluation-pill">Tiempo asignado: ${formatDuration(current.duration)}</span>
        <strong data-tp-countdown>${current.duration > 0 ? "" : "La actividad se cierra si sales de esta pantalla."}</strong>
      `;
    }

    const active = getActiveGames()[studentId];
    const ui = readUi(studentId);
    if (!active || active.activityId !== activityId) {
      setActiveGame(studentId, {
        activityId,
        topicId: ui.topic || String(activityId).split("-")[0],
        endsAt: current.duration > 0 ? Date.now() + current.duration * 60000 : 0,
      });
    }

    const countdown = playCard.querySelector("[data-tp-countdown]");
    if (timerId && timerActivity !== activityId) {
      clearInterval(timerId);
      timerId = null;
    }

    const tick = () => {
      const latest = getActiveGames()[studentId];
      if (!latest || latest.activityId !== activityId) {
        clearActiveGame(studentId);
        return;
      }
      if (!latest.endsAt) return;
      const remaining = latest.endsAt - Date.now();
      if (remaining <= 0) {
        closeStudentActivity(studentId, "La actividad se cerro porque se acabo el tiempo asignado por el docente.");
        window.location.reload();
        return;
      }
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      if (countdown) countdown.textContent = `Tiempo restante: ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    };

    tick();
    if (current.duration > 0 && !timerId) {
      timerActivity = activityId;
      timerId = setInterval(tick, 1000);
    }
  };

  app.addEventListener(
    "click",
    (event) => {
      const session = getSession();
      if (!session) return;

      const orderButton = event.target.closest("[data-tp-order]");
      if (orderButton && session.role === "teacher") {
        const ordered = getOrderedStudents(session.id).map((student) => student.id);
        const studentId = orderButton.dataset.tpOrder;
        const direction = orderButton.dataset.dir;
        updateTeacherConfig(session.id, (config) => {
          const order = config.studentOrder.filter((id) => ordered.includes(id));
          ordered.forEach((id) => {
            if (!order.includes(id)) order.push(id);
          });
          const index = order.indexOf(studentId);
          const nextIndex = direction === "up" ? index - 1 : index + 1;
          if (index >= 0 && nextIndex >= 0 && nextIndex < order.length) {
            [order[index], order[nextIndex]] = [order[nextIndex], order[index]];
          }
          return { ...config, studentOrder: order };
        });
        window.location.reload();
        return;
      }

      const leaveButton = event.target.closest("[data-ba], [data-bt], #bk");
      if (leaveButton && session.role === "student") {
        closeStudentActivity(session.id, "La actividad se cerro porque saliste de la pantalla del juego.");
      }
    },
    true
  );

  app.addEventListener("change", (event) => {
    const session = getSession();
    if (!session || session.role !== "teacher") return;

    const enabledInput = event.target.closest("[data-tp-enabled]");
    if (enabledInput) {
      const activityId = enabledInput.dataset.tpEnabled;
      updateTeacherConfig(session.id, (config) => ({
        ...config,
        activities: {
          ...config.activities,
          [activityId]: {
            ...(config.activities[activityId] || { duration: 0 }),
            enabled: enabledInput.checked,
          },
        },
      }));
      window.location.reload();
      return;
    }

    const durationInput = event.target.closest("[data-tp-duration]");
    if (durationInput) {
      const activityId = durationInput.dataset.tpDuration;
      const minutes = Math.max(0, Math.min(120, Number(durationInput.value || 0)));
      durationInput.value = String(minutes);
      updateTeacherConfig(session.id, (config) => ({
        ...config,
        activities: {
          ...config.activities,
          [activityId]: {
            ...(config.activities[activityId] || { enabled: true }),
            duration: minutes,
          },
        },
      }));
      window.location.reload();
    }
  });

  document.addEventListener("visibilitychange", () => {
    const session = getSession();
    if (!session || session.role !== "student" || !document.hidden) return;
    closeStudentActivity(session.id, "La actividad se cerro porque saliste de la actividad.");
  });

  window.addEventListener("beforeunload", () => {
    const session = getSession();
    if (!session || session.role !== "student") return;
    closeStudentActivity(session.id, "La actividad se cerro porque saliste de la actividad.");
  });

  const refresh = () => {
    const session = getSession();
    if (!session) return;
    if (session.role === "teacher") injectTeacherPanel(session.id);
    if (session.role === "student") injectStudentControls(session.id);
  };

  const observer = new MutationObserver(() => refresh());
  observer.observe(app, { childList: true, subtree: true });
  refresh();
})();
