(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const TARGET_GAME = "anuncio-3";
  const SESSION_KEY = "yoyo_rg_x";
  const PROGRESS_KEY = "yoyo_rg_p";
  const STATE_KEY = "yoyo_radial_classify_state";

  const ZONES = [
    {
      key: "imperativa",
      title: "Verde: Oraciones imperativas",
      short: "Imperativas",
      tone: "#22c55e",
      soft: "linear-gradient(180deg,#ecfdf5,#dcfce7)",
    },
    {
      key: "interrogativa",
      title: "Azul: Oraciones interrogativas",
      short: "Interrogativas",
      tone: "#3b82f6",
      soft: "linear-gradient(180deg,#eff6ff,#dbeafe)",
    },
    {
      key: "informativa",
      title: "Amarillo: Oraciones informativas",
      short: "Informativas",
      tone: "#f59e0b",
      soft: "linear-gradient(180deg,#fff7ed,#fef3c7)",
    },
  ];

  const LEVELS = [
    {
      title: "Nivel 1",
      subtitle: "Frases simples",
      hint:
        "Las interrogativas preguntan, las imperativas invitan a actuar y las informativas explican beneficios.",
      phrases: [
        { text: "\u00BFQuieres cuidar tu salud?", zone: "interrogativa" },
        { text: "Compra ahora este producto.", zone: "imperativa" },
        { text: "Este jugo contiene vitaminas.", zone: "informativa" },
        { text: "Aprovecha esta oferta.", zone: "imperativa" },
        { text: "\u00BFTe gusta lo natural?", zone: "interrogativa" },
        { text: "Tiene beneficios para tu cuerpo.", zone: "informativa" },
        { text: "\u00BFQuieres sentirte mejor cada d\u00EDa?", zone: "interrogativa" },
        { text: "Ll\u00E9valo hoy a tu casa.", zone: "imperativa" },
        { text: "Este producto aporta energ\u00EDa natural.", zone: "informativa" },
        { text: "\u00BFBuscas una bebida refrescante?", zone: "interrogativa" },
        { text: "Prueba su sabor desde hoy.", zone: "imperativa" },
        { text: "Su contenido ayuda a hidratar tu cuerpo.", zone: "informativa" },
      ],
    },
    {
      title: "Nivel 2",
      subtitle: "Frases elaboradas",
      hint:
        "Piensa en la intenci\u00F3n: preguntar, ordenar o informar dentro del anuncio.",
      phrases: [
        { text: "\u00BFBuscas una opci\u00F3n saludable para tu familia?", zone: "interrogativa" },
        { text: "Prueba nuestro jab\u00F3n antibacterial.", zone: "imperativa" },
        { text: "Elimina bacterias y protege tu piel.", zone: "informativa" },
        { text: "\u00A1No pierdas esta oportunidad!", zone: "imperativa" },
        { text: "\u00BFSab\u00EDas que puedes prevenir enfermedades?", zone: "interrogativa" },
        { text: "Este producto cuida tu bienestar.", zone: "informativa" },
        { text: "\u00BFTe interesa una limpieza m\u00E1s segura?", zone: "interrogativa" },
        { text: "\u00DAsalo hoy y cuida a tu familia.", zone: "imperativa" },
        { text: "Su f\u00F3rmula act\u00FAa de manera r\u00E1pida y eficaz.", zone: "informativa" },
        { text: "\u00BFQuieres ropa limpia por m\u00E1s tiempo?", zone: "interrogativa" },
        { text: "Compru\u00E9balo ahora en tu hogar.", zone: "imperativa" },
        { text: "Su espuma ayuda a remover manchas dif\u00EDciles.", zone: "informativa" },
      ],
    },
    {
      title: "Nivel 3",
      subtitle: "Inter\u00E9s social",
      hint:
        "En los anuncios sociales tambi\u00E9n se pregunta, se invita a actuar y se informa sobre consecuencias.",
      phrases: [
        { text: "\u00BFTe preocupa el dengue?", zone: "interrogativa" },
        { text: "Elimina el agua acumulada.", zone: "imperativa" },
        { text: "As\u00ED evitas criaderos de mosquitos.", zone: "informativa" },
        { text: "\u00A1Act\u00FAa hoy por tu comunidad!", zone: "imperativa" },
        { text: "\u00BFSabes c\u00F3mo prevenir la chikungunya?", zone: "interrogativa" },
        { text: "Esta acci\u00F3n protege a tu familia.", zone: "informativa" },
        { text: "\u00BFYa revisaste tu patio esta semana?", zone: "interrogativa" },
        { text: "Limpia tu entorno y tapa los recipientes.", zone: "imperativa" },
        { text: "La prevenci\u00F3n reduce el riesgo de enfermedad.", zone: "informativa" },
        { text: "\u00BFHay agua estancada cerca de tu casa?", zone: "interrogativa" },
        { text: "Vac\u00EDa y lava los envases del patio.", zone: "imperativa" },
        { text: "Tu comunidad est\u00E1 m\u00E1s segura cuando todos colaboran.", zone: "informativa" },
      ],
    },
    {
      title: "Nivel 4",
      subtitle: "Pensar mejor",
      hint:
        "Busca el tono de cada frase: si pregunta, invita a actuar o brinda informaci\u00F3n.",
      phrases: [
        { text: "\u00BFQuieres un futuro m\u00E1s saludable?", zone: "interrogativa" },
        { text: "Cuida tu hogar y elimina los criaderos.", zone: "imperativa" },
        { text: "La prevenci\u00F3n comienza en casa.", zone: "informativa" },
        { text: "Aprovecha esta campa\u00F1a comunitaria.", zone: "imperativa" },
        { text: "\u00BFYa revisaste tu patio hoy?", zone: "interrogativa" },
        { text: "Esta medida reduce el riesgo de enfermedad.", zone: "informativa" },
        { text: "\u00BFTe gustar\u00EDa proteger mejor a tu comunidad?", zone: "interrogativa" },
        { text: "Act\u00FAa con responsabilidad y revisa tu entorno.", zone: "imperativa" },
        { text: "Una acci\u00F3n oportuna evita nuevos focos de contagio.", zone: "informativa" },
        { text: "\u00BFSabes qu\u00E9 hacer para evitar enfermedades?", zone: "interrogativa" },
        { text: "Participa hoy en la jornada de limpieza.", zone: "imperativa" },
        { text: "Cada patio limpio reduce el peligro para la comunidad.", zone: "informativa" },
      ],
    },
  ];

  let draggedPhrase = null;
  let audioContext = null;

  function getStudentId() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      return session?.role === "student" ? session.id : "guest";
    } catch {
      return "guest";
    }
  }

  function createState() {
    return {
      levelIndex: 0,
      attempts: {},
      scores: {},
      stars: {},
      startedAt: Date.now(),
      placements: {},
      feedback: null,
      finished: false,
    };
  }

  function ensureLevelState(state) {
    const level = LEVELS[state.levelIndex];
    state.placements[state.levelIndex] = state.placements[state.levelIndex] || {};
    level.phrases.forEach((phrase) => {
      if (typeof state.placements[state.levelIndex][phrase.text] !== "string") {
        state.placements[state.levelIndex][phrase.text] = "";
      }
    });
  }

  function loadState() {
    const studentId = getStudentId();
    try {
      const all = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
      return all[studentId] || createState();
    } catch {
      return createState();
    }
  }

  function saveState(state) {
    const studentId = getStudentId();
    const all = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
    all[studentId] = state;
    localStorage.setItem(STATE_KEY, JSON.stringify(all));
  }

  function totalScore(state) {
    return Object.values(state.scores).reduce((sum, value) => sum + value, 0);
  }

  function totalStars(state) {
    return Object.values(state.stars).reduce((sum, value) => sum + value, 0);
  }

  function mount() {
    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    if (!card || card.dataset.radialClassifyReady === "1") return;
    card.dataset.radialClassifyReady = "1";

    const board = card.querySelector(".game-board");
    const actionRow = card.querySelector(".action-row");
    if (!board || !actionRow) return;

    const state = loadState();
    ensureLevelState(state);
    saveState(state);
    render(card, board, actionRow, state);
  }

  function render(card, board, actionRow, state) {
    if (state.finished) {
      renderFinal(board, actionRow, state);
      return;
    }

    const level = LEVELS[state.levelIndex];
    const placements = state.placements[state.levelIndex];
    const reviewed = (state.attempts[state.levelIndex] || 0) > 0;

    board.innerHTML = `
      <section class="radial-classify-app">
        <div class="radial-fill-topbar">
          <article class="radial-fill-stat">
            <div class="radial-kicker">Nivel</div>
            <strong>${level.title}</strong>
            <span>${level.subtitle}</span>
          </article>
          <article class="radial-fill-stat">
            <div class="radial-kicker">Puntos acumulados</div>
            <strong>${totalScore(state)}</strong>
            <span>${"\u2605".repeat(Math.max(1, totalStars(state) || 1))}</span>
          </article>
          <article class="radial-fill-stat">
            <div class="radial-kicker">Meta</div>
            <strong>Clasifica</strong>
            <span>por color y funci\u00F3n</span>
          </article>
        </div>

        <section class="radial-fill-help">
          <div>
            <div class="radial-kicker">C\u00F3mo jugar</div>
            <p>Lee cada frase del anuncio radial y arr\u00E1strala a la categor\u00EDa de color correcta: interrogativa, imperativa o informativa.</p>
          </div>
          <button class="real-ghost" type="button" data-classify-repeat="1">Repetir instrucciones</button>
        </section>

        <section class="radial-classify-stage">
          <div class="instruction-chip">Clasifica por colores las frases del anuncio radial</div>
          <div class="radial-classify-zones">
            ${ZONES.map((zone) => `
              <article class="zone radial-classify-zone" data-classify-zone="${zone.key}" style="--zone-tone:${zone.tone};--zone-soft:${zone.soft};">
                <h4>${zone.title}</h4>
                <div class="zone-items">
                  ${level.phrases
                    .filter((phrase) => placements[phrase.text] === zone.key)
                    .map((phrase) => renderToken(phrase.text))
                    .join("")}
                </div>
              </article>
            `).join("")}
          </div>
          <div class="classify-bank radial-classify-bank" data-classify-bank="1">
            ${level.phrases
              .filter((phrase) => !placements[phrase.text])
              .map((phrase) => renderToken(phrase.text))
              .join("")}
          </div>
        </section>

        <section class="radial-fill-feedback ${state.feedback?.type || ""}">
          <div class="radial-kicker">Retroalimentaci\u00F3n</div>
          <strong>${state.feedback?.title || "Clasifica cada frase seg\u00FAn su funci\u00F3n dentro del anuncio radial."}</strong>
          <p>${state.feedback?.text || "Recuerda: las interrogativas preguntan, las imperativas invitan a actuar y las informativas presentan datos o beneficios."}</p>
        </section>

        <details class="radial-teacher-panel">
          <summary>Panel docente</summary>
          <div class="radial-teacher-grid">
            <article>
              <h4>Objetivo pedag\u00F3gico</h4>
              <p>Clasificar frases del anuncio radial seg\u00FAn su funci\u00F3n e intenci\u00F3n comunicativa.</p>
            </article>
            <article>
              <h4>Contenido trabajado</h4>
              <p>Oraciones interrogativas, imperativas e informativas dentro del anuncio radial.</p>
            </article>
            <article>
              <h4>Competencias</h4>
              <p>Comprensi\u00F3n lectora, lenguaje persuasivo, gram\u00E1tica en contexto y pensamiento l\u00F3gico.</p>
            </article>
            <article>
              <h4>Uso en clase</h4>
              <p>Ideal para analizar anuncios antes de crear uno propio o practicar funci\u00F3n comunicativa.</p>
            </article>
          </div>
        </details>
      </section>
    `;

    actionRow.innerHTML = `
      <button class="real-ghost" type="button" data-classify-retry="1">Reintentar</button>
      <button class="real-action" type="button" data-classify-check="1">Verificar</button>
      <button class="real-action ${reviewed ? "" : "radial-disabled"}" type="button" data-classify-next="1" ${reviewed ? "" : "disabled"}>Siguiente nivel</button>
    `;

    bindBoard(board, actionRow, state);
    bindActions(board, actionRow, state);
  }

  function renderToken(text) {
    return `<button class="zone-token radial-classify-token" draggable="true" data-classify-token="${escapeHtml(text)}" type="button">${text}</button>`;
  }

  function bindBoard(board, actionRow, state) {
    board.querySelectorAll("[data-classify-token]").forEach((token) => {
      token.addEventListener("dragstart", () => {
        draggedPhrase = token.dataset.classifyToken;
        token.classList.add("dragging");
        playTone("drag");
      });
      token.addEventListener("dragend", () => {
        token.classList.remove("dragging");
        draggedPhrase = null;
      });
    });

    board.querySelectorAll("[data-classify-zone]").forEach((zone) => {
      zone.addEventListener("dragover", (event) => event.preventDefault());
      zone.addEventListener("drop", (event) => {
        event.preventDefault();
        if (!draggedPhrase) return;
        state.placements[state.levelIndex][draggedPhrase] = zone.dataset.classifyZone;
        state.feedback = {
          type: "",
          title: "Frase ubicada",
          text: "Sigue clasificando hasta completar todas las frases.",
        };
        saveState(state);
        playTone("drop");
        render(board.closest(".play-card"), board, actionRow, state);
      });
    });

    board.querySelector("[data-classify-bank]")?.addEventListener("dragover", (event) => event.preventDefault());
    board.querySelector("[data-classify-bank]")?.addEventListener("drop", (event) => {
      event.preventDefault();
      if (!draggedPhrase) return;
      state.placements[state.levelIndex][draggedPhrase] = "";
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });
  }

  function bindActions(board, actionRow, state) {
    board.querySelector("[data-classify-repeat]")?.addEventListener("click", () => {
      state.feedback = {
        type: "",
        title: "Instrucciones repetidas",
        text: "Arrastra cada frase a su color correcto seg\u00FAn si pregunta, invita a actuar o informa.",
      };
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });

    actionRow.querySelector("[data-classify-retry]")?.addEventListener("click", () => {
      const level = LEVELS[state.levelIndex];
      state.placements[state.levelIndex] = {};
      level.phrases.forEach((phrase) => {
        state.placements[state.levelIndex][phrase.text] = "";
      });
      state.feedback = {
        type: "",
        title: "Puedes reintentar",
        text: "Vuelve a leer con calma cada frase y piensa en su funci\u00F3n dentro del anuncio.",
      };
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });

    actionRow.querySelector("[data-classify-check]")?.addEventListener("click", () => {
      const level = LEVELS[state.levelIndex];
      state.attempts[state.levelIndex] = (state.attempts[state.levelIndex] || 0) + 1;
      const elapsed = Math.round((Date.now() - state.startedAt) / 1000);
      const correctCount = level.phrases.reduce(
        (sum, phrase) => sum + (state.placements[state.levelIndex][phrase.text] === phrase.zone ? 1 : 0),
        0
      );
      const ok = correctCount === level.phrases.length;

      if (ok) {
        const firstTry = state.attempts[state.levelIndex] === 1;
        const base = firstTry ? 10 : 5;
        const bonus = elapsed <= 40 ? 5 : 0;
        const score = base + bonus;
        const stars = firstTry && bonus ? 3 : firstTry ? 2 : 1;
        state.scores[state.levelIndex] = score;
        state.stars[state.levelIndex] = stars;
        state.feedback = {
          type: "success",
          title: "Clasificaci\u00F3n correcta",
          text: `Muy bien. Ganaste ${score} puntos y ${stars} estrella${stars > 1 ? "s" : ""}.`,
        };
        playTone("success");
        if (state.levelIndex === LEVELS.length - 1) {
          state.finished = true;
          persistPlatformSuccess();
          playTone("victory");
        }
      } else {
        state.feedback = {
          type: "error",
          title: "Revisa algunas frases",
          text: `Clasificaste correctamente ${correctCount} de ${level.phrases.length} frases. ${level.hint}`,
        };
        playTone("error");
      }

      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });

    actionRow.querySelector("[data-classify-next]")?.addEventListener("click", () => {
      if ((state.attempts[state.levelIndex] || 0) === 0) return;
      if (state.levelIndex === LEVELS.length - 1) {
        state.finished = true;
      } else {
        state.levelIndex += 1;
        state.startedAt = Date.now();
        ensureLevelState(state);
        state.feedback = {
          type: "",
          title: `Ahora vas a ${LEVELS[state.levelIndex].title}`,
          text: "Lee las nuevas frases y clasif\u00EDcalas nuevamente por color y funci\u00F3n.",
        };
      }
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });
  }

  function renderFinal(board, actionRow, state) {
    const points = totalScore(state);
    const stars = totalStars(state);
    board.innerHTML = `
      <section class="radial-final-screen">
        <div class="radial-kicker">Juego completado</div>
        <h3>Terminaste Clasifica por colores</h3>
        <p>Puntuaci\u00F3n total: <strong>${points}</strong></p>
        <p>Estrellas acumuladas: <strong>${"\u2605".repeat(Math.max(1, stars))}</strong></p>
        <p>${points >= 45 ? "Excelente. Ya reconoces la funci\u00F3n de las frases en un anuncio radial." : "Buen trabajo. Sigue practicando la funci\u00F3n de cada oraci\u00F3n dentro del anuncio radial."}</p>
      </section>
    `;

    actionRow.innerHTML = `
      <button class="real-action" type="button" data-classify-replay="1">Volver a jugar</button>
      <button class="real-ghost" type="button" data-classify-close="1">Listo</button>
    `;

    actionRow.querySelector("[data-classify-replay]")?.addEventListener("click", () => {
      const next = createState();
      ensureLevelState(next);
      saveState(next);
      mountReset();
    });
    actionRow.querySelector("[data-classify-close]")?.addEventListener("click", () => location.reload());
  }

  function mountReset() {
    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    const board = card?.querySelector(".game-board");
    const actionRow = card?.querySelector(".action-row");
    if (!card || !board || !actionRow) return;
    render(card, board, actionRow, loadState());
  }

  function persistPlatformSuccess() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      if (!session?.id) return;
      const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
      progress[session.id] = progress[session.id] || {};
      progress[session.id][TARGET_GAME] = {
        ok: true,
        score: 10,
        c: ["C1", "C2", "C3"],
        msg: "Clasificaste frases del anuncio radial por funci\u00F3n e intenci\u00F3n comunicativa.",
        topicId: "anuncio",
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {}
  }

  function playTone(type) {
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      const now = audioContext.currentTime;
      const presets = {
        drag: [320, 0.03],
        drop: [430, 0.04],
        success: [620, 0.09],
        error: [220, 0.07],
        victory: [760, 0.16],
      };
      const [frequency, duration] = presets[type] || presets.drop;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch {}
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  const observer = new MutationObserver(() => mount());
  observer.observe(app, { childList: true, subtree: true });
  mount();
})();
