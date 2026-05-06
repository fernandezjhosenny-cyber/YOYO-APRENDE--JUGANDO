(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const TARGET_GAME = "anuncio-7";
  const SESSION_KEY = "yoyo_rg_x";
  const PROGRESS_KEY = "yoyo_rg_p";
  const STATE_KEY = "yoyo_radial_pair_state";

  const LEVELS = [
    {
      title: "Nivel 1",
      subtitle: "Partes del anuncio radial",
      prompt: "Relaciona cada parte del anuncio radial con su función.",
      pairs: [
        ["Llamada", "Capta la atención del oyente"],
        ["Presentación", "Da a conocer el producto o idea"],
        ["Argumentación", "Explica beneficios o razones para convencer"],
        ["Implicación o cierre", "Invita al público a actuar"],
      ],
    },
    {
      title: "Nivel 2",
      subtitle: "Frases y partes del anuncio",
      prompt: "Une cada frase con la parte del anuncio radial a la que pertenece.",
      pairs: [
        ["¿Quieres cuidar tu salud?", "Llamada"],
        ["Nuestro jugo natural es delicioso.", "Presentación"],
        ["Contiene vitaminas que fortalecen tu cuerpo.", "Argumentación"],
        ["¡Compra ahora!", "Implicación o cierre"],
      ],
    },
    {
      title: "Nivel 3",
      subtitle: "Gramática del anuncio",
      prompt: "Relaciona el concepto gramatical con su ejemplo dentro del anuncio radial.",
      pairs: [
        ["Oración interrogativa", "¿Te gustaría sentirte mejor?"],
        ["Oración imperativa", "Compra ahora."],
        ["Oración informativa", "Este producto contiene vitaminas."],
        ["Palabra persuasiva", "delicioso"],
      ],
    },
    {
      title: "Nivel 4",
      subtitle: "Recursos persuasivos",
      prompt: "Relaciona cada recurso persuasivo con el efecto que produce en el anuncio.",
      pairs: [
        ["Música", "Crea ambiente o emoción"],
        ["Silencio", "Aumenta suspenso o atención"],
        ["Tono de voz", "Transmite intención y emoción"],
        ["Pausas", "Dan fuerza al mensaje"],
        ["Palabras persuasivas", "Ayudan a convencer"],
      ],
    },
    {
      title: "Nivel 5",
      subtitle: "Anuncio de interés social",
      prompt: "Relaciona cada frase del anuncio social con su función en el mensaje radial.",
      pairs: [
        ["¿Te preocupa el dengue?", "Llamada"],
        ["Elimina el agua acumulada.", "Acción recomendada"],
        ["Así evitas enfermedades.", "Argumento"],
        ["¡Actúa hoy por tu comunidad!", "Cierre persuasivo"],
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
      answers: {},
      attempts: {},
      scores: {},
      stars: {},
      feedback: null,
      checked: {},
      solved: {},
      options: {},
      finished: false,
    };
  }

  function ensureState(state) {
    const levelIndex = state.levelIndex;
    state.answers[levelIndex] = state.answers[levelIndex] || {};
    state.attempts[levelIndex] = state.attempts[levelIndex] || 0;
    state.scores[levelIndex] = state.scores[levelIndex] || 0;
    state.stars[levelIndex] = state.stars[levelIndex] || 0;
    state.checked[levelIndex] = Boolean(state.checked[levelIndex]);
    state.solved[levelIndex] = Boolean(state.solved[levelIndex]);
    state.options[levelIndex] = state.options[levelIndex] || shuffle(LEVELS[levelIndex].pairs.map((pair) => pair[1]));
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
    if (!card || card.dataset.radialPairReady === "1") return;
    card.dataset.radialPairReady = "1";

    const text = card.querySelector(".play-top .muted-main");
    if (text && text.textContent !== "Relaciona conceptos, funciones y ejemplos del anuncio radial.") {
      text.textContent = "Relaciona conceptos, funciones y ejemplos del anuncio radial.";
    }

    const board = card.querySelector(".game-board");
    const actionRow = card.querySelector(".action-row");
    if (!board || !actionRow) return;

    const state = loadState();
    ensureState(state);
    saveState(state);
    render(card, board, actionRow, state);
  }

  function render(card, board, actionRow, state) {
    if (state.finished) {
      renderFinal(board, actionRow, state);
      return;
    }

    ensureState(state);
    const level = LEVELS[state.levelIndex];
    const answers = state.answers[state.levelIndex];
    const checked = state.checked[state.levelIndex];
    const reviewed = state.checked[state.levelIndex];
    const hasAnyAnswer = level.pairs.some(([prompt]) => answers[prompt]);

    board.innerHTML = `
      <section class="radial-pair-app">
        <div class="radial-fill-topbar">
          <article class="radial-fill-stat">
            <div class="radial-kicker">Nivel</div>
            <strong>${level.title}</strong>
            <span>${level.subtitle}</span>
          </article>
          <article class="radial-fill-stat">
            <div class="radial-kicker">Puntos acumulados</div>
            <strong>${totalScore(state)}</strong>
            <span>${"★".repeat(Math.max(1, totalStars(state) || 1))}</span>
          </article>
          <article class="radial-fill-stat">
            <div class="radial-kicker">Meta</div>
            <strong>${Object.keys(answers).length}/${level.pairs.length}</strong>
            <span>${checked ? "verificado" : "relacionando ideas"}</span>
          </article>
        </div>

        <section class="radial-fill-help">
          <div>
            <div class="radial-kicker">Cómo jugar</div>
            <p>${level.prompt}</p>
          </div>
          <button class="real-ghost" type="button" data-pair-repeat="1">Repetir instrucciones</button>
        </section>

        <section class="radial-pair-stage">
          <div class="instruction-chip">Relaciona cada idea con su función, significado o ejemplo correcto</div>
          <div class="radial-pair-grid">
            ${level.pairs
              .map(([prompt, answer], index) => {
                const current = answers[prompt];
                const isCorrect = checked && current === answer;
                const isWrong = checked && current && current !== answer;
                return `
                  <article class="pair-pack-card radial-link-card ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}">
                    <div class="radial-link-head">
                      <span class="question-index">Relación ${index + 1}</span>
                      <h4>${escapeHtml(prompt)}</h4>
                    </div>
                    <div class="pair-choice-grid radial-link-options">
                      ${state.options[state.levelIndex]
                        .map((option) => {
                          const selected = current === option;
                          const classes = [
                            "choice-card",
                            "pair-choice",
                            "radial-link-option",
                            selected ? "selected" : "",
                            checked && option === answer ? "answer" : "",
                            checked && selected && option !== answer ? "selected-wrong" : "",
                          ]
                            .filter(Boolean)
                            .join(" ");
                          return `
                            <button
                              class="${classes}"
                              data-pair-prompt="${escapeHtml(prompt)}"
                              data-pair-option="${escapeHtml(option)}"
                              type="button"
                              ${checked ? "disabled" : ""}
                            >
                              ${escapeHtml(option)}
                            </button>
                          `;
                        })
                        .join("")}
                    </div>
                    <div class="radial-link-connection ${current ? "active" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}">
                      <span class="connection-dot"></span>
                      <span class="connection-line"></span>
                      <span class="connection-text">${current ? escapeHtml(current) : "Selecciona la idea correcta"}</span>
                    </div>
                  </article>
                `;
              })
              .join("")}
          </div>
        </section>

        <section class="radial-fill-feedback ${state.feedback?.type || ""}">
          <div class="radial-kicker">Retroalimentación</div>
          <strong>${state.feedback?.title || "Relaciona cada concepto del anuncio radial con la idea correcta."}</strong>
          <p>${state.feedback?.text || "Piensa en la función de cada parte, el tipo de oración o el efecto del recurso persuasivo antes de verificar."}</p>
        </section>

        <details class="radial-teacher-panel">
          <summary>Panel docente</summary>
          <div class="radial-teacher-grid">
            <article>
              <h4>Objetivo</h4>
              <p>Relacionar conceptos, funciones y ejemplos del anuncio radial.</p>
            </article>
            <article>
              <h4>Competencias</h4>
              <p>Comunicativa, pensamiento lógico, creativo y crítico, ética y ciudadana.</p>
            </article>
            <article>
              <h4>Uso</h4>
              <p>Puede utilizarse como práctica después de explicar la estructura del anuncio radial.</p>
            </article>
            <article>
              <h4>Evidencia</h4>
              <p>El estudiante relaciona correctamente partes, funciones y ejemplos del anuncio.</p>
            </article>
          </div>
        </details>
      </section>
    `;

    actionRow.innerHTML = `
      <button class="real-ghost" type="button" data-pair-reset="1">Reintentar</button>
      <button class="real-action" type="button" data-pair-check="1" ${hasAnyAnswer && !checked ? "" : "disabled"}>Verificar</button>
      <button class="real-action ${reviewed ? "" : "radial-disabled"}" type="button" data-pair-next="1" ${reviewed ? "" : "disabled"}>Siguiente nivel</button>
    `;

    bindBoard(board, actionRow, state);
    bindActions(board, actionRow, state);
  }

  function bindBoard(board, actionRow, state) {
    board.querySelectorAll("[data-pair-option]").forEach((button) => {
      button.addEventListener("click", () => {
        if (state.checked[state.levelIndex]) return;
        const prompt = decodeHtml(button.dataset.pairPrompt);
        const option = decodeHtml(button.dataset.pairOption);
        state.answers[state.levelIndex][prompt] = option;
        state.feedback = {
          type: "",
          title: "Relación marcada",
          text: "Sigue comparando ideas hasta completar todas las relaciones del nivel.",
        };
        playTone("link");
        saveState(state);
        render(board.closest(".play-card"), board, actionRow, state);
      });
    });
  }

  function bindActions(board, actionRow, state) {
    board.querySelector("[data-pair-repeat]")?.addEventListener("click", () => {
      state.feedback = {
        type: "",
        title: "Instrucciones repetidas",
        text: LEVELS[state.levelIndex].prompt,
      };
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });

    actionRow.querySelector("[data-pair-reset]")?.addEventListener("click", () => {
      resetLevel(state, state.levelIndex);
      state.feedback = {
        type: "",
        title: "Nivel reiniciado",
        text: "Vuelve a relacionar las ideas con calma y revisa bien cada función o ejemplo.",
      };
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });

    actionRow.querySelector("[data-pair-check]")?.addEventListener("click", () => {
      const level = LEVELS[state.levelIndex];
      const answers = state.answers[state.levelIndex];
      state.attempts[state.levelIndex] += 1;

      const correctCount = level.pairs.reduce(
        (sum, [prompt, answer]) => sum + (answers[prompt] === answer ? 1 : 0),
        0
      );

      state.checked[state.levelIndex] = true;
      state.scores[state.levelIndex] = correctCount * 10 + (correctCount === level.pairs.length && state.attempts[state.levelIndex] === 1 ? 5 : 0);
      state.stars[state.levelIndex] = correctCount === level.pairs.length && state.attempts[state.levelIndex] === 1 ? 3 : correctCount >= Math.max(3, level.pairs.length - 1) ? 2 : 1;
      state.solved[state.levelIndex] = correctCount === level.pairs.length;

      if (state.solved[state.levelIndex]) {
        state.feedback = {
          type: "success",
          title: "Relaciones correctas",
          text: `Muy bien. Completaste ${correctCount} relaciones correctas y organizaste las ideas del anuncio radial.`,
        };
        playTone("success");
      } else {
        state.feedback = {
          type: "error",
          title: "Revisa algunas relaciones",
          text: `Acertaste ${correctCount} de ${level.pairs.length}. Observa las conexiones resaltadas y vuelve a intentarlo si quieres mejorar.`,
        };
        playTone("error");
      }

      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });

    actionRow.querySelector("[data-pair-next]")?.addEventListener("click", () => {
      if (!state.checked[state.levelIndex]) return;
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
        playTone("link");
      }
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });
  }

  function resetLevel(state, levelIndex) {
    state.answers[levelIndex] = {};
    state.attempts[levelIndex] = 0;
    state.scores[levelIndex] = 0;
    state.stars[levelIndex] = 0;
    state.checked[levelIndex] = false;
    state.solved[levelIndex] = false;
    state.options[levelIndex] = shuffle(LEVELS[levelIndex].pairs.map((pair) => pair[1]));
  }

  function renderFinal(board, actionRow, state) {
    const score = totalScore(state);
    const stars = totalStars(state);
    board.innerHTML = `
      <section class="radial-final-screen radial-pair-final">
        <div class="radial-kicker">Juego completado</div>
        <h3>Terminaste Relaciona ideas</h3>
        <p>Puntuación total: <strong>${score}</strong></p>
        <p>Estrellas acumuladas: <strong>${"★".repeat(Math.max(1, stars))}</strong></p>
        <p>${score >= 210 ? "Excelente. Relacionas con seguridad partes, funciones, ejemplos y recursos del anuncio radial." : "Buen trabajo. Sigue practicando cómo conectar ideas, funciones y lenguaje persuasivo dentro del anuncio radial."}</p>
      </section>
    `;

    actionRow.innerHTML = `
      <button class="real-action" type="button" data-pair-replay="1">Volver a jugar</button>
      <button class="real-ghost" type="button" data-pair-close="1">Listo</button>
    `;

    actionRow.querySelector("[data-pair-replay]")?.addEventListener("click", () => {
      const next = createState();
      ensureState(next);
      saveState(next);
      mountReset();
    });
    actionRow.querySelector("[data-pair-close]")?.addEventListener("click", () => location.reload());
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
        msg: "Relacionaste conceptos, funciones y ejemplos del anuncio radial.",
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
        link: [420, 0.05],
        success: [620, 0.08],
        error: [220, 0.08],
        victory: [760, 0.18],
      };
      const [frequency, duration] = presets[type] || presets.link;
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

  function decodeHtml(text) {
    const area = document.createElement("textarea");
    area.innerHTML = text;
    return area.value;
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
