(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const TARGET_GAME = "anuncio-9";
  const SESSION_KEY = "yoyo_rg_x";
  const PROGRESS_KEY = "yoyo_rg_p";
  const STATE_KEY = "yoyo_radial_timeline_state";

  const LEVELS = [
    {
      title: "Nivel 1",
      subtitle: "Estructura del anuncio",
      prompt: "Ordena las partes básicas del anuncio radial desde el inicio hasta el cierre.",
      hint: "Primero se capta la atención, luego se presenta, después se argumenta y al final se invita a actuar.",
      ordered: [
        "Llamada",
        "Presentación",
        "Argumentación",
        "Implicación o cierre",
      ],
    },
    {
      title: "Nivel 2",
      subtitle: "Creación de un anuncio de producto",
      prompt: "Organiza los pasos para crear un anuncio radial de producto claro y persuasivo.",
      hint: "Antes de escribir el anuncio debes saber qué vas a anunciar y a quién va dirigido.",
      ordered: [
        "Elegir el producto.",
        "Definir el público.",
        "Pensar en una frase llamativa.",
        "Presentar el producto.",
        "Explicar sus beneficios.",
        "Crear un cierre persuasivo.",
        "Ensayar la lectura.",
        "Presentar el anuncio.",
      ],
    },
    {
      title: "Nivel 3",
      subtitle: "Anuncio de interés social",
      prompt: "Ordena el proceso para crear un anuncio radial que ayude a la comunidad.",
      hint: "En un anuncio social, primero identificas el problema y luego propones una acción concreta.",
      ordered: [
        "Identificar un problema de la comunidad.",
        "Investigar información importante.",
        "Elegir el público al que va dirigido.",
        "Crear una llamada de atención.",
        "Explicar el problema.",
        "Proponer una acción.",
        "Usar frases persuasivas.",
        "Ensayar con buena entonación.",
        "Presentar la campaña.",
      ],
    },
    {
      title: "Nivel 4",
      subtitle: "Revisión del anuncio",
      prompt: "Ordena los pasos para revisar y mejorar un anuncio radial antes de la versión final.",
      hint: "Primero lees todo el anuncio y luego revisas parte por parte lo que debe mejorarse.",
      ordered: [
        "Leer el anuncio completo.",
        "Revisar si tiene llamada.",
        "Revisar si presenta el producto o problema.",
        "Revisar si tiene argumentos.",
        "Verificar si usa oraciones imperativas o interrogativas.",
        "Mejorar palabras persuasivas.",
        "Corregir errores de redacción.",
        "Escribir la versión final.",
      ],
    },
    {
      title: "Nivel 5",
      subtitle: "Ensayo y presentación oral",
      prompt: "Organiza el proceso de preparación oral para presentar un anuncio radial en equipo.",
      hint: "Cuando el anuncio ya está escrito, el grupo debe organizarse y practicar antes de presentarlo.",
      ordered: [
        "Distribuir los roles del grupo.",
        "Practicar la lectura.",
        "Marcar pausas.",
        "Cuidar el tono de voz.",
        "Usar silencios cuando sea necesario.",
        "Ensayar varias veces.",
        "Presentar detrás de una caja o mampara.",
        "Escuchar comentarios para mejorar.",
      ],
    },
  ];

  let dragItem = null;
  let audioContext = null;

  function getStudentId() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      return session?.role === "student" ? session.id : "guest";
    } catch {
      return "guest";
    }
  }

  function freshState() {
    return {
      levelIndex: 0,
      attempts: {},
      solved: {},
      scores: {},
      hints: {},
      startedAt: Date.now(),
      order: [],
      feedback: null,
      finished: false,
    };
  }

  function loadState() {
    const studentId = getStudentId();
    try {
      const all = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
      return all[studentId] || freshState();
    } catch {
      return freshState();
    }
  }

  function saveState(state) {
    const studentId = getStudentId();
    const all = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
    all[studentId] = state;
    localStorage.setItem(STATE_KEY, JSON.stringify(all));
  }

  function ensureOrder(state) {
    if (!state.order.length) {
      state.order = shuffle(LEVELS[state.levelIndex].ordered);
    }
  }

  function totalPoints(state) {
    return Object.values(state.scores).reduce((sum, value) => sum + value, 0);
  }

  function totalStars(state) {
    return Object.values(state.solved).reduce((sum, solved) => sum + (solved?.stars || 0), 0);
  }

  function mount() {
    renameActivityCard();

    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    if (!card || card.dataset.radialTimelineReady === "1") return;
    card.dataset.radialTimelineReady = "1";

    const title = card.querySelector(".play-top h3");
    const text = card.querySelector(".play-top .muted-main");
    if (title && title.textContent !== "9. Línea del tiempo") title.textContent = "9. Línea del tiempo";
    if (text && text.textContent !== "Ordena el proceso para crear, revisar y presentar un anuncio radial.") {
      text.textContent = "Ordena el proceso para crear, revisar y presentar un anuncio radial.";
    }

    const board = card.querySelector(".game-board");
    const actionRow = card.querySelector(".action-row");
    if (!board || !actionRow) return;

    const state = loadState();
    ensureOrder(state);
    saveState(state);
    renderGame(card, board, actionRow, state);
  }

  function renameActivityCard() {
    app.querySelectorAll(`[data-oa="${TARGET_GAME}"]`).forEach((button) => {
      const heading = button.querySelector("h4");
      const copy = button.querySelector("p");
      if (heading && heading.textContent !== "9. Línea del tiempo") heading.textContent = "9. Línea del tiempo";
      if (copy && copy.textContent !== "Ordena los pasos para crear y presentar un anuncio radial.") {
        copy.textContent = "Ordena los pasos para crear y presentar un anuncio radial.";
      }
    });
  }

  function renderGame(card, board, actionRow, state) {
    if (state.finished) {
      renderFinal(board, actionRow, state);
      return;
    }

    const level = LEVELS[state.levelIndex];
    const nextEnabled = (state.attempts[state.levelIndex] || 0) > 0;
    const currentOrder = state.order;

    board.innerHTML = `
      <section class="radial-timeline-app">
        <div class="radial-status-grid">
          <article class="radial-status-card">
            <div class="radial-kicker">Progreso</div>
            <strong>${level.title}</strong>
            <span>${level.subtitle}</span>
          </article>
          <article class="radial-status-card">
            <div class="radial-kicker">Puntos acumulados</div>
            <strong>${totalPoints(state)}</strong>
            <span>${"★".repeat(Math.max(1, totalStars(state) || 1))}</span>
          </article>
          <article class="radial-status-card">
            <div class="radial-kicker">Meta</div>
            <strong>${currentOrder.length} pasos</strong>
            <span>en orden lógico</span>
          </article>
        </div>

        <section class="radial-instruction-panel">
          <div>
            <div class="radial-kicker">Cómo jugar</div>
            <p>${level.prompt}</p>
          </div>
          <div class="radial-cubes-help-actions">
            <button class="real-ghost radial-helper-button" type="button" data-timeline-repeat="1">Repetir instrucciones</button>
            <button class="real-ghost radial-helper-button" type="button" data-timeline-hint="1">Pista</button>
          </div>
        </section>

        <section class="radial-timeline-board">
          <div class="radial-order-head">
            <div class="instruction-chip">Arrastra las tarjetas y ordénalas en la línea del tiempo</div>
            <div class="radial-order-meta">Nivel: ${state.levelIndex + 1}/${LEVELS.length}</div>
          </div>
          <div class="radial-timeline-list" data-timeline-list="1">
            ${currentOrder
              .map(
                (item, index) => `
                  <article class="radial-timeline-card" draggable="true" data-timeline-text="${escapeHtml(item)}">
                    <span class="radial-timeline-dot">${index + 1}</span>
                    <span class="radial-timeline-line"></span>
                    <div class="radial-timeline-copy">
                      <div class="radial-order-part">Paso ${index + 1}</div>
                      <p>${escapeHtml(item)}</p>
                    </div>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>

        <section class="radial-feedback ${state.feedback?.type || ""}">
          <div class="radial-kicker">Retroalimentación</div>
          <strong>${state.feedback?.title || "Ordena los pasos y luego pulsa Verificar."}</strong>
          <p>${state.feedback?.text || "Piensa en el proceso completo: planificar, redactar, revisar, ensayar y presentar el anuncio radial."}</p>
        </section>

        <details class="radial-teacher-panel">
          <summary>Panel docente</summary>
          <div class="radial-teacher-grid">
            <article>
              <h4>Objetivo</h4>
              <p>Ordenar correctamente los pasos para crear un anuncio radial coherente, persuasivo y bien estructurado.</p>
            </article>
            <article>
              <h4>Competencias</h4>
              <p>Comunicativa, pensamiento lógico, creativo y crítico, y ética y ciudadana.</p>
            </article>
            <article>
              <h4>Uso en clase</h4>
              <p>Puede emplearse para reforzar la secuencia de producción escrita y oral del anuncio radial después de explicar su estructura.</p>
            </article>
            <article>
              <h4>Evidencia</h4>
              <p>El estudiante organiza de forma lógica las etapas de planificación, redacción, revisión, ensayo y presentación del anuncio.</p>
            </article>
          </div>
        </details>
      </section>
    `;

    actionRow.innerHTML = `
      <button class="real-ghost" type="button" data-timeline-reset="1">Reintentar</button>
      <button class="real-action" type="button" data-timeline-check="1">Verificar</button>
      <button class="real-action ${nextEnabled ? "" : "radial-disabled"}" type="button" data-timeline-next="1" ${nextEnabled ? "" : "disabled"}>Siguiente nivel</button>
    `;

    bindBoard(board, state);
    bindActions(card, board, actionRow, state);
  }

  function bindBoard(board, state) {
    const list = board.querySelector("[data-timeline-list]");
    list?.querySelectorAll(".radial-timeline-card").forEach((item) => {
      item.addEventListener("dragstart", () => {
        dragItem = item;
        item.classList.add("dragging");
        playTone("drag");
      });

      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        dragItem = null;
      });

      item.addEventListener("dragover", (event) => event.preventDefault());
      item.addEventListener("drop", (event) => {
        event.preventDefault();
        if (!dragItem || dragItem === item) return;
        const items = [...list.children];
        const from = items.indexOf(dragItem);
        const to = items.indexOf(item);
        if (from < to) list.insertBefore(dragItem, item.nextSibling);
        else list.insertBefore(dragItem, item);
        syncOrderFromDom(list, state);
        playTone("drop");
      });
    });
  }

  function bindActions(card, board, actionRow, state) {
    board.querySelector("[data-timeline-repeat]")?.addEventListener("click", () => {
      state.feedback = {
        type: "",
        title: "Instrucciones repetidas",
        text: LEVELS[state.levelIndex].prompt,
      };
      saveState(state);
      renderGame(card, board, actionRow, state);
    });

    board.querySelector("[data-timeline-hint]")?.addEventListener("click", () => {
      state.hints[state.levelIndex] = (state.hints[state.levelIndex] || 0) + 1;
      state.scores[state.levelIndex] = Math.max(0, (state.scores[state.levelIndex] || 0) - 2);
      state.feedback = {
        type: "",
        title: "Pista activada",
        text: LEVELS[state.levelIndex].hint,
      };
      playTone("hint");
      saveState(state);
      renderGame(card, board, actionRow, state);
    });

    actionRow.querySelector("[data-timeline-reset]")?.addEventListener("click", () => {
      state.order = shuffle(LEVELS[state.levelIndex].ordered);
      state.startedAt = Date.now();
      state.feedback = {
        type: "",
        title: "Nivel reiniciado",
        text: "Vuelve a organizar los pasos en la línea del tiempo hasta formar el proceso correcto.",
      };
      saveState(state);
      renderGame(card, board, actionRow, state);
    });

    actionRow.querySelector("[data-timeline-check]")?.addEventListener("click", () => {
      syncOrderFromDom(board.querySelector("[data-timeline-list]"), state);
      const level = LEVELS[state.levelIndex];
      state.attempts[state.levelIndex] = (state.attempts[state.levelIndex] || 0) + 1;
      const current = state.order;
      const expected = level.ordered;

      if (JSON.stringify(current) === JSON.stringify(expected)) {
        const firstTry = state.attempts[state.levelIndex] === 1;
        const points = firstTry ? 10 : 5;
        const noHintBonus = (state.hints[state.levelIndex] || 0) === 0 ? 5 : 0;
        const score = points + noHintBonus;
        const stars = firstTry && noHintBonus ? 3 : firstTry ? 2 : 1;
        state.scores[state.levelIndex] = Math.max(state.scores[state.levelIndex] || 0, score);
        state.solved[state.levelIndex] = { ok: true, stars };
        state.feedback = {
          type: "success",
          title: "Orden correcto",
          text: `Muy bien. Ordenaste correctamente el proceso del anuncio radial y obtuviste ${score} puntos.`,
        };
        persistPartialProgress();
        playTone("success");
      } else {
        state.feedback = {
          type: "error",
          title: "Orden por revisar",
          text: "Algunos pasos no siguen la secuencia lógica. Piensa primero qué se planifica, qué se redacta, qué se revisa y qué se presenta.",
        };
        playTone("error");
      }

      saveState(state);
      renderGame(card, board, actionRow, state);
    });

    actionRow.querySelector("[data-timeline-next]")?.addEventListener("click", () => {
      if ((state.attempts[state.levelIndex] || 0) === 0) return;
      if (state.levelIndex === LEVELS.length - 1) {
        state.finished = true;
        playTone("victory");
      } else {
        state.levelIndex += 1;
        state.order = [];
        state.startedAt = Date.now();
        ensureOrder(state);
        state.feedback = {
          type: "",
          title: `Ahora vas a ${LEVELS[state.levelIndex].title}`,
          text: LEVELS[state.levelIndex].prompt,
        };
        playTone("drop");
      }
      saveState(state);
      renderGame(card, board, actionRow, state);
    });
  }

  function syncOrderFromDom(list, state) {
    if (!list) return;
    state.order = [...list.querySelectorAll(".radial-timeline-card")].map((item) => decodeHtml(item.dataset.timelineText));
  }

  function renderFinal(board, actionRow, state) {
    const score = totalPoints(state);
    const stars = totalStars(state);
    board.innerHTML = `
      <section class="radial-final-screen radial-timeline-final">
        <div class="radial-kicker">Juego completado</div>
        <h3>Terminaste Línea del tiempo</h3>
        <p>Puntuación total: <strong>${score}</strong></p>
        <p>Estrellas acumuladas: <strong>${"★".repeat(Math.max(1, stars))}</strong></p>
        <p>${score >= 65 ? "Excelente. Comprendes muy bien cómo se planifica, redacta, revisa y presenta un anuncio radial." : "Buen trabajo. Ya identificas el proceso del anuncio radial y puedes seguir practicando su secuencia de creación."}</p>
      </section>
    `;

    actionRow.innerHTML = `
      <button class="real-action" type="button" data-timeline-replay="1">Volver a jugar</button>
      <button class="real-ghost" type="button" data-timeline-close="1">Listo</button>
    `;

    actionRow.querySelector("[data-timeline-replay]")?.addEventListener("click", () => {
      const next = freshState();
      ensureOrder(next);
      saveState(next);
      mountReset();
    });
    actionRow.querySelector("[data-timeline-close]")?.addEventListener("click", () => location.reload());
  }

  function mountReset() {
    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    const board = card?.querySelector(".game-board");
    const actionRow = card?.querySelector(".action-row");
    if (!card || !board || !actionRow) return;
    renderGame(card, board, actionRow, loadState());
  }

  function persistPartialProgress() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      if (!session?.id) return;
      const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
      progress[session.id] = progress[session.id] || {};
      progress[session.id][TARGET_GAME] = {
        ok: true,
        score: 10,
        c: ["C1", "C2", "C3"],
        msg: "Ordenaste correctamente los pasos para crear y presentar un anuncio radial.",
        topicId: "anuncio",
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {}
  }

  function persistPlatformSuccess() {
    persistPartialProgress();
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
        drag: [360, 0.04],
        drop: [430, 0.05],
        hint: [470, 0.06],
        success: [640, 0.08],
        error: [220, 0.08],
        victory: [760, 0.18],
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
