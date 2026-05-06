(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const TARGET_GAME = "oda-9";
  const SESSION_KEY = "yoyo_rg_x";
  const PROGRESS_KEY = "yoyo_rg_p";

  const LEVELS = [
    {
      title: "Nivel 1",
      subtitle: "Basico",
      hint: "Primero piensa que vas a alabar. Luego describe sus cualidades y escribe tu poema.",
      steps: [
        "Elegir que voy a alabar",
        "Pensar por que me gusta",
        "Escribir cualidades",
        "Crear versos simples",
        "Leer mi oda"
      ]
    },
    {
      title: "Nivel 2",
      subtitle: "Escritura poetica",
      hint: "Primero eliges el objeto o la persona. Despues agregas cualidades y lenguaje poetico.",
      steps: [
        "Elegir objeto o persona",
        "Escribir cualidades",
        "Usar adjetivos",
        "Agregar comparacion",
        "Escribir la oda",
        "Revisar"
      ]
    },
    {
      title: "Nivel 3",
      subtitle: "Recital creativo",
      hint: "Cuando la oda esta lista, practica la lectura y mejora tu expresion antes de presentarla.",
      steps: [
        "Terminar la oda",
        "Practicar lectura",
        "Mejorar entonacion",
        "Usar gestos",
        "Ensayar",
        "Presentar la oda"
      ]
    }
  ];

  let observerBound = false;

  function renameActivityCard() {
    app.querySelectorAll(`[data-oa="${TARGET_GAME}"]`).forEach((button) => {
      const heading = button.querySelector("h4");
      const copy = button.querySelector("p");
      if (heading && heading.textContent !== "9. Linea del tiempo") {
        heading.textContent = "9. Linea del tiempo";
      }
      if (copy && copy.textContent !== "Ordena los pasos para crear una oda.") {
        copy.textContent = "Ordena los pasos para crear una oda.";
      }
    });
  }

  function clearLegacyFeedback(card) {
    card.querySelectorAll(".radial-feedback").forEach((node) => node.remove());
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function getSessionId() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      return session && session.id ? session.id : null;
    } catch {
      return null;
    }
  }

  function totalScore(state) {
    return state.scores.reduce((sum, value) => sum + value, 0);
  }

  function persistProgress(state) {
    try {
      const studentId = getSessionId();
      if (!studentId) return;
      const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
      progress[studentId] = progress[studentId] || {};
      progress[studentId][TARGET_GAME] = {
        ok: state.finished,
        score: Math.max(1, Math.min(10, Math.round(totalScore(state) / 18))),
        c: ["C1", "C2"],
        msg: "Ordenaste los pasos para crear una oda.",
        topicId: "oda"
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {}
  }

  function baseState() {
    return {
      levelIndex: 0,
      selectedStep: "",
      placed: [[], [], []],
      bank: [null, null, null],
      scores: [0, 0, 0],
      hints: [0, 0, 0],
      checked: false,
      finished: false,
      feedback: {
        type: "",
        title: "Ordena la linea del tiempo",
        text: "Selecciona un paso y colocalo en el siguiente espacio del camino."
      }
    };
  }

  function ensureBank(state) {
    if (!state.bank[state.levelIndex]) {
      state.bank[state.levelIndex] = shuffle(LEVELS[state.levelIndex].steps);
    }
    return state.bank[state.levelIndex];
  }

  function mount() {
    renameActivityCard();
    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    if (!card || card.dataset.oda9SimpleReady === "1") return;
    card.dataset.oda9SimpleReady = "1";

    const title = card.querySelector(".play-top h3");
    const text = card.querySelector(".play-top .muted-main");
    const board = card.querySelector(".game-board");
    const actionRow = card.querySelector(".action-row");
    if (!board || !actionRow) return;

    if (title && title.textContent !== "9. Linea del tiempo") {
      title.textContent = "9. Linea del tiempo";
    }
    if (text && text.textContent !== "Ordena los pasos para crear una oda de forma clara y creativa.") {
      text.textContent = "Ordena los pasos para crear una oda de forma clara y creativa.";
    }

    clearLegacyFeedback(card);
    card._oda9State = baseState();
    render(card, board, actionRow);
  }

  function render(card, board, actionRow) {
    clearLegacyFeedback(card);
    const state = card._oda9State || baseState();
    card._oda9State = state;

    if (state.finished) {
      renderFinal(card, board, actionRow, state);
      return;
    }

    const level = LEVELS[state.levelIndex];
    const bank = ensureBank(state);
    const placed = state.placed[state.levelIndex] || [];
    const orderedComplete = placed.length === level.steps.length;

    board.innerHTML = `
      <section class="radial-timeline-app oda-timeline-app">
        <div class="radial-fill-topbar">
          <article class="radial-fill-stat">
            <div class="radial-kicker">Nivel</div>
            <strong>${level.title}</strong>
            <span>${level.subtitle}</span>
          </article>
          <article class="radial-fill-stat">
            <div class="radial-kicker">Puntaje</div>
            <strong>${totalScore(state)}</strong>
            <span>+10 por paso correcto</span>
          </article>
          <article class="radial-fill-stat">
            <div class="radial-kicker">Meta</div>
            <strong>${placed.length}/${level.steps.length}</strong>
            <span>pasos colocados</span>
          </article>
        </div>

        <section class="radial-fill-help">
          <div>
            <div class="radial-kicker">Como jugar</div>
            <p>${level.hint}</p>
          </div>
          <button class="real-ghost" type="button" data-oda9-hint="1">Pista</button>
        </section>

        <section class="radial-timeline-board oda-timeline-board-simple">
          <div class="instruction-chip">Selecciona las tarjetas y ordenalas en la linea del tiempo</div>

          <div class="oda-timeline-track">
            ${level.steps.map((step, index) => `
              <div class="oda-timeline-node ${placed[index] ? "filled" : ""}">
                <span class="oda-timeline-index">${index + 1}</span>
                <div class="oda-timeline-slot">${placed[index] || "Paso " + (index + 1)}</div>
              </div>
              ${index < level.steps.length - 1 ? '<span class="oda-timeline-arrow">→</span>' : ''}
            `).join("")}
          </div>

          <div class="oda-timeline-bank-title">
            <span></span>
            <strong>Tarjetas disponibles</strong>
            <span></span>
          </div>

          <div class="oda-timeline-bank">
            ${bank.map((step, index) => {
              const used = placed.includes(step);
              return `
                <button class="oda-timeline-card tone-${index % 5} ${state.selectedStep === step ? "selected" : ""} ${used ? "used" : ""}" type="button" data-oda9-step="${step}" ${used || state.checked ? "disabled" : ""}>
                  ${step}
                </button>`;
            }).join("")}
          </div>
        </section>

        <section class="radial-fill-feedback ${state.feedback.type || ""}">
          <div class="radial-kicker">Retroalimentacion</div>
          <strong>${state.feedback.title}</strong>
          <p>${state.feedback.text}</p>
        </section>
      </section>`;

    actionRow.innerHTML = `
      <button class="real-ghost" type="button" data-oda9-reset="1">Reintentar</button>
      <button class="real-action" type="button" data-oda9-check="1" ${placed.length > 0 && !state.checked ? "" : "disabled"}>Verificar</button>
      <button class="real-action ${state.checked ? "" : "radial-disabled"}" type="button" data-oda9-next="1" ${state.checked ? "" : "disabled"}>${state.levelIndex === LEVELS.length - 1 ? "Finalizar" : "Siguiente nivel"}</button>`;

    bind(card, board, actionRow, orderedComplete);
  }

  function renderFinal(card, board, actionRow, state) {
    const score = totalScore(state);
    const result = score >= 150 ? "Excelente" : score >= 90 ? "Aprobado" : "Necesita mejorar";
    board.innerHTML = `
      <section class="radial-final-screen radial-timeline-final">
        <div class="radial-kicker">Actividad completada</div>
        <h3>Terminaste Linea del tiempo</h3>
        <p>Puntuacion total: <strong>${score}</strong></p>
        <p><strong>${result}</strong></p>
      </section>`;

    actionRow.innerHTML = `
      <button class="real-action" type="button" data-oda9-replay="1">Volver a jugar</button>`;

    actionRow.querySelector("[data-oda9-replay]")?.addEventListener("click", () => {
      card._oda9State = baseState();
      render(card, card.querySelector(".game-board"), actionRow);
    });
  }

  function bind(card, board, actionRow, orderedComplete) {
    const state = card._oda9State;
    const level = LEVELS[state.levelIndex];
    const placed = state.placed[state.levelIndex] || [];

    board.querySelectorAll("[data-oda9-step]").forEach((button) => {
      button.addEventListener("click", () => {
        if (state.checked) return;
        const step = button.dataset.oda9Step;
        if (placed.includes(step)) return;

        if (state.selectedStep === step) {
          state.selectedStep = "";
        } else {
          state.selectedStep = step;
          if (placed.length < level.steps.length) {
            state.placed[state.levelIndex] = [...placed, step];
            state.selectedStep = "";
            state.feedback = {
              type: "",
              title: "Paso colocado",
              text: "Muy bien. Sigue completando la linea del tiempo."
            };
          }
        }
        render(card, card.querySelector(".game-board"), actionRow);
      });
    });

    actionRow.querySelector("[data-oda9-hint]")?.addEventListener("click", () => {
      state.hints[state.levelIndex] += 1;
      state.feedback = {
        type: "",
        title: "Pista activada",
        text: level.hint
      };
      render(card, card.querySelector(".game-board"), actionRow);
    });

    actionRow.querySelector("[data-oda9-reset]")?.addEventListener("click", () => {
      state.selectedStep = "";
      state.checked = false;
      state.placed[state.levelIndex] = [];
      state.bank[state.levelIndex] = shuffle(level.steps);
      state.feedback = {
        type: "",
        title: "Nivel reiniciado",
        text: "Vuelve a ordenar los pasos con calma."
      };
      render(card, card.querySelector(".game-board"), actionRow);
    });

    actionRow.querySelector("[data-oda9-check]")?.addEventListener("click", () => {
      const current = state.placed[state.levelIndex] || [];
      const hits = current.reduce((sum, item, index) => sum + (item === level.steps[index] ? 1 : 0), 0);
      const wrong = current.length - hits;
      let score = Math.max(0, hits * 10 - wrong * 5 - ((state.hints[state.levelIndex] || 0) > 0 ? 5 : 0));
      if (hits === level.steps.length) score += 5;
      state.scores[state.levelIndex] = Math.max(Number(state.scores[state.levelIndex] || 0), score);
      state.checked = true;
      state.feedback = hits === level.steps.length
        ? {
            type: "success",
            title: "Orden correcto",
            text: "Muy bien. Ordenaste correctamente los pasos para crear la oda."
          }
        : {
            type: "error",
            title: "Necesita ajuste",
            text: `Tienes ${hits} pasos en el lugar correcto. Revisa el orden del proceso poetico.`
          };
      persistProgress(state);
      render(card, card.querySelector(".game-board"), actionRow);
    });

    actionRow.querySelector("[data-oda9-next]")?.addEventListener("click", () => {
      if (!state.checked) return;
      if (state.levelIndex === LEVELS.length - 1) {
        state.finished = true;
      } else {
        state.levelIndex += 1;
        state.selectedStep = "";
        state.checked = false;
        state.feedback = {
          type: "",
          title: "Siguiente nivel",
          text: "Ahora vas a ordenar un proceso mas avanzado de la oda."
        };
      }
      persistProgress(state);
      render(card, card.querySelector(".game-board"), actionRow);
    });
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
