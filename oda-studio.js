(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const TARGET_GAME = "oda-10";
  const SESSION_KEY = "yoyo_rg_x";
  const PROGRESS_KEY = "yoyo_rg_p";

  const THEMES = ["Mamá", "Papá", "Abuelo o Abuela", "Mascota", "Bicicleta", "Juguete", "Flor", "Comida Favorita", "Objeto Especial", "Otro"];
  const CLOUD = {
    qualities: ["Hermoso", "Dulce", "Brillante", "Tierno", "Alegre", "Valiente", "Tranquilo", "Especial"],
    emotions: ["Amor", "Alegría", "Ternura", "Paz", "Gratitud", "Admiración", "Nostalgia"],
    comparisons: ["Como el viento", "Como una estrella", "Como el sol", "Como una flor", "Como una canción", "Como un abrazo"],
    poetic: ["Iluminas mi camino", "Alegras mi corazón", "Llenas mi vida de color", "Guardas mis recuerdos", "Eres luz en mis días", "Vives en mi alma"]
  };
  const MINIMUMS = { qualities: 3, emotions: 2, comparisons: 1, poetic: 1 };

  let observerBound = false;
  const RECORDINGS = {};
  let mediaRecorder = null;
  let mediaChunks = [];
  let currentStream = null;

  function renameActivityCard() {
    app.querySelectorAll(`[data-oa="${TARGET_GAME}"]`).forEach((button) => {
      const heading = button.querySelector("h4");
      const copy = button.querySelector("p");
      if (heading && heading.textContent !== "10. Crea Tu Oda Con Palabras Mágicas") {
        heading.textContent = "10. Crea Tu Oda Con Palabras Mágicas";
      }
      if (copy && copy.textContent !== "Elige un tema, usa una nube de palabras y crea tu oda final.") {
        copy.textContent = "Elige un tema, usa una nube de palabras y crea tu oda final.";
      }
    });
  }

  function clearLegacyFeedback(card) {
    card.querySelectorAll(".radial-feedback").forEach((node) => node.remove());
  }

  function getSessionId() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      return session && session.id ? session.id : "guest";
    } catch {
      return "guest";
    }
  }

  function totalScore(state) {
    return state.scores.theme + state.scores.cloud + state.scores.draft + (state.recordingReady ? 15 : 0);
  }

  function persistProgress(state) {
    try {
      const studentId = getSessionId();
      if (!studentId) return;
      const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
      progress[studentId] = progress[studentId] || {};
      progress[studentId][TARGET_GAME] = {
        ok: state.finished,
        score: Math.max(1, Math.min(10, Math.round(totalScore(state) / 17))),
        c: ["C1", "C2", "C3"],
        msg: "Elegiste palabras, construiste y presentaste una oda final.",
        topicId: "oda"
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {}
  }

  function baseState() {
    return {
      phase: 0,
      theme: "",
      selected: {
        qualities: [],
        emotions: [],
        comparisons: [],
        poetic: []
      },
      draft: "",
      draftChecked: false,
      recording: false,
      recordingReady: false,
      finished: false,
      scores: {
        theme: 0,
        cloud: 0,
        draft: 0
      },
      feedback: {
        type: "",
        title: "Comienza Tu Oda",
        text: "Primero elige el tema de tu oda."
      }
    };
  }

  function mount() {
    renameActivityCard();
    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    if (!card || card.dataset.oda10MagicReady === "1") return;
    card.dataset.oda10MagicReady = "1";

    const title = card.querySelector(".play-top h3");
    const text = card.querySelector(".play-top .muted-main");
    const board = card.querySelector(".game-board");
    const actionRow = card.querySelector(".action-row");
    if (!board || !actionRow) return;

    if (title && title.textContent !== "10. Crea Tu Oda Con Palabras Mágicas") {
      title.textContent = "10. Crea Tu Oda Con Palabras Mágicas";
    }
    if (text && text.textContent !== "Elige palabras, crea tu borrador y graba tu oda final.") {
      text.textContent = "Elige palabras, crea tu borrador y graba tu oda final.";
    }

    clearLegacyFeedback(card);
    card._oda10State = baseState();
    render(card, board, actionRow);
  }

  function render(card, board, actionRow) {
    clearLegacyFeedback(card);
    const state = card._oda10State || baseState();
    card._oda10State = state;

    if (state.finished) {
      renderFinal(card, board, actionRow, state);
      return;
    }

    board.innerHTML = `
      <section class="radial-studio-app oda-studio-app">
        <div class="radial-fill-topbar">
          <article class="radial-fill-stat">
            <div class="radial-kicker">Nivel</div>
            <strong>${state.phase === 0 ? "Nivel 1" : state.phase === 1 ? "Nivel 2" : "Nivel 3"}</strong>
            <span>${state.phase === 0 ? "Elige Tu Tema" : state.phase === 1 ? "Nube de Palabras" : "Crea y Graba"}</span>
          </article>
          <article class="radial-fill-stat">
            <div class="radial-kicker">Puntaje</div>
            <strong>${totalScore(state)}</strong>
            <span>avance creativo</span>
          </article>
          <article class="radial-fill-stat">
            <div class="radial-kicker">Meta</div>
            <strong>${state.phase === 0 ? "1 Tema" : state.phase === 1 ? "7 Palabras" : "1 Oda Final"}</strong>
            <span>${state.recordingReady ? "Audio listo" : "Trabajo poético"}</span>
          </article>
        </div>

        <section class="radial-fill-help">
          <div>
            <div class="radial-kicker">Como jugar</div>
            <p>${state.phase === 0 ? "Elige a quién o qué dedicarás tu oda." : state.phase === 1 ? "Selecciona palabras de la nube para construir tus ideas poéticas." : "Crea tu oda, edítala y luego grábala si tu navegador lo permite."}</p>
          </div>
          <div class="instruction-chip">⭐ 📖 🎤 💖 ☁️</div>
        </section>

        ${state.phase === 0 ? renderTheme(state) : state.phase === 1 ? renderCloud(state) : renderCreate(state)}

        <section class="radial-fill-feedback ${state.feedback.type || ""}">
          <div class="radial-kicker">Retroalimentación</div>
          <strong>${state.feedback.title}</strong>
          <p>${state.feedback.text}</p>
        </section>
      </section>`;

    actionRow.innerHTML = state.phase === 0
      ? `<button class="real-ghost" type="button" data-oda10-reset="theme">Reintentar</button><button class="real-action" type="button" data-oda10-check="theme">Verificar</button><button class="real-action ${state.scores.theme > 0 ? "" : "radial-disabled"}" type="button" data-oda10-next="theme" ${state.scores.theme > 0 ? "" : "disabled"}>Siguiente nivel</button>`
      : state.phase === 1
        ? `<button class="real-ghost" type="button" data-oda10-reset="cloud">Reintentar</button><button class="real-action" type="button" data-oda10-check="cloud">Verificar</button><button class="real-action ${state.scores.cloud > 0 ? "" : "radial-disabled"}" type="button" data-oda10-next="cloud" ${state.scores.cloud > 0 ? "" : "disabled"}>Siguiente nivel</button>`
        : `<button class="real-ghost" type="button" data-oda10-reset="create">Limpiar</button><button class="real-action" type="button" data-oda10-check="create">Verificar</button><button class="real-action ${state.draftChecked ? "" : "radial-disabled"}" type="button" data-oda10-next="create" ${state.draftChecked ? "" : "disabled"}>Finalizar juego</button>`;

    bind(card, board, actionRow);
  }

  function renderTheme(state) {
    return `
      <section class="studio-case-card">
        <div class="studio-case-head">
          <div class="instruction-chip">Nivel 1: Elige Tu Tema</div>
          <span class="status-badge">💖 Tema de la Oda</span>
        </div>
        <div class="studio-type-grid">
          ${THEMES.map((theme) => `
            <button class="studio-type-card ${state.theme === theme ? "selected" : ""}" type="button" data-oda10-theme="${theme}">
              <strong>${theme}</strong>
            </button>`).join("")}
        </div>
      </section>`;
  }

  function renderCloud(state) {
    return `
      <section class="studio-case-card">
        <div class="studio-case-head">
          <div class="instruction-chip">Nivel 2: Nube de Palabras</div>
          <span class="status-badge">☁️ Palabras Mágicas</span>
        </div>

        <div class="studio-cloud-counters">
          <article class="studio-counter-card ${state.selected.qualities.length >= MINIMUMS.qualities ? "done" : ""}"><strong>Cualidades</strong><span>${state.selected.qualities.length}/${MINIMUMS.qualities}</span></article>
          <article class="studio-counter-card ${state.selected.emotions.length >= MINIMUMS.emotions ? "done" : ""}"><strong>Emociones</strong><span>${state.selected.emotions.length}/${MINIMUMS.emotions}</span></article>
          <article class="studio-counter-card ${state.selected.comparisons.length >= MINIMUMS.comparisons ? "done" : ""}"><strong>Comparación</strong><span>${state.selected.comparisons.length}/${MINIMUMS.comparisons}</span></article>
          <article class="studio-counter-card ${state.selected.poetic.length >= MINIMUMS.poetic ? "done" : ""}"><strong>Frase Poética</strong><span>${state.selected.poetic.length}/${MINIMUMS.poetic}</span></article>
        </div>

        ${renderCloudGroup("Cualidades", "qualities", CLOUD.qualities, state)}
        ${renderCloudGroup("Emociones", "emotions", CLOUD.emotions, state)}
        ${renderCloudGroup("Comparaciónes", "comparisons", CLOUD.comparisons, state)}
        ${renderCloudGroup("Frases Poéticas", "poetic", CLOUD.poetic, state)}
      </section>`;
  }

  function renderCloudGroup(label, key, list, state) {
    return `
      <article class="studio-cloud-group">
        <div class="slot-label">${label}</div>
        <div class="studio-cloud-chips">
          ${list.map((word) => `
            <button class="studio-cloud-chip ${state.selected[key].includes(word) ? "selected" : ""}" type="button" data-oda10-cloud="${key}" data-oda10-value="${escapeHtml(word)}">
              ${word}
            </button>`).join("")}
        </div>
      </article>`;
  }

  function renderCreate(state) {
    const canRecord = Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
    const recording = RECORDINGS[getSessionId()] || {};
    const draft = state.draft || buildDraft(state);

    return `
      <section class="studio-case-card">
        <div class="studio-case-head">
          <div class="instruction-chip">Nivel 3: Crea y Graba tu oda</div>
          <span class="status-badge">🎤 Oda Final</span>
        </div>

        <div class="studio-record-actions">
          <button class="real-action" type="button" data-oda10-build="1">Crear Mi Oda</button>
          <button class="real-ghost" type="button" data-oda10-edit="1">Editar</button>
          <button class="real-ghost" type="button" data-oda10-clear-draft="1">Limpiar</button>
        </div>

        <label class="studio-field-card">
          <span class="slot-label">Borrador editable</span>
          <textarea data-oda10-draft="1" rows="9">${escapeHtml(draft)}</textarea>
        </label>

        <section class="studio-record-panel">
          <div>
            <div class="radial-kicker">Grabacion</div>
            <p>${canRecord ? "Graba tu oda cuando el borrador esté listo." : "Tu navegador no permite grabar audio. Puedes recitar tu oda frente a la maestra."}</p>
          </div>
          <div class="studio-record-status ${state.recording ? "active" : recording.url ? "ready" : ""}">
            <span class="studio-record-dot"></span>
            <span>${state.recording ? "Grabando oda" : recording.url ? "Grabación lista" : "Sin grabación"}</span>
            ${state.recording ? '<span class="studio-sound-wave"><i></i><i></i><i></i><i></i></span>' : ''}
          </div>
          <div class="studio-record-actions">
            <button class="real-action" type="button" data-oda10-record="1" ${canRecord && !state.recording ? "" : "disabled"}>Grabar</button>
            <button class="real-ghost" type="button" data-oda10-stop="1" ${state.recording ? "" : "disabled"}>Detener</button>
            <button class="real-ghost" type="button" data-oda10-play="1" ${recording.url && !state.recording ? "" : "disabled"}>Escuchar Mi Grabación</button>
            <button class="real-ghost" type="button" data-oda10-rerecord="1" ${recording.url && !state.recording ? "" : "disabled"}>Volver a Grabar</button>
          </div>
          <audio class="studio-audio-player" controls ${recording.url ? "" : "hidden"} src="${recording.url || ""}"></audio>
        </section>
      </section>`;
  }

  function renderFinal(card, board, actionRow, state) {
    const score = totalScore(state);
    const result = score >= 90 ? "Excelente" : score >= 70 ? "Aprobado" : "Necesita mejorar";
    board.innerHTML = `
      <section class="radial-final-screen oda-final-screen studio-final-screen">
        <div class="radial-kicker">Actividad completada</div>
        <h3>Terminaste Crea Tu Oda Con Palabras Mágicas</h3>
        <p>Puntuacion total: <strong>${score}</strong></p>
        <p><strong>${result}</strong></p>
        <p>Ya elegiste palabras, escribiste tu oda y preparaste tu presentación final.</p>
      </section>`;

    actionRow.innerHTML = `<button class="real-action" type="button" data-oda10-replay="1">Volver a jugar</button>`;
    actionRow.querySelector("[data-oda10-replay]")?.addEventListener("click", () => {
      clearRecording();
      card._oda10State = baseState();
      render(card, card.querySelector(".game-board"), actionRow);
    });
  }

  function bind(card, board, actionRow) {
    const state = card._oda10State;
    if (state.phase === 0) bindTheme(card, board, actionRow, state);
    if (state.phase === 1) bindCloud(card, board, actionRow, state);
    if (state.phase === 2) bindCreate(card, board, actionRow, state);
  }

  function bindTheme(card, board, actionRow, state) {
    board.querySelectorAll("[data-oda10-theme]").forEach((button) => {
      button.addEventListener("click", () => {
        state.theme = button.dataset.oda10Theme;
        state.feedback = { type: "", title: "Tema Elegido", text: `Tu oda estará dedicada a ${state.theme}.` };
        render(card, card.querySelector(".game-board"), actionRow);
      });
    });

    actionRow.querySelector('[data-oda10-reset="theme"]')?.addEventListener("click", () => {
      state.theme = "";
      state.scores.theme = 0;
      state.feedback = { type: "", title: "Tema Reiniciado", text: "Elige otra vez a quién o qué dedicarás tu oda." };
      render(card, card.querySelector(".game-board"), actionRow);
    });

    actionRow.querySelector('[data-oda10-check="theme"]')?.addEventListener("click", () => {
      if (!state.theme.trim()) {
        state.feedback = { type: "error", title: "Falta elegir un tema", text: "Debes elegir a quién o qué dedicarás tu oda." };
        render(card, card.querySelector(".game-board"), actionRow);
        return;
      }
      state.scores.theme = 10;
      state.feedback = { type: "success", title: "Tema Confirmado", text: "Muy bien. Ya puedes pasar a la nube de palabras." };
      persistProgress(state);
      render(card, card.querySelector(".game-board"), actionRow);
    });

    actionRow.querySelector('[data-oda10-next="theme"]')?.addEventListener("click", () => {
      if (!state.scores.theme) return;
      state.phase = 1;
      state.feedback = { type: "", title: "Siguiente nivel", text: "Ahora elige palabras mágicas para construir tu oda." };
      render(card, card.querySelector(".game-board"), actionRow);
    });
  }

  function bindCloud(card, board, actionRow, state) {
    board.querySelectorAll("[data-oda10-cloud]").forEach((button) => {
      button.addEventListener("click", () => {
        const group = button.dataset.oda10Cloud;
        const value = button.dataset.oda10Value;
        const list = state.selected[group];
        if (list.includes(value)) {
          state.selected[group] = list.filter((item) => item !== value);
        } else {
          state.selected[group] = [...list, value];
        }
        render(card, card.querySelector(".game-board"), actionRow);
      });
    });

    actionRow.querySelector('[data-oda10-reset="cloud"]')?.addEventListener("click", () => {
      state.selected = { qualities: [], emotions: [], comparisons: [], poetic: [] };
      state.scores.cloud = 0;
      state.feedback = { type: "", title: "Nube Reiniciada", text: "Vuelve a elegir palabras para tu oda." };
      render(card, card.querySelector(".game-board"), actionRow);
    });

    actionRow.querySelector('[data-oda10-check="cloud"]')?.addEventListener("click", () => {
      const qOk = state.selected.qualities.length >= MINIMUMS.qualities;
      const eOk = state.selected.emotions.length >= MINIMUMS.emotions;
      const cOk = state.selected.comparisons.length >= MINIMUMS.comparisons;
      const pOk = state.selected.poetic.length >= MINIMUMS.poetic;

      if (!(qOk && eOk && cOk && pOk)) {
        state.feedback = { type: "error", title: "Faltan palabras", text: "Completa las cantidades mínimas de cualidades, emociones, comparación y frase poética." };
        render(card, card.querySelector(".game-board"), actionRow);
        return;
      }

      let score = 0;
      score += 15;
      score += 15;
      score += 15;
      score += 15;
      state.scores.cloud = score;
      state.feedback = { type: "success", title: "Nube Completada", text: "Excelente. Ya tienes suficientes palabras para crear tu oda." };
      persistProgress(state);
      render(card, card.querySelector(".game-board"), actionRow);
    });

    actionRow.querySelector('[data-oda10-next="cloud"]')?.addEventListener("click", () => {
      if (!state.scores.cloud) return;
      state.phase = 2;
      state.feedback = { type: "", title: "Ultimo nivel", text: "Ahora crea tu oda con las palabras que elegiste." };
      render(card, card.querySelector(".game-board"), actionRow);
    });
  }

  function bindCreate(card, board, actionRow, state) {
    board.querySelector("[data-oda10-build]")?.addEventListener("click", () => {
      state.draft = buildDraft(state);
      state.feedback = { type: "", title: "Oda creada", text: "Ya tienes un borrador editable. Puedes mejorarlo antes de verificar." };
      render(card, card.querySelector(".game-board"), actionRow);
    });

    board.querySelector("[data-oda10-edit]")?.addEventListener("click", () => {
      state.feedback = { type: "", title: "Edición activa", text: "Puedes cambiar palabras, agregar versos o mejorar tu cierre." };
      render(card, card.querySelector(".game-board"), actionRow);
    });

    board.querySelector("[data-oda10-clear-draft]")?.addEventListener("click", () => {
      state.draft = "";
      state.draftChecked = false;
      state.scores.draft = 0;
      state.feedback = { type: "", title: "Borrador limpiado", text: "Puedes crear tu oda otra vez con nuevas ideas." };
      render(card, card.querySelector(".game-board"), actionRow);
    });

    board.querySelector("[data-oda10-draft]")?.addEventListener("input", (event) => {
      state.draft = event.target.value;
    });

    board.querySelector("[data-oda10-record]")?.addEventListener("click", async () => {
      await startRecording(state, card, actionRow);
    });

    board.querySelector("[data-oda10-stop]")?.addEventListener("click", () => {
      stopRecording();
    });

    board.querySelector("[data-oda10-play]")?.addEventListener("click", () => {
      board.querySelector(".studio-audio-player")?.play();
    });

    board.querySelector("[data-oda10-rerecord]")?.addEventListener("click", () => {
      clearRecording();
      state.recordingReady = false;
      state.feedback = { type: "", title: "Grabación borrada", text: "Puedes grabar tu oda nuevamente." };
      render(card, card.querySelector(".game-board"), actionRow);
    });

    actionRow.querySelector('[data-oda10-reset="create"]')?.addEventListener("click", () => {
      clearRecording();
      state.draft = "";
      state.draftChecked = false;
      state.recordingReady = false;
      state.scores.draft = 0;
      state.feedback = { type: "", title: "Creación reiniciada", text: "Vuelve a escribir tu oda con la nube de palabras." };
      render(card, card.querySelector(".game-board"), actionRow);
    });

    actionRow.querySelector('[data-oda10-check="create"]')?.addEventListener("click", () => {
      const text = (state.draft || buildDraft(state)).trim();
      state.draft = text;
      let score = 0;
      if (text.length >= 60) score += 15;
      if (text.toLowerCase().includes("como")) score += 15;
      if (text.toLowerCase().includes("admiro") || text.toLowerCase().includes("corazon") || text.toLowerCase().includes("amor")) score += 15;
      state.scores.draft = score;
      state.draftChecked = true;
      state.feedback = score >= 30
        ? { type: "success", title: "Oda revisada", text: "Tu oda ya expresa admiracion y tiene una base poetica buena." }
        : { type: "error", title: "Faltan detalles", text: "Mejora tu borrador con comparaciones, emociones y un cierre más emotivo." };
      persistProgress(state);
      render(card, card.querySelector(".game-board"), actionRow);
    });

    actionRow.querySelector('[data-oda10-next="create"]')?.addEventListener("click", () => {
      if (!state.draftChecked) return;
      state.finished = true;
      persistProgress(state);
      render(card, card.querySelector(".game-board"), actionRow);
    });
  }

  function buildDraft(state) {
    const q = state.selected.qualities;
    const e = state.selected.emotions;
    const c = state.selected.comparisons[0] || "como ______";
    const p = state.selected.poetic[0] || "iluminas mi camino";
    return `Oh ${state.theme || "________"} querido/a,\neres ${q[0] || "________"}, ${q[1] || "________"} y ${q[2] || "________"}.\nMe llenas de ${e[0] || "________"} y ${e[1] || "________"}.\nBrillas ${c}.\nTu ${p}.\nPor eso te admiro\ny te llevo en mi corazon.`;
  }

  function escapeHtml(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function startRecording(state, card, actionRow) {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      state.feedback = { type: "error", title: "Sin grabación", text: "Tu navegador no permite grabar audio. Puedes recitar tu oda frente a la maestra." };
      render(card, card.querySelector(".game-board"), actionRow);
      return;
    }

    try {
      currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaChunks = [];
      mediaRecorder = new MediaRecorder(currentStream);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) mediaChunks.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(mediaChunks, { type: mediaRecorder.mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        RECORDINGS[getSessionId()] = { blob, url };
        state.recording = false;
        state.recordingReady = true;
        state.feedback = { type: "success", title: "Grabación lista", text: "Ya puedes escuchar tu oda grabada." };
        if (currentStream) {
          currentStream.getTracks().forEach((track) => track.stop());
          currentStream = null;
        }
        render(card, card.querySelector(".game-board"), actionRow);
      };
      mediaRecorder.start();
      state.recording = true;
      state.feedback = { type: "", title: "Grabando", text: "Recita tu oda con voz clara y emocion." };
      render(card, card.querySelector(".game-board"), actionRow);
    } catch {
      state.feedback = { type: "error", title: "No se pudo grabar", text: "Permite el uso del micrófono o recita tu oda frente a la maestra." };
      render(card, card.querySelector(".game-board"), actionRow);
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  }

  function clearRecording() {
    const entry = RECORDINGS[getSessionId()];
    if (entry?.url) URL.revokeObjectURL(entry.url);
    delete RECORDINGS[getSessionId()];
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
      currentStream = null;
    }
    mediaRecorder = null;
    mediaChunks = [];
  }

  if (!observerBound) {
    const observer = new MutationObserver(() => mount());
    observer.observe(app, { childList: true, subtree: true });
    observerBound = true;
  }

  mount();
  requestAnimationFrame(mount);
  setTimeout(mount, 80);
})();

