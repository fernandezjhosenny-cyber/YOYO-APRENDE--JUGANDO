(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const KEYS = {
    teachers: "yoyo_live_teachers",
    students: "yoyo_live_students",
    session: "yoyo_live_session",
    ui: "yoyo_live_ui",
    progress: "yoyo_live_progress",
  };

  const TOPICS = [
makeTopic("carta", "💌", "La Carta de Agradecimiento", "linear-gradient(135deg,#ffd7a8,#ffb4c1)"),
makeTopic("receta", "🍓", "La Receta", "linear-gradient(135deg,#b7f5d3,#7ad6ff)"),
makeTopic("expositivo", "📘", "El Texto Expositivo", "linear-gradient(135deg,#d6d4ff,#c5b0ff)"),
makeTopic("comentario", "💬", "El Comentario", "linear-gradient(135deg,#ffd0e7,#ffc36b)"),
makeTopic("anuncio", "📻", "El Anuncio Radial", "linear-gradient(135deg,#b8f6ff,#ffe08a)"),
makeTopic("oda", "🎼", "La Oda", "linear-gradient(135deg,#ffe6a8,#d8c4ff)"),
  ];

  const ui = { role: "student", tab: "login", message: null, celebration: null };

  render();

  function render() {
    const session = read(KEYS.session, null);
    if (!session) {
      renderWelcome();
      bindWelcome();
      return;
    }
    if (session.role === "teacher") {
      renderTeacher(session.userId);
      bindTeacher();
      return;
    }
    renderStudent(session.userId);
    bindStudent();
  }

  function renderWelcome() {
    app.innerHTML = `
      <section class="app-shell app-shell-welcome">
        <article class="glass-card welcome-hero-card">
          <div class="welcome-brand welcome-brand-large">
            <div class="welcome-logo welcome-logo-large" aria-hidden="true">
              <div class="welcome-string"></div>
              <div class="welcome-yoyo"><div class="welcome-yoyo-core"></div></div>
            </div>
            <div class="welcome-copy">
              <p class="eyebrow-main">Plataforma educativa interactiva</p>
              <h1 class="welcome-title welcome-title-large">YOYO</h1>
              <p class="welcome-tagline welcome-tagline-large">Aprendo Jugando</p>
              <p class="welcome-subject welcome-subject-large">Lengua Espanola</p>
            </div>
          </div>
          <div class="subject-main">
            <p>Materia</p>
            <h2>LENGUA ESPANOLA</h2>
            <div class="muted-main">Esta es la version activa del sistema. Aqui se registra el docente y el estudiante entra con nombre completo, contrasena y codigo de clase.</div>
          </div>
        </article>

        <aside class="auth-card auth-card-welcome">
          <div class="welcome-center"><h2 class="welcome-question">Quien eres?</h2></div>
          <div class="role-row-main">
            <button class="role-btn-main ${ui.role === "student" ? "active" : ""}" data-live-role="student" type="button">Estudiante</button>
            <button class="role-btn-main ${ui.role === "teacher" ? "active" : ""}" data-live-role="teacher" type="button">Docente</button>
          </div>
          <div class="tab-row-main">
            <button class="tab-btn-main ${ui.tab === "login" ? "active" : ""}" data-live-tab="login" type="button">Iniciar sesion</button>
            <button class="tab-btn-main ${ui.tab === "register" ? "active" : ""}" data-live-tab="register" type="button">Crear cuenta</button>
          </div>
          ${ui.tab === "register" ? renderTeacherRegister() : renderLogin()}
          ${renderMessage()}
        </aside>
      </section>
    `;
  }

  function renderTeacherRegister() {
    return `
      <form class="form-main" id="liveTeacherRegister">
        <div class="login-help-main login-help-info">Solo el docente crea cuenta.</div>
        <label class="field-main">Nombre completo<input name="name" type="text" required></label>
        <label class="field-main">Correo electronico<input name="email" type="email" required></label>
        <label class="field-main">Contrasena<input name="password" type="password" required></label>
        <label class="field-main">Codigo de la escuela<input name="schoolCode" type="text" required></label>
        <button class="primary-btn-main" type="submit">Registrarse</button>
      </form>
    `;
  }

  function renderLogin() {
    if (ui.role === "teacher") {
      return `
        <form class="form-main" id="liveLoginForm">
          <label class="field-main">Correo electronico<input name="identity" type="email" required></label>
          <label class="field-main">Contrasena<input name="password" type="password" required></label>
          <button class="primary-btn-main" type="submit">Acceder</button>
        </form>
      `;
    }
    return `
      <form class="form-main" id="liveLoginForm">
        <label class="field-main">Nombre completo<input name="identity" type="text" placeholder="Tu nombre completo" required></label>
        <label class="field-main">Contrasena<input name="password" type="password" placeholder="Crea o escribe tu contrasena" required></label>
        <label class="field-main">Codigo de Clase<input name="classCode" type="text" placeholder="ej: ABC123" required></label>
        <div class="login-help-main">El codigo del docente te vincula automaticamente al panel de clase.</div>
        <button class="primary-btn-main" type="submit">Acceder</button>
      </form>
    `;
  }

  function renderTeacher(userId) {
    const teacher = teachers().find((item) => item.id === userId);
    if (!teacher) return logout();
    const roster = students().filter((item) => item.teacherId === teacher.id);
    app.innerHTML = `
      <section class="dashboard-shell">
        <article class="panel-card-main">
          <div class="topbar-main">
            <div>
              <p class="helper-main">Panel del docente</p>
              <h2 class="title-main">Hola, ${escapeHtml(teacher.name)}</h2>
            </div>
            <button class="logout-btn-main" id="liveLogout" type="button">Cerrar sesion</button>
          </div>
          <div class="row-flex">
            <span class="pill-main alt">Escuela: ${escapeHtml(teacher.schoolCode)}</span>
            <span class="pill-main">Clase: ${escapeHtml(teacher.classCode)}</span>
          </div>
          <div class="code-wrap">
            <div>
              <div class="helper-main">Codigo unico de clase</div>
              <p class="code-text-main" id="liveCode">${teacher.classCode}</p>
              <div class="helper-main">Tus estudiantes usan este codigo para entrar.</div>
            </div>
            <button class="copy-btn-main" id="liveCopyCode" type="button">Copiar codigo</button>
          </div>
          ${renderMessage()}
        </article>
        <aside class="side-stack">
          <section class="side-card">
            <p class="helper-main">Mis estudiantes</p>
            <h3 class="list-title-main">Estudiantes vinculados</h3>
            ${roster.length ? `<div class="student-list-main">${roster.map(renderRosterItem).join("")}</div>` : `<div class="empty-main">Todavia no hay estudiantes en esta clase.</div>`}
          </section>
        </aside>
      </section>
    `;
  }

  function renderRosterItem(student) {
    const summary = getStudentSummary(student.id);
    return `
      <article class="student-item-main">
        <div>
          <p class="student-name-main">${escapeHtml(student.name)}</p>
          <div class="student-email">Clase vinculada correctamente</div>
        </div>
        <span class="progress-main">${summary.total ? `${summary.total} pts` : "Temarios asignados"}</span>
      </article>
    `;
  }

  function renderStudent(userId) {
    const student = students().find((item) => item.id === userId);
    if (!student) return logout();
    const teacher = teachers().find((item) => item.id === student.teacherId);
    const state = getUiState(student.id);
    const activeTopicId = state.activeTopicId;
    const summary = getStudentSummary(student.id);
    const level = Math.max(1, Math.floor(summary.total / 100) + 1);
    const levelProgress = summary.total % 100;

    app.innerHTML = `
      <section class="student-shell">
        <article class="panel-card-main">
          <div class="topbar-main">
            <div>
              <div class="helper-main">Panel del estudiante</div>
              <h2 class="title-main">Hola, ${escapeHtml(student.name)}</h2>
            </div>
            <div class="row-flex">
              <button class="copy-btn-main" id="studentBack" type="button">Atras</button>
              <button class="logout-btn-main" id="liveLogout" type="button">Cerrar sesion</button>
            </div>
          </div>
          <div class="row-flex">
            <span class="pill-main alt">${teacher ? `Clase de ${escapeHtml(teacher.name)}` : "Clase activa"}</span>
            <span class="pill-main">C1</span>
            <span class="pill-main">C2</span>
            <span class="pill-main">C3</span>
          </div>
          <p class="muted-main">Ya estas unido automaticamente a la clase con codigo <strong>${escapeHtml(student.joinedClassCode)}</strong>.</p>
          <section class="game-hero-panel">
            <div>
              <p class="helper-main">Nivel actual</p>
              <h3 class="game-hero-title">Nivel ${level}</h3>
              <p class="muted-main">${motivationMessage(summary.total)}</p>
            </div>
            <div class="game-hero-stats">
              <span class="game-status-chip">Puntos: ${summary.total}</span>
              <span class="game-status-chip">Completados: ${summary.completed}/50</span>
            </div>
            <div class="progress-track-live">
              <div class="progress-fill-live" style="width:${levelProgress}%"></div>
            </div>
          </section>
          ${ui.celebration ? renderCelebration() : ""}
          ${activeTopicId ? renderTopicPlay(student.id, activeTopicId, state.activeActivityId) : renderTopicCards(student.id)}
        </article>
        <aside class="side-stack">
          <section class="side-card">
            <h3 class="list-title-main">Clase vinculada</h3>
            <div class="empty-main">Codigo activo: <strong>${escapeHtml(student.joinedClassCode)}</strong></div>
          </section>
          <section class="side-card">
            <div class="helper-main">Competencias</div>
            <h3 class="list-title-main">Progreso por competencias</h3>
            <div class="competency-chips">
              <span class="competency-chip">C1: ${summary.competencies.C1} pts</span>
              <span class="competency-chip">C2: ${summary.competencies.C2} pts</span>
              <span class="competency-chip">C3: ${summary.competencies.C3} pts</span>
            </div>
          </section>
        </aside>
      </section>
    `;
  }

  function renderTopicCards(studentId) {
    const summary = getStudentSummary(studentId);
    return `
      <div class="student-topic-grid">
        ${TOPICS.map((topic) => {
          const info = summary.byTopic[topic.id] || { done: 0, score: 0 };
          return `
            <button class="student-topic-card" data-topic-open="${topic.id}" style="background:${topic.color}" type="button">
              <span class="student-topic-icon">${topic.icon}</span>
              <h3>${topic.title}</h3>
              <p>${topic.summary}</p>
              <div class="student-topic-meta">
                <span class="student-topic-chip">10 juegos</span>
                <span class="student-topic-chip">${info.done}/10 completados</span>
                <span class="student-topic-chip">${info.score} pts</span>
              </div>
            </button>
          `;
        }).join("")}
      </div>
      <section class="summary-card">
        <h4>Progreso general</h4>
        <div class="competency-chips">
          <span class="competency-chip">C1: ${summary.competencies.C1} pts</span>
          <span class="competency-chip">C2: ${summary.competencies.C2} pts</span>
          <span class="competency-chip">C3: ${summary.competencies.C3} pts</span>
          <span class="competency-chip">Total: ${summary.total} pts</span>
        </div>
      </section>
    `;
  }

  function renderTopicPlay(studentId, topicId, activeActivityId) {
    const topic = TOPICS.find((item) => item.id === topicId) || TOPICS[0];
    const progress = getProgress()[studentId] || {};
    const activeActivity = topic.activities.find((item) => item.id === activeActivityId);
    if (activeActivity) {
      return renderSingleActivity(topic, activeActivity, progress[activeActivity.id]);
    }
    return `
      <section class="topic-stage">
        <div class="topic-stage-header">
          <div>
            <p class="helper-main">Temario activo</p>
            <h3 class="topic-stage-title">${topic.title}</h3>
            <p class="muted-main">Selecciona una actividad numerada. Cada una abre un mini-juego independiente.</p>
          </div>
          <button class="back-topic-button" data-topic-back="true" type="button">Volver a los 5 temarios</button>
        </div>
        <div class="topic-stage-grid topic-menu-grid">
          ${topic.activities.map((activity) => `
            <button class="game-card game-menu-card" data-activity-open="${activity.id}" type="button">
              <div class="game-card-head">
                <div>
                  <h4>${activity.index}. ${activity.title}</h4>
                  <p>${activity.prompt}</p>
                </div>
                <span class="game-points">10 pts</span>
              </div>
              <div class="competency-chips">
                ${activity.competencies.map((item) => `<span class="competency-chip">${item}</span>`).join("")}
              </div>
              <div class="game-card-footer">
                <span class="game-status-chip">${progress[activity.id]?.correct ? "Completado" : "Jugar ahora"}</span>
              </div>
            </button>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderSingleActivity(topic, activity, saved) {
    return `
      <section class="topic-stage">
        <div class="topic-stage-header">
          <div>
            <p class="helper-main">${topic.title}</p>
            <h3 class="topic-stage-title">${activity.index}. ${activity.title}</h3>
            <p class="muted-main">${activity.prompt}</p>
          </div>
          <div class="game-screen-actions">
            <button class="back-topic-button" data-activity-back="true" type="button">Volver al temario</button>
            <span class="game-points">10 pts</span>
          </div>
        </div>
        <div class="single-game-stage">
          ${renderGameCard(activity, saved)}
        </div>
      </section>
    `;
  }

  function renderGameCard(activity, saved) {
    return `
      <article class="game-card ${activity.type === "order" || activity.type === "timeline" ? "game-card-order" : ""}" data-game-id="${activity.id}" data-game-topic="${activity.topicId}" data-game-type="${activity.type}">
        <div class="game-card-head">
          <div>
            <h4>${activity.index}. ${activity.title}</h4>
            <p>${activity.prompt}</p>
          </div>
          <span class="game-points">10 pts</span>
        </div>
        <div class="competency-chips">
          ${activity.competencies.map((item) => `<span class="competency-chip">${item}</span>`).join("")}
        </div>
        ${renderGameBody(activity)}
        <div class="game-actions">
          <button class="verify-button" data-verify="${activity.id}" type="button">Verificar al instante</button>
          <span class="game-status-chip">${saved?.correct ? "Correcto" : saved ? "Reintentar" : "Pendiente"}</span>
        </div>
        ${saved ? `<div class="feedback-box ${saved.correct ? "success" : "error"}">${saved.message}</div>` : ""}
      </article>
    `;
  }

  function renderGameBody(activity) {
    if (activity.type === "choice" || activity.type === "target") {
      return `<div class="option-list">${activity.options.map((option, index) => `<button class="option-button" data-option="${index}" type="button">${option}</button>`).join("")}</div>`;
    }
    if (activity.type === "pair") {
      return `<div class="pair-list">${activity.left.map((label, index) => `
        <div class="pair-row" data-pair-row="${index}">
          <strong>${label}</strong>
          <div class="mini-option-grid">
            ${activity.right.map((option) => `<button class="option-button mini-option" data-pair-index="${index}" data-pair-value="${option}" type="button">${option}</button>`).join("")}
          </div>
        </div>
      `).join("")}</div>`;
    }
    if (activity.type === "classify") {
      return `<div class="classify-list">${activity.items.map((item, index) => `
        <div class="classify-row">
          <strong>${item.label}</strong>
          <div class="mini-option-grid">
            ${activity.groups.map((group) => `<button class="option-button mini-option" data-classify-index="${index}" data-classify-value="${group}" type="button">${group}</button>`).join("")}
          </div>
        </div>
      `).join("")}</div>`;
    }
    if (activity.type === "fill") {
      return `
        <div class="fill-list">
          <div class="fill-inline">
            <span>${activity.before}</span>
            <span class="fill-slot" data-fill-slot="0">______</span>
            <span>${activity.middle}</span>
            <span class="fill-slot" data-fill-slot="1">______</span>
            <span>${activity.after}</span>
          </div>
          <div class="mini-option-grid">
            ${shuffle([...activity.answers, ...activity.fillExtras]).map((word) => `<button class="option-button mini-option" data-fill-word="${word}" type="button">${word}</button>`).join("")}
          </div>
        </div>
      `;
    }
    if (activity.type === "order" || activity.type === "timeline") {
      return `
        <div class="drag-board-shell">
          <div class="drag-board-title">Arrastra las tarjetas hasta dejarlas en el orden correcto</div>
          <div class="${activity.type === "order" ? "order-list" : "timeline-list"} drag-list" data-order-board="true">
            ${activity.items.map((item, index) => `<div class="drag-card" draggable="true" data-drag-item="${item}"><span class="drag-number">${index + 1}</span><span>${item}</span></div>`).join("")}
          </div>
        </div>
      `;
    }
    if (activity.type === "multi" || activity.type === "wordhunt") {
      return `<div class="option-list">${activity.options.map((option, index) => `<button class="option-button" data-multi-index="${index}" type="button">${option}</button>`).join("")}</div>`;
    }
    if (activity.type === "cubes") {
      return `<div class="cube-grid">${activity.options.map((option, index) => `<button class="cube-button" data-multi-index="${index}" type="button" style="background:${option.color}">${option.label}</button>`).join("")}</div>`;
    }
    return "";
  }

  function bindWelcome() {
    document.querySelectorAll("[data-live-role]").forEach((button) => {
      button.addEventListener("click", () => {
        ui.role = button.dataset.liveRole;
        if (ui.role === "student" && ui.tab === "register") ui.tab = "login";
        ui.message = null;
        render();
      });
    });
    document.querySelectorAll("[data-live-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        ui.tab = button.dataset.liveTab;
        if (ui.tab === "register") ui.role = "teacher";
        ui.message = null;
        render();
      });
    });
    document.getElementById("liveTeacherRegister")?.addEventListener("submit", handleTeacherRegister);
    document.getElementById("liveLoginForm")?.addEventListener("submit", handleLogin);
  }

  function bindTeacher() {
    document.getElementById("liveLogout")?.addEventListener("click", logout);
    document.getElementById("liveCopyCode")?.addEventListener("click", async () => {
      const code = document.getElementById("liveCode")?.textContent?.trim() || "";
      await copyText(code);
      ui.message = { type: "success", text: `Codigo ${code} copiado correctamente.` };
      render();
    });
  }

  function bindStudent() {
    const session = read(KEYS.session, null);
    document.getElementById("liveLogout")?.addEventListener("click", logout);
    document.getElementById("studentBack")?.addEventListener("click", () => {
      const state = getUiState(session.userId);
      if (state.activeActivityId) {
        setUiState(session.userId, { activeActivityId: "" });
      } else if (state.activeTopicId) {
        setUiState(session.userId, { activeTopicId: "", activeActivityId: "" });
      } else if (window.history.length > 1) {
        window.history.back();
      }
      render();
    });
    document.querySelectorAll("[data-topic-open]").forEach((button) => {
      button.addEventListener("click", () => {
        setUiState(session.userId, { activeTopicId: button.dataset.topicOpen, activeActivityId: "" });
        render();
      });
    });
    document.querySelectorAll("[data-topic-back]").forEach((button) => {
      button.addEventListener("click", () => {
        setUiState(session.userId, { activeTopicId: "", activeActivityId: "" });
        render();
      });
    });
    document.querySelectorAll("[data-activity-open]").forEach((button) => {
      button.addEventListener("click", () => {
        setUiState(session.userId, { activeActivityId: button.dataset.activityOpen });
        render();
      });
    });
    document.querySelectorAll("[data-activity-back]").forEach((button) => {
      button.addEventListener("click", () => {
        setUiState(session.userId, { activeActivityId: "" });
        render();
      });
    });
    document.querySelectorAll("[data-option]").forEach((button) => {
      button.addEventListener("click", () => {
        button.parentElement.querySelectorAll("[data-option]").forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
      });
    });
    document.querySelectorAll("[data-multi-index]").forEach((button) => {
      button.addEventListener("click", () => {
        button.classList.toggle("selected");
      });
    });
    document.querySelectorAll("[data-pair-index]").forEach((button) => {
      button.addEventListener("click", () => {
        const row = button.closest("[data-pair-row]");
        row?.querySelectorAll("[data-pair-index]").forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
      });
    });
    document.querySelectorAll("[data-classify-index]").forEach((button) => {
      button.addEventListener("click", () => {
        const row = button.closest(".classify-row");
        row?.querySelectorAll("[data-classify-index]").forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
      });
    });
    document.querySelectorAll("[data-fill-word]").forEach((button) => {
      button.addEventListener("click", () => {
        const stage = button.closest(".fill-list");
        const emptySlot = stage?.querySelector('.fill-slot[data-value=""], .fill-slot:not([data-value])');
        if (!emptySlot) return;
        emptySlot.textContent = button.dataset.fillWord || "";
        emptySlot.dataset.value = button.dataset.fillWord || "";
        button.classList.add("selected");
        button.disabled = true;
      });
    });
    enableDragBoards();
    document.querySelectorAll("[data-verify]").forEach((button) => {
      button.addEventListener("click", () => {
        const card = button.closest("[data-game-id]");
        const topicId = card?.dataset.gameTopic || "";
        const gameId = card?.dataset.gameId || "";
        const game = findGame(topicId, gameId);
        const correct = game ? evaluateGame(card, game) : false;
        const progress = getProgress();
        progress[session.userId] = progress[session.userId] || {};
        progress[session.userId][gameId] = {
          topicId,
          score: correct ? 10 : 0,
          correct,
          message: correct ? `Excelente. ${game.success}` : `Aun no. ${game.error}`,
          competencies: findGame(topicId, gameId)?.competencies || [],
        };
        localStorage.setItem(KEYS.progress, JSON.stringify(progress));
        ui.celebration = correct
          ? { type: "success", title: celebrationTitle(), text: "Ganaste 10 puntos y una estrella brillante." }
          : { type: "error", title: "Sigue asi", text: "Prueba otra vez. Cada intento te hace mejor." };
        render();
      });
    });
  }

  function evaluateGame(card, game) {
    if (game.type === "choice" || game.type === "target") {
      const selected = card.querySelector(".option-button.selected");
      return selected ? selected.textContent.trim() === game.answer : false;
    }
    if (game.type === "pair") {
      const values = game.left.map((_, index) => card.querySelector(`[data-pair-index="${index}"].selected`)?.dataset.pairValue || "");
      return JSON.stringify(values) === JSON.stringify(game.matches);
    }
    if (game.type === "classify") {
      const values = game.items.map((_, index) => card.querySelector(`[data-classify-index="${index}"].selected`)?.dataset.classifyValue || "");
      return JSON.stringify(values) === JSON.stringify(game.items.map((item) => item.group));
    }
    if (game.type === "fill") {
      const values = game.answers.map((_, index) => normalize(card.querySelector(`[data-fill-slot="${index}"]`)?.dataset.value || ""));
      return JSON.stringify(values) === JSON.stringify(game.answers.map((item) => normalize(item)));
    }
    if (game.type === "order" || game.type === "timeline") {
      const positions = [...card.querySelectorAll("[data-drag-item]")].map((item) => item.dataset.dragItem);
      return JSON.stringify(positions) === JSON.stringify(game.correctOrder);
    }
    if (game.type === "multi" || game.type === "wordhunt") {
      const values = [...card.querySelectorAll("[data-multi-index].selected")].map((item) => item.textContent.trim()).sort();
      return JSON.stringify(values) === JSON.stringify([...game.answers].sort());
    }
    if (game.type === "cubes") {
      const values = [...card.querySelectorAll("[data-multi-index].selected")].map((item) => item.textContent.trim()).sort();
      return JSON.stringify(values) === JSON.stringify([...game.answers].sort());
    }
    return false;
  }

  function handleTeacherRegister(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = value(data, "name");
    const email = value(data, "email").toLowerCase();
    const password = value(data, "password");
    const schoolCode = value(data, "schoolCode").toUpperCase();
    if (!name || !email || !password || !schoolCode) {
      ui.message = { type: "error", text: "Completa todos los campos del docente." };
      render();
      return;
    }
    if (teachers().some((item) => item.email === email)) {
      ui.message = { type: "error", text: "Ya existe un docente con ese correo." };
      render();
      return;
    }
    const list = teachers();
    list.push({ id: createId("teacher"), name, email, password, schoolCode, classCode: createClassCode(list) });
    localStorage.setItem(KEYS.teachers, JSON.stringify(list));
    ui.role = "teacher";
    ui.tab = "login";
    ui.message = { type: "success", text: "Cuenta creada correctamente. Ahora inicia sesion." };
    render();
  }

  function handleLogin(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const identity = value(data, "identity");
    const password = value(data, "password");

    if (ui.role === "teacher") {
      const teacher = teachers().find((item) => item.email === identity.toLowerCase() && item.password === password);
      if (!teacher) {
        ui.message = { type: "error", text: "Credenciales incorrectas. Verifica tu correo y contrasena." };
        render();
        return;
      }
      saveSession({ role: "teacher", userId: teacher.id });
      ui.message = null;
      render();
      return;
    }

    const classCode = value(data, "classCode").toUpperCase();
    const teacher = teachers().find((item) => item.classCode === classCode);
    if (!teacher) {
      ui.message = { type: "error", text: "El codigo de clase no existe. Solicita el codigo correcto a tu docente." };
      render();
      return;
    }

    const name = normalize(identity);
    const list = students();
    let student = list.find((item) => item.teacherId === teacher.id && normalize(item.name) === name);

    if (!student) {
      student = { id: createId("student"), name: identity, password, teacherId: teacher.id, joinedClassCode: teacher.classCode };
      list.push(student);
    } else if (student.password !== password) {
      ui.message = { type: "error", text: "La contrasena no coincide con la registrada para este estudiante." };
      render();
      return;
    }

    student.joinedClassCode = teacher.classCode;
    localStorage.setItem(KEYS.students, JSON.stringify(list));
    saveSession({ role: "student", userId: student.id });
    ui.message = null;
    render();
  }

  function renderMessage() {
    return ui.message ? `<div class="message-main ${ui.message.type}">${escapeHtml(ui.message.text)}</div>` : "";
  }

  function teachers() { return read(KEYS.teachers, []); }
  function students() { return read(KEYS.students, []); }
  function saveSession(session) { localStorage.setItem(KEYS.session, JSON.stringify(session)); }
  function logout() { localStorage.removeItem(KEYS.session); ui.message = null; render(); }

  function read(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
  }
  function value(data, key) { return String(data.get(key) || "").trim(); }
  function normalize(text) { return String(text || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " "); }
  function createId(prefix) { return `${prefix}-${Math.random().toString(36).slice(2, 10)}`; }
  function createClassCode(list) {
    let code = "";
    do { code = Array.from({ length: 3 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join("") + Math.floor(100 + Math.random() * 900); }
    while (list.some((item) => item.classCode === code));
    return code;
  }
  function escapeHtml(text) { return String(text).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
  async function copyText(text) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const input = document.createElement("textarea");
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }

  function getUiState(studentId) {
    const all = read(KEYS.ui, {});
    return all[studentId] || { activeTopicId: "", activeActivityId: "" };
  }
  function setUiState(studentId, next) {
    const all = read(KEYS.ui, {});
    all[studentId] = { ...(all[studentId] || {}), ...next };
    localStorage.setItem(KEYS.ui, JSON.stringify(all));
  }
  function getProgress() { return read(KEYS.progress, {}); }

  function enableDragBoards() {
    let dragging = null;
    document.querySelectorAll("[data-drag-item]").forEach((item) => {
      item.addEventListener("dragstart", () => {
        dragging = item;
        item.classList.add("dragging");
      });
      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        dragging = null;
      });
      item.addEventListener("dragover", (event) => {
        event.preventDefault();
      });
      item.addEventListener("drop", (event) => {
        event.preventDefault();
        if (!dragging || dragging === item) return;
        const parent = item.parentElement;
        const nodes = [...parent.children];
        const draggingIndex = nodes.indexOf(dragging);
        const targetIndex = nodes.indexOf(item);
        if (draggingIndex < targetIndex) {
          parent.insertBefore(dragging, item.nextSibling);
        } else {
          parent.insertBefore(dragging, item);
        }
      });
    });
  }

  function getStudentSummary(studentId) {
    const progress = getProgress()[studentId] || {};
    const summary = { total: 0, completed: 0, competencies: { C1: 0, C2: 0, C3: 0 }, byTopic: {} };
    TOPICS.forEach((topic) => {
      summary.byTopic[topic.id] = { done: 0, score: 0 };
      topic.activities.forEach((activity) => {
        const saved = progress[activity.id];
        if (!saved) return;
        summary.total += saved.score;
        summary.byTopic[topic.id].score += saved.score;
        if (saved.correct) {
          summary.byTopic[topic.id].done += 1;
          summary.completed += 1;
        }
        activity.competencies.forEach((code) => {
          if (saved.correct) summary.competencies[code] += Math.round(saved.score / activity.competencies.length);
        });
      });
    });
    return summary;
  }

  function renderCelebration() {
    return `
      <section class="celebration-banner ${ui.celebration.type}">
        <div class="celebration-confetti" aria-hidden="true">
          <span>★</span><span>✦</span><span>●</span><span>★</span><span>✦</span>
        </div>
        <div>
          <h3>${ui.celebration.title}</h3>
          <p>${ui.celebration.text}</p>
        </div>
      </section>
    `;
  }

  function motivationMessage(total) {
    if (total >= 300) return "Eres un genio. Tus respuestas estan brillando.";
    if (total >= 150) return "Excelente. Sigue asi y desbloquea mas recompensas.";
    if (total >= 50) return "Muy bien. Ya comenzaste a ganar estrellas.";
    return "Listo para jugar? Cada reto te dara puntos y celebraciones.";
  }

  function celebrationTitle() {
    const messages = ["Excelente!", "Sigue asi!", "Eres un genio!", "Brillaste mucho!"];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  function findGame(topicId, gameId) {
    const topic = TOPICS.find((item) => item.id === topicId);
    return topic?.activities.find((item) => item.id === gameId) || null;
  }

  function makeTopic(id, icon, title, color) {
    const data = topicData(id, title);
    const activities = [
      {
        id: `${id}-game-1`,
        topicId: id,
        index: 1,
        type: "choice",
        title: "Cartas de colores",
        prompt: `Elige la opcion que mejor representa ${title}.`,
        competencies: ["C1"],
        answer: data.choiceCorrect,
        options: shuffle([data.choiceCorrect, ...data.choiceWrong]),
        success: "Identificaste la idea principal del temario.",
        error: "Observa mejor cual opcion comunica la idea correcta.",
      },
      {
        id: `${id}-game-2`,
        topicId: id,
        index: 2,
        type: "pair",
        title: "Aparear con imagen mental",
        prompt: "Relaciona cada parte con su ejemplo correcto.",
        competencies: ["C1", "C2"],
        left: data.pairs.map((item) => item[0]),
        right: shuffle(data.pairs.map((item) => item[1])),
        matches: data.pairs.map((item) => item[1]),
        success: "Apareaste las partes con pensamiento logico.",
        error: "Hay parejas que no coinciden todavia.",
      },
      {
        id: `${id}-game-3`,
        topicId: id,
        index: 3,
        type: "classify",
        title: "Clasifica y decide",
        prompt: "Lleva cada tarjeta a la categoria correcta.",
        competencies: ["C2", "C3"],
        groups: data.classifyGroups,
        items: data.classifyItems,
        success: "Clasificaste las tarjetas correctamente.",
        error: "Revisa la categoria correcta de cada tarjeta.",
      },
      {
        id: `${id}-game-4`,
        topicId: id,
        index: 4,
        type: "fill",
        title: "Completa el puente",
        prompt: "Llena los espacios para construir el mensaje completo.",
        competencies: ["C1"],
        before: data.fill.before,
        middle: data.fill.middle,
        after: data.fill.after,
        answers: data.fill.answers,
        fillExtras: data.fillExtras,
        success: "Completaste la frase con vocabulario adecuado.",
        error: "Faltan palabras correctas en los espacios.",
      },
      {
        id: `${id}-game-5`,
        topicId: id,
        index: 5,
        type: "order",
        title: "Coloca las partes",
        prompt: "Organiza las partes del temario en el orden correcto.",
        competencies: ["C2"],
        items: shuffle(data.order),
        correctOrder: data.order,
        success: "Organizaste la estructura correctamente.",
        error: "La secuencia aun no esta en orden.",
      },
      {
        id: `${id}-game-6`,
        topicId: id,
        index: 6,
        type: "cubes",
        title: "Cubos 3D de colores",
        prompt: "Selecciona los tres cubos que si pertenecen al temario.",
        competencies: ["C1", "C2", "C3"],
        options: data.cubes,
        answers: data.cubes.filter((item) => item.correct).map((item) => item.label),
        success: "Elegiste los cubos correctos con creatividad.",
        error: "Uno o mas cubos no corresponden al temario.",
      },
      {
        id: `${id}-game-7`,
        topicId: id,
        index: 7,
        type: "timeline",
        title: "Linea del tiempo",
        prompt: "Ubica los pasos en su linea temporal.",
        competencies: ["C2", "C3"],
        items: shuffle(data.timeline),
        correctOrder: data.timeline,
        success: "La linea del tiempo quedo perfecta.",
        error: "La secuencia temporal necesita ajuste.",
      },
      {
        id: `${id}-game-8`,
        topicId: id,
        index: 8,
        type: "target",
        title: "Apunta al blanco",
        prompt: data.target.prompt,
        competencies: ["C1", "C3"],
        answer: data.target.correct,
        options: shuffle(data.target.options),
        success: "Apuntaste a la respuesta correcta.",
        error: "Ese tiro no dio en el blanco correcto.",
      },
      {
        id: `${id}-game-9`,
        topicId: id,
        index: 9,
        type: "wordhunt",
        title: "Sopa de palabras",
        prompt: "Encuentra las tres palabras secretas del temario.",
        competencies: ["C1", "C2"],
        options: shuffle([...data.wordhunt.answers, ...data.wordhunt.distractors]),
        answers: data.wordhunt.answers,
        success: "Descubriste las palabras clave.",
        error: "Busca mejor las palabras relacionadas con el tema.",
      },
      {
        id: `${id}-game-10`,
        topicId: id,
        index: 10,
        type: "choice",
        title: "Salto final creativo",
        prompt: "Elige la mejor solucion final para este reto del temario.",
        competencies: ["C1", "C2", "C3"],
        answer: data.final.correct,
        options: shuffle(data.final.options),
        success: "Resolviste el reto final con creatividad.",
        error: "La mejor solucion combina logica, lenguaje y valores.",
      },
    ];
    return {
      id,
      icon,
      title,
      color,
      summary: `10 juegos interactivos, automaticos y creativos para ${title}.`,
      activities,
    };
  }

  function shuffle(items) {
    const clone = [...items];
    for (let i = clone.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [clone[i], clone[j]] = [clone[j], clone[i]];
    }
    return clone;
  }

  function topicData(id, title) {
    const map = {
      carta: {
        choiceCorrect: "Expresar gratitud con saludo, mensaje y despedida.",
        choiceWrong: ["Listar ingredientes de cocina.", "Narrar una carrera de autos."],
        pairs: [["Saludo", "Querida abuela:"], ["Motivo", "Gracias por cuidarme siempre."], ["Despedida", "Con amor,"], ["Firma", "Lucia"]],
        classifyGroups: ["Carta", "No carta"],
        classifyItems: [{ label: "Fecha", group: "Carta" }, { label: "Ingredientes", group: "No carta" }, { label: "Firma", group: "Carta" }, { label: "Titular", group: "No carta" }],
        fill: { before: "Escribo para", middle: " por tu", after: ".", answers: ["agradecerte", "ayuda"] },
        fillExtras: ["agradecerte", "ayuda", "receta", "planeta"],
        order: ["Fecha", "Saludo", "Mensaje", "Despedida", "Firma"],
        cubes: cubeSet(["SALUDO", "FIRMA", "GRATITUD"], ["RECETA", "RADIO", "PLANETA"]),
        timeline: ["Pienso en la persona", "Escribo el saludo", "Agradezco con detalles", "Cierro con afecto"],
        target: { prompt: "Apunta a la frase mas amable.", correct: "Gracias por explicarme con paciencia.", options: ["Gracias por explicarme con paciencia.", "No quiero escribir.", "Hazlo tu."] },
        wordhunt: { answers: ["gratitud", "saludo", "firma"], distractors: ["sarten", "radio", "cuento"] },
        final: { correct: "Escribir una carta clara, respetuosa y afectuosa.", options: ["Escribir una carta clara, respetuosa y afectuosa.", "Mezclar pasos sin orden.", "Gritar el mensaje."] },
      },
      receta: {
        choiceCorrect: "Organizar ingredientes y pasos para preparar algo.",
        choiceWrong: ["Escribir una despedida formal.", "Comentar una pelicula."],
        pairs: [["Titulo", "Jugo de frutas"], ["Ingredientes", "Banano y leche"], ["Paso", "Licua por un minuto"], ["Cierre", "Sirve frio"]],
        classifyGroups: ["Receta", "No receta"],
        classifyItems: [{ label: "Ingredientes", group: "Receta" }, { label: "Opinion", group: "No receta" }, { label: "Paso 1", group: "Receta" }, { label: "Firma", group: "No receta" }],
        fill: { before: "Primero debo", middle: " y luego", after: " todos los ingredientes.", answers: ["lavar", "mezclar"] },
        fillExtras: ["lavar", "mezclar", "gritar", "correr"],
        order: ["Reunir ingredientes", "Lavar", "Preparar", "Servir", "Limpiar"],
        cubes: cubeSet(["PASOS", "MEZCLAR", "INGREDIENTES"], ["OPINION", "FIRMA", "CARTA"]),
        timeline: ["Busco utensilios", "Organizo ingredientes", "Sigo pasos", "Sirvo el plato"],
        target: { prompt: "Apunta a la accion mas segura.", correct: "Lavar las manos antes de cocinar.", options: ["Lavar las manos antes de cocinar.", "Jugar con el fuego.", "Correr en la cocina."] },
        wordhunt: { answers: ["ingredientes", "pasos", "medidas"], distractors: ["despedida", "poema", "firma"] },
        final: { correct: "Seguir el orden y cuidar la higiene.", options: ["Seguir el orden y cuidar la higiene.", "Olvidar los ingredientes.", "Saltar todos los pasos."] },
      },
      expositivo: {
        choiceCorrect: "Informar con datos, subtitulos y explicaciones.",
        choiceWrong: ["Pedir perdon en una carta.", "Invitar a una fiesta radial."],
        pairs: [["Titulo", "Los planetas"], ["Subtitulo", "Caracteristicas"], ["Dato", "La Tierra gira alrededor del Sol"], ["Imagen", "Apoya la comprension"]],
        classifyGroups: ["Dato", "Opinion"],
        classifyItems: [{ label: "El agua hierve a 100 grados", group: "Dato" }, { label: "La ciencia es aburrida", group: "Opinion" }, { label: "La Luna refleja luz", group: "Dato" }, { label: "Los planetas son tristes", group: "Opinion" }],
        fill: { before: "Un texto expositivo presenta", middle: " y", after: " para informar.", answers: ["datos", "explicaciones"] },
        fillExtras: ["datos", "explicaciones", "saltos", "ingredientes"],
        order: ["Elegir tema", "Investigar", "Organizar ideas", "Escribir datos", "Revisar"],
        cubes: cubeSet(["DATOS", "SUBTITULO", "EXPLICAR"], ["FIRMA", "INGREDIENTE", "DESPEDIDA"]),
        timeline: ["Busco informacion", "Selecciono datos", "Explico el tema", "Comparto resultados"],
        target: { prompt: "Apunta al dato comprobable.", correct: "La Tierra gira alrededor del Sol.", options: ["La Tierra gira alrededor del Sol.", "El Sol esta triste.", "Los oceanos hablan."] },
        wordhunt: { answers: ["dato", "explicacion", "subtitulo"], distractors: ["firma", "azucar", "despedida"] },
        final: { correct: "Explicar con claridad usando informacion real.", options: ["Explicar con claridad usando informacion real.", "Escribir sin datos.", "Inventar sin revisar."] },
      },
      comentario: {
        choiceCorrect: "Opinar con respeto y dar razones claras.",
        choiceWrong: ["Listar ingredientes.", "Escribir un anuncio de radio."],
        pairs: [["Opinion", "Me gusto el final"], ["Razon", "Porque el personaje cambio"], ["Respeto", "Escucho a mis companeros"], ["Cierre", "Lo recomiendo"]],
        classifyGroups: ["Respetuoso", "Irrespetuoso"],
        classifyItems: [{ label: "Entiendo tu idea, pero pienso distinto", group: "Respetuoso" }, { label: "Tu opinion no vale", group: "Irrespetuoso" }, { label: "Buen punto, agregaria un ejemplo", group: "Respetuoso" }, { label: "Eso es tonto", group: "Irrespetuoso" }],
        fill: { before: "Mi comentario debe ser", middle: " y", after: " para dialogar mejor.", answers: ["claro", "respetuoso"] },
        fillExtras: ["claro", "respetuoso", "duro", "desordenado"],
        order: ["Presento mi opinion", "Explico razones", "Doy ejemplo", "Cierro con respeto"],
        cubes: cubeSet(["OPINION", "RAZON", "RESPETO"], ["SARTEN", "RADIO", "FIRMA"]),
        timeline: ["Leo el texto", "Pienso mi postura", "Escribo razones", "Comparto con respeto"],
        target: { prompt: "Apunta al mejor comentario.", correct: "Me gusto porque el personaje resolvio el problema con respeto.", options: ["Me gusto porque el personaje resolvio el problema con respeto.", "No sirve.", "Da igual todo."] },
        wordhunt: { answers: ["opinion", "argumento", "respeto"], distractors: ["ingrediente", "despedida", "subtitulo"] },
        final: { correct: "Opinar con respeto, razones y ejemplos.", options: ["Opinar con respeto, razones y ejemplos.", "Criticar sin explicar.", "Hablar sin escuchar."] },
      },
      anuncio: {
        choiceCorrect: "Invitar e informar con energia y claridad.",
        choiceWrong: ["Despedirse de una carta.", "Explicar una receta paso a paso."],
        pairs: [["Apertura", "Atencion comunidad escolar"], ["Mensaje", "Habra feria de lectura"], ["Invitacion", "Te esperamos manana"], ["Cierre", "No faltes"]],
        classifyGroups: ["Anuncio", "No anuncio"],
        classifyItems: [{ label: "Invitacion final", group: "Anuncio" }, { label: "Ingredientes", group: "No anuncio" }, { label: "Datos del evento", group: "Anuncio" }, { label: "Firma personal", group: "No anuncio" }],
        fill: { before: "Un anuncio radial debe", middle: " y", after: " al publico.", answers: ["informar", "motivar"] },
        fillExtras: ["informar", "motivar", "callar", "ocultar"],
        order: ["Llamar la atencion", "Decir el mensaje", "Dar datos", "Invitar", "Cerrar"],
        cubes: cubeSet(["VOZ", "MENSAJE", "INVITACION"], ["FIRMA", "RECETA", "POEMA"]),
        timeline: ["Pienso el publico", "Redacto el mensaje", "Practico la voz", "Presento el anuncio"],
        target: { prompt: "Apunta al mejor anuncio.", correct: "Ven a la jornada de reciclaje este jueves a las 10.", options: ["Ven a la jornada de reciclaje este jueves a las 10.", "No vengas.", "No recuerdo la hora."] },
        wordhunt: { answers: ["mensaje", "voz", "invitacion"], distractors: ["despedida", "ingrediente", "subtitulo"] },
        final: { correct: "Comunicar con entusiasmo y datos claros.", options: ["Comunicar con entusiasmo y datos claros.", "Hablar sin objetivo.", "Olvidar el publico."] },
      },
    };
    return map[id];
  }

  function cubeSet(correct, wrong) {
    const colors = [
      "linear-gradient(135deg,#7b36eb,#a756f7)",
      "linear-gradient(135deg,#1f70ff,#49b5ff)",
      "linear-gradient(135deg,#ff9b54,#ffbe3d)",
      "linear-gradient(135deg,#33c48d,#7de2b8)",
      "linear-gradient(135deg,#ff758c,#ff9ab1)",
      "linear-gradient(135deg,#6a89cc,#b8c6ff)",
    ];
    return shuffle([
      ...correct.map((label, index) => ({ label, correct: true, color: colors[index % colors.length] })),
      ...wrong.map((label, index) => ({ label, correct: false, color: colors[(index + 3) % colors.length] })),
    ]);
  }
})();
