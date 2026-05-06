(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const TARGET_GAME = "anuncio-6";
  const SESSION_KEY = "yoyo_rg_x";
  const PROGRESS_KEY = "yoyo_rg_p";
  const STATE_KEY = "yoyo_radial_cubes_state";

  const LEVELS = [
    {
      title: "Nivel 1",
      subtitle: "Producto saludable",
      prompt: "Forma el anuncio radial poniendo cada cubo en el orden correcto: llamada, presentación, argumentación y cierre.",
      cubes: [
        "¿Quieres cuidar tu salud?",
        "Nuestro jugo natural es delicioso.",
        "Contiene vitaminas que fortalecen tu cuerpo.",
        "¡Compra ahora y siéntete mejor!",
      ],
      correct: [
        "¿Quieres cuidar tu salud?",
        "Nuestro jugo natural es delicioso.",
        "Contiene vitaminas que fortalecen tu cuerpo.",
        "¡Compra ahora y siéntete mejor!",
      ],
    },
    {
      title: "Nivel 2",
      subtitle: "Detergente",
      prompt: "Ordena las frases para construir un anuncio de producto con coherencia y lenguaje persuasivo.",
      cubes: [
        "¿Te gustaría tener ropa más limpia?",
        "Usa nuestro detergente Súper Limpio.",
        "Elimina manchas difíciles y cuida tus manos.",
        "¡Aprovecha esta oferta hoy!",
      ],
      correct: [
        "¿Te gustaría tener ropa más limpia?",
        "Usa nuestro detergente Súper Limpio.",
        "Elimina manchas difíciles y cuida tus manos.",
        "¡Aprovecha esta oferta hoy!",
      ],
    },
    {
      title: "Nivel 3",
      subtitle: "Interés social",
      prompt: "Construye un anuncio social siguiendo la estructura correcta del mensaje radial.",
      cubes: [
        "¿Te preocupa el dengue?",
        "Elimina el agua acumulada en tu hogar.",
        "Así evitas criaderos de mosquitos y proteges a tu familia.",
        "¡Actúa hoy por tu comunidad!",
      ],
      correct: [
        "¿Te preocupa el dengue?",
        "Elimina el agua acumulada en tu hogar.",
        "Así evitas criaderos de mosquitos y proteges a tu familia.",
        "¡Actúa hoy por tu comunidad!",
      ],
    },
    {
      title: "Nivel 4",
      subtitle: "Anuncio escolar",
      prompt: "Ordena las frases para lograr un anuncio escolar claro, persuasivo y bien organizado.",
      cubes: [
        "¿Quieres una escuela más limpia?",
        "Deposita la basura en su lugar.",
        "Un ambiente limpio nos ayuda a aprender mejor.",
        "¡Haz tu parte desde hoy!",
      ],
      correct: [
        "¿Quieres una escuela más limpia?",
        "Deposita la basura en su lugar.",
        "Un ambiente limpio nos ayuda a aprender mejor.",
        "¡Haz tu parte desde hoy!",
      ],
    },
    {
      title: "Nivel 5",
      subtitle: "Reto experto",
      prompt: "Elige solo los cubos correctos y ordénalos para formar el anuncio. Hay cubos distractores.",
      cubes: [
        "¿Buscas una merienda saludable?",
        "Prueba nuestra galleta de avena.",
        "Es nutritiva, rica y te da energía.",
        "¡Pruébala hoy!",
        "La silla está cerca de la mesa.",
        "El cuaderno es azul.",
        "Mañana es martes.",
      ],
      correct: [
        "¿Buscas una merienda saludable?",
        "Prueba nuestra galleta de avena.",
        "Es nutritiva, rica y te da energía.",
        "¡Pruébala hoy!",
      ],
    },
  ];

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
      selected: {},
      attempts: {},
      hintUsed: {},
      scores: {},
      stars: {},
      feedback: null,
      finished: false,
      cubes: {},
    };
  }

  function buildLevelCubes(levelIndex) {
    return shuffle(LEVELS[levelIndex].cubes).map((text, index) => ({
      id: `${levelIndex}-${index}`,
      text,
    }));
  }

  function ensureState(state) {
    const levelIndex = state.levelIndex;
    state.selected[levelIndex] = state.selected[levelIndex] || [];
    state.attempts[levelIndex] = state.attempts[levelIndex] || 0;
    state.hintUsed[levelIndex] = Boolean(state.hintUsed[levelIndex]);
    state.scores[levelIndex] = state.scores[levelIndex] || 0;
    state.cubes[levelIndex] = state.cubes[levelIndex] || buildLevelCubes(levelIndex);
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
    renameActivityCard();

    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    if (!card || card.dataset.radialCubesReady === "1") return;
    card.dataset.radialCubesReady = "1";

    const title = card.querySelector(".play-top h3");
    const text = card.querySelector(".play-top .muted-main");
    if (title && title.textContent !== "6. Cubos 3D") title.textContent = "6. Cubos 3D";
    if (text && text.textContent !== "Construye un anuncio radial ordenando cubos con frases.") {
      text.textContent = "Construye un anuncio radial ordenando cubos con frases.";
    }

    const board = card.querySelector(".game-board");
    const actionRow = card.querySelector(".action-row");
    if (!board || !actionRow) return;

    const state = loadState();
    ensureState(state);
    saveState(state);
    render(card, board, actionRow, state);
  }

  function renameActivityCard() {
    app.querySelectorAll(`[data-oa="${TARGET_GAME}"]`).forEach((button) => {
      const heading = button.querySelector("h4");
      const copy = button.querySelector("p");
      if (heading && heading.textContent !== "6. Cubos 3D") heading.textContent = "6. Cubos 3D";
      if (copy && copy.textContent !== "Ordena cubos con frases para formar anuncios radiales completos.") {
        copy.textContent = "Ordena cubos con frases para formar anuncios radiales completos.";
      }
    });
  }

  function render(card, board, actionRow, state) {
    if (state.finished) {
      renderFinal(board, actionRow, state);
      return;
    }

    ensureState(state);
    const level = LEVELS[state.levelIndex];
    const selected = state.selected[state.levelIndex];
    const selectedIds = new Set(selected.map((item) => item.id));
    const cubes = state.cubes[state.levelIndex];
    const canVerify = selected.length === 4;
    const reviewed = state.attempts[state.levelIndex] > 0;

    board.innerHTML = `
      <section class="radial-cubes-app">
        <div class="radial-fill-topbar">
          <article class="radial-fill-stat">
            <div class="radial-kicker">Nivel</div>
            <strong>${level.title}</strong>
            <span>${level.subtitle}</span>
          </article>
          <article class="radial-fill-stat">
            <div class="radial-kicker">Puntuación acumulada</div>
            <strong>${totalScore(state)}</strong>
            <span>${"★".repeat(Math.max(1, totalStars(state) || 1))}</span>
          </article>
          <article class="radial-fill-stat">
            <div class="radial-kicker">Intento</div>
            <strong>${state.attempts[state.levelIndex] + 1}</strong>
            <span>${state.hintUsed[state.levelIndex] ? "con pista" : "sin pista"}</span>
          </article>
        </div>

        <section class="radial-fill-help">
          <div>
            <div class="radial-kicker">Cómo jugar</div>
            <p>${level.prompt}</p>
          </div>
          <div class="radial-cubes-help-actions">
            <button class="real-ghost" type="button" data-cubes-repeat="1">Repetir instrucciones</button>
            <button class="real-ghost" type="button" data-cubes-hint="1">Pista</button>
          </div>
        </section>

        <section class="radial-cubes-stage">
          <div class="instruction-chip">Estructura: llamada, presentación, argumentación y cierre</div>

          <div class="radial-cubes-slots">
            ${[0, 1, 2, 3]
              .map((slotIndex) => {
                const item = selected[slotIndex];
                const labels = ["1. Llamada", "2. Presentación", "3. Argumentación", "4. Cierre"];
                return `
                  <button class="radial-cubes-slot ${item ? "filled" : ""}" data-cubes-slot="${slotIndex}" type="button">
                    <span class="slot-label">${labels[slotIndex]}</span>
                    <span class="slot-value">${item ? escapeHtml(item.text) : "Selecciona un cubo"}</span>
                  </button>
                `;
              })
              .join("")}
          </div>

          <div class="radial-cubes-bank">
            ${cubes
              .map((cube, index) => `
                <button
                  class="radial-cube-card ${selectedIds.has(cube.id) ? "placed" : ""} tone-${index % 5}"
                  data-cubes-id="${cube.id}"
                  type="button"
                  ${selectedIds.has(cube.id) ? "disabled" : ""}
                >
                  <span class="cube-face cube-top"></span>
                  <span class="cube-face cube-front">${escapeHtml(cube.text)}</span>
                </button>
              `)
              .join("")}
          </div>
        </section>

        <section class="radial-fill-feedback ${state.feedback?.type || ""}">
          <div class="radial-kicker">Retroalimentación</div>
          <strong>${state.feedback?.title || "Forma un anuncio radial completo con frases coherentes."}</strong>
          <p>${state.feedback?.text || "Empieza por la llamada, sigue con la presentación, luego el argumento y termina con un cierre persuasivo."}</p>
        </section>

        <details class="radial-teacher-panel">
          <summary>Panel docente</summary>
          <div class="radial-teacher-grid">
            <article>
              <h4>Objetivo</h4>
              <p>Construir anuncios radiales ordenando frases según su estructura.</p>
            </article>
            <article>
              <h4>Competencias trabajadas</h4>
              <p>Comunicativa, pensamiento lógico, creativo y crítico, ética y ciudadana.</p>
            </article>
            <article>
              <h4>Gramática integrada</h4>
              <p>Interrogativas como llamada, informativas como presentación y argumentación, imperativas como cierre.</p>
            </article>
            <article>
              <h4>Uso</h4>
              <p>Ideal para practicar coherencia, estructura y lenguaje persuasivo en anuncios de producto y de interés social.</p>
            </article>
          </div>
        </details>
      </section>
    `;

    actionRow.innerHTML = `
      <button class="real-ghost" type="button" data-cubes-reset="1">Reintentar</button>
      <button class="real-action" type="button" data-cubes-check="1" ${canVerify ? "" : "disabled"}>Verificar</button>
      <button class="real-action ${reviewed ? "" : "radial-disabled"}" type="button" data-cubes-next="1" ${reviewed ? "" : "disabled"}>Siguiente nivel</button>
    `;

    bindBoard(board, actionRow, state);
    bindActions(board, actionRow, state);
  }

  function bindBoard(board, actionRow, state) {
    board.querySelectorAll("[data-cubes-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const cubeId = button.dataset.cubesId;
        const cube = state.cubes[state.levelIndex].find((item) => item.id === cubeId);
        if (!cube) return;
        if (state.selected[state.levelIndex].length >= 4) return;
        state.selected[state.levelIndex] = [...state.selected[state.levelIndex], cube];
        state.feedback = {
          type: "",
          title: "Cubo colocado",
          text: "Sigue organizando las frases hasta completar el anuncio radial.",
        };
        playTone("move");
        saveState(state);
        render(board.closest(".play-card"), board, actionRow, state);
      });
    });

    board.querySelectorAll("[data-cubes-slot]").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.cubesSlot);
        if (!Number.isInteger(index)) return;
        if (!state.selected[state.levelIndex][index]) return;
        const next = [...state.selected[state.levelIndex]];
        next.splice(index, 1);
        state.selected[state.levelIndex] = next;
        state.feedback = {
          type: "",
          title: "Cubo retirado",
          text: "Puedes cambiar el orden hasta que el anuncio quede coherente.",
        };
        playTone("move");
        saveState(state);
        render(board.closest(".play-card"), board, actionRow, state);
      });
    });
  }

  function bindActions(board, actionRow, state) {
    board.querySelector("[data-cubes-repeat]")?.addEventListener("click", () => {
      state.feedback = {
        type: "",
        title: "Instrucciones repetidas",
        text: LEVELS[state.levelIndex].prompt,
      };
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });

    board.querySelector("[data-cubes-hint]")?.addEventListener("click", () => {
      state.hintUsed[state.levelIndex] = true;
      state.feedback = {
        type: "",
        title: "Pista del nivel",
        text: "La llamada suele ser una pregunta, el cierre suele invitar a actuar y el argumento explica el beneficio.",
      };
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });

    actionRow.querySelector("[data-cubes-reset]")?.addEventListener("click", () => {
      resetLevel(state, state.levelIndex);
      state.feedback = {
        type: "",
        title: "Nivel reiniciado",
        text: "Vuelve a ordenar los cubos y prueba otra combinación más coherente.",
      };
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });

    actionRow.querySelector("[data-cubes-check]")?.addEventListener("click", () => {
      const level = LEVELS[state.levelIndex];
      const chosen = state.selected[state.levelIndex].map((item) => item.text);
      state.attempts[state.levelIndex] += 1;
      const ok = JSON.stringify(chosen) === JSON.stringify(level.correct);

      if (ok) {
        const firstTry = state.attempts[state.levelIndex] === 1;
        const base = firstTry ? 10 : 5;
        const bonus = state.hintUsed[state.levelIndex] ? 0 : 5;
        const score = base + bonus;
        const stars = firstTry && !state.hintUsed[state.levelIndex] ? 3 : firstTry || !state.hintUsed[state.levelIndex] ? 2 : 1;
        state.scores[state.levelIndex] = score;
        state.stars[state.levelIndex] = stars;
        state.feedback = {
          type: "success",
          title: "Anuncio bien construido",
          text: `Muy bien. Ordenaste correctamente el anuncio y ganaste ${score} puntos.`,
        };
        playTone("success");
      } else {
        state.feedback = {
          type: "error",
          title: "El orden todavía no es correcto",
          text: "Revisa si comenzaste con la llamada, luego presentaste el anuncio, explicaste el beneficio y cerraste con una invitación.",
        };
        playTone("error");
      }

      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });

    actionRow.querySelector("[data-cubes-next]")?.addEventListener("click", () => {
      if (state.attempts[state.levelIndex] === 0) return;
      if (state.levelIndex === LEVELS.length - 1) {
        state.finished = true;
        playTone("victory");
      } else {
        state.levelIndex += 1;
        ensureState(state);
        state.feedback = {
          type: "",
          title: `Ahora vas a ${LEVELS[state.levelIndex].title}`,
          text: LEVELS[state.levelIndex].prompt,
        };
        playTone("move");
      }
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });
  }

  function resetLevel(state, levelIndex) {
    state.selected[levelIndex] = [];
    state.attempts[levelIndex] = 0;
    state.hintUsed[levelIndex] = false;
    state.scores[levelIndex] = 0;
    state.cubes[levelIndex] = buildLevelCubes(levelIndex);
  }

  function renderFinal(board, actionRow, state) {
    const score = totalScore(state);
    const stars = totalStars(state);
    board.innerHTML = `
      <section class="radial-final-screen radial-cubes-final">
        <div class="radial-kicker">Juego completado</div>
        <h3>Terminaste Cubos 3D</h3>
        <p>Puntuación total: <strong>${score}</strong></p>
        <p>Estrellas acumuladas: <strong>${"★".repeat(Math.max(1, stars))}</strong></p>
        <p>${score >= 60 ? "Excelente. Ya construyes anuncios radiales completos con orden, coherencia y lenguaje persuasivo." : "Buen trabajo. Sigue practicando cómo organizar la llamada, la presentación, la argumentación y el cierre."}</p>
      </section>
    `;

    actionRow.innerHTML = `
      <button class="real-action" type="button" data-cubes-replay="1">Volver a jugar</button>
      <button class="real-ghost" type="button" data-cubes-close="1">Listo</button>
    `;

    actionRow.querySelector("[data-cubes-replay]")?.addEventListener("click", () => {
      const next = createState();
      ensureState(next);
      saveState(next);
      mountReset();
    });
    actionRow.querySelector("[data-cubes-close]")?.addEventListener("click", () => location.reload());
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
        msg: "Construiste anuncios radiales ordenando frases según su estructura.",
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
        move: [380, 0.04],
        success: [620, 0.08],
        error: [220, 0.08],
        victory: [760, 0.18],
      };
      const [frequency, duration] = presets[type] || presets.move;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch {}
  }

  function shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
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
