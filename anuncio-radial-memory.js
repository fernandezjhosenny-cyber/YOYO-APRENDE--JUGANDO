(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const TARGET_GAME = "anuncio-4";
  const SESSION_KEY = "yoyo_rg_x";
  const PROGRESS_KEY = "yoyo_rg_p";
  const STATE_KEY = "yoyo_radial_memory_state";

  const LEVELS = [
    {
      title: "Nivel 1",
      subtitle: "Estructura del anuncio",
      theme: "Partes del anuncio radial",
      help: "Encuentra la parte del anuncio y su ejemplo correspondiente.",
      pairs: [
        ["Llamada", "\u00BFQuieres lo mejor?"],
        ["Presentaci\u00F3n", "Este producto es natural."],
        ["Argumentaci\u00F3n", "Te ayuda a sentirte mejor."],
        ["Cierre", "Compra ahora."],
      ],
    },
    {
      title: "Nivel 2",
      subtitle: "Elementos del anuncio",
      theme: "Conceptos clave",
      help: "Relaciona cada concepto con el ejemplo que le corresponde dentro del anuncio radial.",
      pairs: [
        ["Producto", "Jugo natural"],
        ["P\u00FAblico", "Familias"],
        ["Intenci\u00F3n", "Convencer"],
        ["Mensaje", "Beneficios del producto"],
      ],
    },
    {
      title: "Nivel 3",
      subtitle: "Recursos y emociones",
      theme: "Recursos expresivos",
      help: "Observa la palabra clave y encuentra la idea relacionada que ayuda a persuadir en el anuncio.",
      pairs: [
        ["Emoci\u00F3n", "Alegr\u00EDa"],
        ["Emoci\u00F3n", "Urgencia"],
        ["Recurso", "M\u00FAsica"],
        ["Recurso", "Silencio"],
        ["Recurso", "Tono de voz"],
        ["Lenguaje", "Persuasivo"],
      ],
    },
    {
      title: "Nivel 4",
      subtitle: "Tipos de oraciones",
      theme: "Funci\u00F3n comunicativa",
      help: "Asocia cada tipo de oraci\u00F3n o prop\u00F3sito con un ejemplo propio del anuncio radial.",
      pairs: [
        ["Interrogativa", "\u00BFQuieres sentirte mejor?"],
        ["Imperativa", "Compra ahora."],
        ["Informativa", "Este producto es saludable."],
        ["Social", "Evita enfermedades."],
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
      selected: [],
      matched: {},
      attempts: {},
      scores: {},
      stars: {},
      feedback: null,
      startedAt: Date.now(),
      finished: false,
    };
  }

  function buildCards(levelIndex) {
    const level = LEVELS[levelIndex];
    return shuffle(
      level.pairs.flatMap((pair, pairIndex) => [
        {
          id: `${levelIndex}-${pairIndex}-a`,
          pairId: `${levelIndex}-${pairIndex}`,
          label: pair[0],
          accent: "violet",
        },
        {
          id: `${levelIndex}-${pairIndex}-b`,
          pairId: `${levelIndex}-${pairIndex}`,
          label: pair[1],
          accent: "sky",
        },
      ])
    );
  }

  function ensureState(state) {
    const level = LEVELS[state.levelIndex];
    if (!level) return;
    state.matched[state.levelIndex] = state.matched[state.levelIndex] || [];
    state.attempts[state.levelIndex] = state.attempts[state.levelIndex] || 0;
    state.cards = state.cards || {};
    state.cards[state.levelIndex] = state.cards[state.levelIndex] || buildCards(state.levelIndex);
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
    if (!card || card.dataset.radialMemoryReady === "1") return;
    card.dataset.radialMemoryReady = "1";

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
    const cards = state.cards[state.levelIndex];
    const matched = new Set(state.matched[state.levelIndex]);
    const selected = state.selected;
    const reviewed = (state.attempts[state.levelIndex] || 0) > 0 || (state.scores[state.levelIndex] || 0) > 0;

    board.innerHTML = `
      <section class="radial-memory-app">
        <div class="radial-fill-topbar">
          <article class="radial-fill-stat">
            <div class="radial-kicker">Progreso</div>
            <strong>${level.title}</strong>
            <span>${level.theme}</span>
          </article>
          <article class="radial-fill-stat">
            <div class="radial-kicker">Puntos acumulados</div>
            <strong>${totalScore(state)}</strong>
            <span>${"\u2605".repeat(Math.max(1, totalStars(state) || 1))}</span>
          </article>
          <article class="radial-fill-stat">
            <div class="radial-kicker">Meta</div>
            <strong>${matched.size}/${level.pairs.length}</strong>
            <span>pares encontrados</span>
          </article>
        </div>

        <section class="radial-fill-help">
          <div>
            <div class="radial-kicker">C\u00F3mo jugar</div>
            <p>Destapa dos tarjetas. Si las ideas se relacionan entre s\u00ED, se quedan visibles. Si no coinciden, se voltean otra vez.</p>
          </div>
          <button class="real-ghost" type="button" data-memory-repeat="1">Repetir instrucciones</button>
        </section>

        <section class="radial-memory-status">
          <div class="instruction-chip">Encuentra pares relacionados con el anuncio radial</div>
          <div class="radial-memory-badges">
            <span class="status-badge">${reviewed ? "retroalimentación disponible" : "listo para revisar"}</span>
            <span class="status-badge">Nivel: ${level.subtitle}</span>
          </div>
        </section>

        <div class="radial-memory-grid">
          ${cards
            .map((item) => {
              const visible = matched.has(item.pairId) || selected.includes(item.id);
              const stateClass = matched.has(item.pairId)
                ? "matched correct"
                : selected.includes(item.id)
                  ? "revealed"
                  : "hidden";
              return `
                <button
                  class="memory-card radial-memory-card ${stateClass} ${item.accent}"
                  data-memory-id="${item.id}"
                  data-memory-pair="${item.pairId}"
                  type="button"
                >
                  <span class="memory-face memory-front">?</span>
                  <span class="memory-face memory-back">${visible ? escapeHtml(item.label) : ""}</span>
                </button>
              `;
            })
            .join("")}
        </div>

        <section class="radial-fill-feedback ${state.feedback?.type || ""}">
          <div class="radial-kicker">Retroalimentaci\u00F3n</div>
          <strong>${state.feedback?.title || "Relaciona conceptos y ejemplos del anuncio radial."}</strong>
          <p>${state.feedback?.text || level.help}</p>
        </section>
      </section>
    `;

    actionRow.innerHTML = `
      <button class="real-ghost" type="button" data-memory-reset="1">Reiniciar</button>
      <button class="real-action" type="button" data-memory-check="1">Verificar</button>
      <button class="real-action ${reviewed ? "" : "radial-disabled"}" type="button" data-memory-next="1" ${reviewed ? "" : "disabled"}>Siguiente nivel</button>
    `;

    bindBoard(board, actionRow, state);
    bindActions(board, actionRow, state);
  }

  function bindBoard(board, actionRow, state) {
    board.querySelectorAll("[data-memory-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const level = LEVELS[state.levelIndex];
        const matched = new Set(state.matched[state.levelIndex]);
        const cardId = button.dataset.memoryId;
        const pairId = button.dataset.memoryPair;

        if (matched.has(pairId) || state.selected.includes(cardId) || state.selected.length === 2) return;

        state.selected = [...state.selected, cardId];
        state.feedback = {
          type: "",
          title: "Tarjeta descubierta",
          text: "Busca otra tarjeta relacionada para formar el par.",
        };
        playTone("flip");
        saveState(state);
        render(board.closest(".play-card"), board, actionRow, state);

        if (state.selected.length !== 2) return;

        state.attempts[state.levelIndex] = (state.attempts[state.levelIndex] || 0) + 1;
        const currentCards = state.cards[state.levelIndex];
        const picked = currentCards.filter((item) => state.selected.includes(item.id));
        const match = picked.length === 2 && picked[0].pairId === picked[1].pairId;

        if (match) {
          state.matched[state.levelIndex] = [...state.matched[state.levelIndex], picked[0].pairId];
          state.selected = [];
          state.feedback = {
            type: "success",
            title: "\u00A1Par correcto!",
            text: "Muy bien. Relacionaste dos ideas que trabajan juntas dentro del anuncio radial.",
          };
          playTone("success");
          saveState(state);
          setTimeout(() => {
            render(board.closest(".play-card"), board, actionRow, state);
          }, 180);
          return;
        }

        state.feedback = {
          type: "error",
          title: "Estas tarjetas no forman pareja",
          text: "Observa mejor la relaci\u00F3n entre concepto y ejemplo antes de volver a intentar.",
        };
        playTone("error");
        saveState(state);
        setTimeout(() => {
          state.selected = [];
          saveState(state);
          render(board.closest(".play-card"), board, actionRow, state);
        }, 700);
      });
    });
  }

  function bindActions(board, actionRow, state) {
    board.querySelector("[data-memory-repeat]")?.addEventListener("click", () => {
      const level = LEVELS[state.levelIndex];
      state.feedback = {
        type: "",
        title: "Instrucciones repetidas",
        text: level.help,
      };
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });

    actionRow.querySelector("[data-memory-reset]")?.addEventListener("click", () => {
      state.cards[state.levelIndex] = buildCards(state.levelIndex);
      state.matched[state.levelIndex] = [];
      state.selected = [];
      state.attempts[state.levelIndex] = 0;
      state.feedback = {
        type: "",
        title: "Tablero reiniciado",
        text: "Comienza otra vez y trata de recordar mejor la posici\u00F3n de las tarjetas.",
      };
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });

    actionRow.querySelector("[data-memory-check]")?.addEventListener("click", () => {
      const level = LEVELS[state.levelIndex];
      const matchedCount = (state.matched[state.levelIndex] || []).length;
      const attempts = state.attempts[state.levelIndex] || 0;
      const ratio = matchedCount / level.pairs.length;
      const fastBonus = ratio === 1 && attempts <= level.pairs.length + 1 ? 5 : 0;
      const penalty = attempts > level.pairs.length * 2 ? 2 : 0;
      const score = Math.max(0, Math.round(level.pairs.length * 10 * ratio + fastBonus - penalty));
      const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : ratio > 0 ? 1 : 0;

      state.scores[state.levelIndex] = score;
      state.stars[state.levelIndex] = stars;

      if (!attempts && !matchedCount) {
        state.feedback = {
          type: "error",
          title: "Aún no has revisado suficientes tarjetas",
          text: "Destapa varias tarjetas y busca relaciones entre concepto y ejemplo. Luego verifica para recibir una retroalimentación más completa.",
        };
        playTone("error");
      } else if (ratio === 1) {
        state.feedback = {
          type: "success",
          title: "Nivel completado",
          text: `Logro: encontraste los ${matchedCount} pares. Siguiente paso: mantén esa atención al detalle en el próximo nivel. Pregunta para pensar: ¿qué relación te ayudó más a recordar las tarjetas?`,
        };
        playTone("victory");
      } else {
        state.feedback = {
          type: "error",
          title: "Retroalimentación del nivel",
          text: `Logro: encontraste ${matchedCount} de ${level.pairs.length} pares y obtuviste ${score} puntos. Para mejorar: observa mejor la relación entre concepto y ejemplo antes de destapar la segunda tarjeta. Pregunta para pensar: ¿qué pistas del texto te ayudan a reconocer una pareja correcta?`,
        };
        playTone("error");
      }

      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });

    actionRow.querySelector("[data-memory-next]")?.addEventListener("click", () => {
      const reviewed = (state.attempts[state.levelIndex] || 0) > 0 || (state.scores[state.levelIndex] || 0) > 0;
      if (!reviewed) return;
      if (!state.feedback?.title) {
        actionRow.querySelector("[data-memory-check]")?.click();
        return;
      }
      if (state.levelIndex === LEVELS.length - 1) {
        state.finished = true;
        persistPlatformSuccess();
        playTone("success");
        saveState(state);
        render(board.closest(".play-card"), board, actionRow, state);
        return;
      }
      state.levelIndex += 1;
      state.selected = [];
      state.startedAt = Date.now();
      ensureState(state);
      state.feedback = {
        type: "",
        title: `Ahora vas a ${LEVELS[state.levelIndex].title}`,
        text: LEVELS[state.levelIndex].help,
      };
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
        <h3>Terminaste Memoria visual</h3>
        <p>Puntuaci\u00F3n total: <strong>${points}</strong></p>
        <p>Estrellas acumuladas: <strong>${"\u2605".repeat(Math.max(1, stars))}</strong></p>
        <p>${points >= 170 ? "Excelente. Ya relacionas estructura, lenguaje y recursos del anuncio radial." : "Buen trabajo. Sigue practicando c\u00F3mo se conectan las partes y ejemplos del anuncio radial."}</p>
      </section>
    `;

    actionRow.innerHTML = `
      <button class="real-action" type="button" data-memory-replay="1">Volver a jugar</button>
      <button class="real-ghost" type="button" data-memory-close="1">Listo</button>
    `;

    actionRow.querySelector("[data-memory-replay]")?.addEventListener("click", () => {
      const next = createState();
      ensureState(next);
      saveState(next);
      mountReset();
    });
    actionRow.querySelector("[data-memory-close]")?.addEventListener("click", () => location.reload());
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
        msg: "Relacionaste conceptos, ejemplos y tipos de oraciones del anuncio radial.",
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
        flip: [380, 0.04],
        success: [620, 0.08],
        error: [220, 0.08],
        victory: [760, 0.18],
      };
      const [frequency, duration] = presets[type] || presets.flip;
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
