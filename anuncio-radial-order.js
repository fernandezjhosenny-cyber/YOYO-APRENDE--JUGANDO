(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const TARGET_GAME = "anuncio-1";
  const SESSION_KEY = "yoyo_rg_x";
  const PROGRESS_KEY = "yoyo_rg_p";
  const STATE_KEY = "yoyo_radial_order_state";

  const LEVELS = [
    {
      title: "Nivel 1",
      subtitle: "Producto saludable",
      hint: "La llamada suele iniciar con una pregunta que capta la atencion.",
      ordered: [
        { part: "Llamada", text: "¿Quieres cuidar tu salud?" },
        { part: "Presentacion", text: "Nuestro jugo natural es saludable." },
        { part: "Argumentacion", text: "Tiene vitaminas que fortalecen tu cuerpo." },
        { part: "Cierre", text: "¡Compra ahora!" },
      ],
    },
    {
      title: "Nivel 2",
      subtitle: "Producto de higiene",
      hint: "La presentacion nombra el producto y la argumentacion explica por que conviene usarlo.",
      ordered: [
        { part: "Llamada", text: "¡Atencion!" },
        { part: "Presentacion", text: "Este jabon elimina bacterias." },
        { part: "Argumentacion", text: "Protege tu piel y la de tu familia." },
        { part: "Cierre", text: "¡Aprovecha hoy!" },
      ],
    },
    {
      title: "Nivel 3",
      subtitle: "Interes social",
      hint: "En un anuncio social, la argumentacion explica la consecuencia o el beneficio de actuar.",
      ordered: [
        { part: "Llamada", text: "¿Te preocupa el dengue?" },
        { part: "Presentacion", text: "Elimina el agua acumulada en tu hogar." },
        { part: "Argumentacion", text: "Asi evitas enfermedades y proteges a tu familia." },
        { part: "Cierre", text: "¡Actua hoy!" },
      ],
    },
    {
      title: "Nivel 4",
      subtitle: "Reciclaje escolar",
      hint: "La implicacion o cierre invita directamente a participar o actuar.",
      ordered: [
        { part: "Llamada", text: "¿Quieres una escuela mas limpia?" },
        { part: "Presentacion", text: "Participa en nuestra jornada de reciclaje escolar." },
        { part: "Argumentacion", text: "Separar residuos ayuda al ambiente y mejora nuestros espacios." },
        { part: "Cierre", text: "¡Trae tus materiales y unete manana!" },
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

  function freshState() {
    return {
      levelIndex: 0,
      attempts: {},
      solved: {},
      scores: {},
      elapsed: {},
      startedAt: Date.now(),
      order: [],
      feedback: null,
      finished: false,
    };
  }

  function totalPoints(state) {
    return Object.values(state.scores).reduce((sum, value) => sum + value, 0);
  }

  function totalStars(state) {
    return Object.values(state.solved).reduce((sum, solved) => sum + (solved?.stars || 0), 0);
  }

  function ensureOrder(state) {
    if (!state.order.length) {
      state.order = shuffle(LEVELS[state.levelIndex].ordered);
    }
  }

  function mount() {
    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    if (!card || card.dataset.radialOrderReady === "1") return;
    card.dataset.radialOrderReady = "1";

    const board = card.querySelector(".game-board");
    const actionRow = card.querySelector(".action-row");
    if (!board || !actionRow) return;

    const state = loadState();
    ensureOrder(state);
    saveState(state);

    renderGame(card, board, actionRow, state);
  }

  function renderGame(card, board, actionRow, state) {
    if (state.finished) {
      renderFinal(card, board, actionRow, state);
      return;
    }

    const level = LEVELS[state.levelIndex];
    const nextEnabled = (state.attempts[state.levelIndex] || 0) > 0;
    const currentOrder = state.order;

    board.innerHTML = `
      <section class="radial-order-app">
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
            <strong>Orden correcto</strong>
            <span>de arriba hacia abajo</span>
          </article>
        </div>

        <section class="radial-instruction-panel">
          <div>
            <div class="radial-kicker">Como jugar</div>
            <p>Arrastra las tarjetas grandes y colocalas en el orden correcto del anuncio radial: llamada, presentacion, argumentacion y cierre.</p>
          </div>
          <button class="real-ghost radial-helper-button" type="button" data-radial-repeat="1">Repetir instrucciones</button>
        </section>

        <section class="radial-order-board">
          <div class="radial-order-head">
            <div class="instruction-chip">Ordena la estructura del anuncio radial</div>
            <div class="radial-order-meta">Nivel: ${state.levelIndex + 1}/${LEVELS.length}</div>
          </div>
          <div class="radial-order-list" data-radial-list="1">
            ${currentOrder.map((item, index) => `
              <article class="radial-order-card" draggable="true" data-order-text="${escapeHtml(item.text)}">
                <span class="radial-order-index">${index + 1}</span>
                <div>
                  <div class="radial-order-part">${item.part}</div>
                  <p>${item.text}</p>
                </div>
              </article>
            `).join("")}
          </div>
        </section>

        <section class="radial-feedback ${state.feedback?.type || ""}">
          <div class="radial-kicker">Retroalimentacion</div>
          <strong>${state.feedback?.title || "Organiza las frases y luego pulsa Verificar."}</strong>
          <p>${state.feedback?.text || "Recuerda: primero captas la atencion, luego presentas, explicas beneficios y cierras invitando a actuar."}</p>
        </section>
      </section>
    `;

    actionRow.innerHTML = `
      <button class="real-ghost" type="button" data-radial-reset="1">Reiniciar</button>
      <button class="real-action" type="button" data-radial-check="1">Verificar</button>
      <button class="real-action ${nextEnabled ? "" : "radial-disabled"}" type="button" data-radial-next="1" ${nextEnabled ? "" : "disabled"}>Siguiente nivel</button>
    `;

    bindBoard(board, state);
    bindActions(card, board, actionRow, state);
  }

  function bindBoard(board, state) {
    const list = board.querySelector("[data-radial-list]");
    list?.querySelectorAll(".radial-order-card").forEach((item) => {
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
    actionRow.querySelector("[data-radial-reset]")?.addEventListener("click", () => {
      state.order = shuffle(LEVELS[state.levelIndex].ordered);
      state.startedAt = Date.now();
      state.feedback = {
        type: "",
        title: "Nivel reiniciado",
        text: "Vuelve a ordenar las tarjetas desde arriba hacia abajo.",
      };
      saveState(state);
      renderGame(card, board, actionRow, state);
    });

    actionRow.querySelector("[data-radial-check]")?.addEventListener("click", () => {
      syncOrderFromDom(board.querySelector("[data-radial-list]"), state);
      const level = LEVELS[state.levelIndex];
      state.attempts[state.levelIndex] = (state.attempts[state.levelIndex] || 0) + 1;
      state.elapsed[state.levelIndex] = Math.round((Date.now() - state.startedAt) / 1000);
      const current = state.order.map((item) => item.text);
      const expected = level.ordered.map((item) => item.text);

      if (JSON.stringify(current) === JSON.stringify(expected)) {
        const firstTry = state.attempts[state.levelIndex] === 1;
        const basePoints = firstTry ? 10 : 5;
        const speedBonus = state.elapsed[state.levelIndex] <= 35 ? 5 : 0;
        const score = basePoints + speedBonus;
        const stars = firstTry && speedBonus ? 3 : firstTry ? 2 : 1;
        state.scores[state.levelIndex] = score;
        state.solved[state.levelIndex] = { score, stars };
        state.feedback = {
          type: "success",
          title: "¡Excelente! Orden correcto",
          text: `Has organizado correctamente el anuncio radial. Ganaste ${score} puntos y ${stars} estrella${stars > 1 ? "s" : ""}.`,
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
          title: "Sigue intentando",
          text: level.hint,
        };
        playTone("error");
      }

      saveState(state);
      renderGame(card, board, actionRow, state);
    });

    actionRow.querySelector("[data-radial-next]")?.addEventListener("click", () => {
      if ((state.attempts[state.levelIndex] || 0) === 0) return;
      if (state.levelIndex === LEVELS.length - 1) {
        state.finished = true;
      } else {
        state.levelIndex += 1;
        state.startedAt = Date.now();
        state.order = shuffle(LEVELS[state.levelIndex].ordered);
        state.feedback = {
          type: "",
          title: `Ahora vas a ${LEVELS[state.levelIndex].title}`,
          text: "Lee el nuevo anuncio, ordénalo y pulsa Verificar.",
        };
      }
      saveState(state);
      renderGame(card, board, actionRow, state);
    });

    board.querySelector("[data-radial-repeat]")?.addEventListener("click", () => {
      state.feedback = {
        type: "",
        title: "Instrucciones repetidas",
        text: "Primero va la llamada, luego la presentacion, despues la argumentacion y al final el cierre.",
      };
      saveState(state);
      renderGame(card, board, actionRow, state);
    });
  }

  function renderFinal(card, board, actionRow, state) {
    const points = totalPoints(state);
    const stars = totalStars(state);
    board.innerHTML = `
      <section class="radial-final-screen">
        <div class="radial-kicker">Juego completado</div>
        <h3>¡Terminaste Ordena la estructura del anuncio radial!</h3>
        <p>Puntuacion total: <strong>${points}</strong></p>
        <p>Insignias: <strong>${"★".repeat(Math.max(1, stars))}</strong></p>
        <p>${points >= 50 ? "Excelente trabajo. Ya identificas muy bien la estructura del anuncio radial." : "Buen esfuerzo. Sigue practicando para dominar cada parte del anuncio radial."}</p>
      </section>
    `;
    actionRow.innerHTML = `
      <button class="real-action" type="button" data-radial-replay="1">Volver a jugar</button>
      <button class="real-ghost" type="button" data-radial-done="1">Listo</button>
    `;

    actionRow.querySelector("[data-radial-replay]")?.addEventListener("click", () => {
      const nextState = freshState();
      ensureOrder(nextState);
      saveState(nextState);
      renderGame(card, board, actionRow, nextState);
    });

    actionRow.querySelector("[data-radial-done]")?.addEventListener("click", () => {
      location.reload();
    });
  }

  function syncOrderFromDom(list, state) {
    if (!list) return;
    const texts = [...list.querySelectorAll(".radial-order-card")].map((item) => item.dataset.orderText);
    const level = LEVELS[state.levelIndex];
    state.order = texts.map((text) => level.ordered.find((item) => item.text === text)).filter(Boolean);
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
        c: ["C1", "C2"],
        msg: "Ordenaste correctamente la estructura del anuncio radial por niveles.",
        topicId: "anuncio",
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {}
  }

  function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
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
        drop: [420, 0.04],
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
