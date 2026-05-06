(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const TARGET_GAME = "oda-1";
  const SESSION_KEY = "yoyo_rg_x";
  const PROGRESS_KEY = "yoyo_rg_p";
  const STATE_KEY = "yoyo_oda_order_state";

  const LEVELS = [
    {
      title: "Nivel 1",
      subtitle: "Estructura guiada",
      prompt: "Ordena la oda desde el inicio emotivo hasta el cierre final.",
      help: "Primero va la admiracion inicial, despues la descripcion, luego el lenguaje poetico y al final el cierre emotivo.",
      supports: true,
      choices: [],
      order: [
        { id: "l1-a", text: "Oh hermosa bicicleta...", part: "Inicio emotivo", color: "pink" },
        { id: "l1-b", text: "Eres veloz y brillante", part: "Desarrollo", color: "sky" },
        { id: "l1-c", text: "Corres como el viento", part: "Lenguaje poetico", color: "gold" },
        { id: "l1-d", text: "Por eso te admiro", part: "Cierre", color: "mint" }
      ]
    },
    {
      title: "Nivel 2",
      subtitle: "Menos ayudas",
      prompt: "Ordena los fragmentos pensando en como avanza la admiracion en la oda.",
      help: "La oda comienza expresando admiracion, luego describe cualidades, usa comparaciones poeticas y termina con una emocion final.",
      supports: false,
      choices: [],
      order: [
        { id: "l2-a", text: "Oh juguete querido...", part: "Inicio emotivo", color: "pink" },
        { id: "l2-b", text: "Eres silencioso y tranquilo", part: "Desarrollo", color: "sky" },
        { id: "l2-c", text: "Das paz como un susurro", part: "Lenguaje poetico", color: "gold" },
        { id: "l2-d", text: "Te prefiero siempre", part: "Cierre", color: "mint" }
      ]
    },
    {
      title: "Nivel 3",
      subtitle: "Reto con distractores",
      prompt: "Selecciona solo los fragmentos de una oda y ordenalos correctamente.",
      help: "Elige solo cuatro fragmentos que expresen admiracion y lenguaje poetico. Luego ordenalos desde el inicio emotivo hasta el cierre.",
      supports: false,
      choices: [
        { id: "l3-a", text: "Oh cometa luminosa...", part: "Inicio emotivo", color: "pink", correct: true },
        { id: "l3-b", text: "Eres libre, alta y elegante", part: "Desarrollo", color: "sky", correct: true },
        { id: "l3-c", text: "Brillas como un sueno en el cielo", part: "Lenguaje poetico", color: "gold", correct: true },
        { id: "l3-d", text: "Por eso mi corazon te celebra", part: "Cierre", color: "mint", correct: true },
        { id: "l3-x1", text: "La mesa es de madera", part: "Distractor", color: "stone", correct: false },
        { id: "l3-x2", text: "Hoy es lunes", part: "Distractor", color: "stone", correct: false }
      ],
      order: [
        { id: "l3-a", text: "Oh cometa luminosa...", part: "Inicio emotivo", color: "pink" },
        { id: "l3-b", text: "Eres libre, alta y elegante", part: "Desarrollo", color: "sky" },
        { id: "l3-c", text: "Brillas como un sueno en el cielo", part: "Lenguaje poetico", color: "gold" },
        { id: "l3-d", text: "Por eso mi corazon te celebra", part: "Cierre", color: "mint" }
      ]
    }
  ];

  let observerBound = false;
  let audioContext = null;

  function getStudentId() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      return session && session.role === "student" ? session.id : "guest";
    } catch {
      return "guest";
    }
  }

  function baseState() {
    return {
      introSeen: false,
      levelIndex: 0,
      arrangements: {},
      selected: {},
      reviewed: {},
      scores: {},
      stars: {},
      attempts: {},
      hints: {},
      feedback: null,
      finished: false
    };
  }

  function loadState() {
    try {
      const all = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
      return { ...baseState(), ...(all[getStudentId()] || {}) };
    } catch {
      return baseState();
    }
  }

  function clearLegacyProgress(state) {
    if (state.finished) return;
    const attempts = Object.values(state.attempts || {}).reduce((sum, value) => sum + Number(value || 0), 0);
    if (attempts > 0) return;
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      if (!session || !session.id) return;
      const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
      if (progress[session.id] && progress[session.id][TARGET_GAME]) {
        delete progress[session.id][TARGET_GAME];
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
      }
    } catch {}
  }

  function saveState(state) {
    try {
      const all = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
      all[getStudentId()] = state;
      localStorage.setItem(STATE_KEY, JSON.stringify(all));
    } catch {}
  }

  function ensureLevelState(state) {
    const level = LEVELS[state.levelIndex];
    if (!level) return;
    if (!state.arrangements[state.levelIndex]) state.arrangements[state.levelIndex] = shuffle(level.order);
    if (!state.selected[state.levelIndex]) state.selected[state.levelIndex] = [];
    state.reviewed[state.levelIndex] = Boolean(state.reviewed[state.levelIndex]);
    state.scores[state.levelIndex] = Number(state.scores[state.levelIndex] || 0);
    state.stars[state.levelIndex] = Number(state.stars[state.levelIndex] || 0);
    state.attempts[state.levelIndex] = Number(state.attempts[state.levelIndex] || 0);
    state.hints[state.levelIndex] = Number(state.hints[state.levelIndex] || 0);
  }

  function totalScore(state) {
    return Object.values(state.scores).reduce((sum, value) => sum + Number(value || 0), 0);
  }

  function totalStars(state) {
    return Object.values(state.stars).reduce((sum, value) => sum + Number(value || 0), 0);
  }

  function renameActivityCard() {
    app.querySelectorAll(`[data-oa="${TARGET_GAME}"]`).forEach((button) => {
      const heading = button.querySelector("h4");
      const copy = button.querySelector("p");
      if (heading && heading.textContent !== "1. Ordena la estructura de la oda") heading.textContent = "1. Ordena la estructura de la oda";
      if (copy && copy.textContent !== "Organiza la oda desde la admiracion inicial hasta el cierre emotivo.") copy.textContent = "Organiza la oda desde la admiracion inicial hasta el cierre emotivo.";
    });
  }

  function mount() {
    renameActivityCard();
    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    if (!card) return;
    if (card.dataset.odaOrderReady === "1") return;
    card.dataset.odaOrderReady = "1";
    clearLegacyFeedback(card);

    const title = card.querySelector(".play-top h3");
    const text = card.querySelector(".play-top .muted-main");
    if (title && title.textContent !== "1. Ordena la estructura de la oda") title.textContent = "1. Ordena la estructura de la oda";
    if (text && text.textContent !== "Comprende como se organiza una oda y ordena sus partes correctamente.") text.textContent = "Comprende como se organiza una oda y ordena sus partes correctamente.";

    const board = card.querySelector(".game-board");
    const actionRow = card.querySelector(".action-row");
    if (!board || !actionRow) return;

    const state = loadState();
    clearLegacyProgress(state);
    ensureLevelState(state);
    render(card, board, actionRow, state);
  }

  function render(card, board, actionRow, state) {
    clearLegacyFeedback(card);
    if (state.finished) {
      renderFinal(card, board, actionRow, state);
      return;
    }

    if (!state.introSeen) {
      renderIntro(card, board, actionRow, state);
      return;
    }

    ensureLevelState(state);
    const level = LEVELS[state.levelIndex];
    const items = getVisibleItems(state, level);
    const reviewed = Boolean(state.reviewed[state.levelIndex]);

    board.innerHTML = `
      <section class="oda-order-app">
        <div class="radial-fill-topbar">
          <article class="radial-fill-stat">
            <div class="radial-kicker">Progreso</div>
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
            <strong>${level.order.length} pasos</strong>
            <span>${reviewed ? "retroalimentacion lista" : "ordena y verifica"}</span>
          </article>
        </div>

        <section class="radial-fill-help">
          <div>
            <div class="radial-kicker">Como jugar</div>
            <p>${level.help}</p>
          </div>
          <button class="real-ghost" type="button" data-oda-repeat="1">Repetir instrucciones</button>
        </section>

        <section class="oda-order-stage">
          <div class="instruction-chip">${level.prompt}</div>
          ${level.supports ? `
            <div class="oda-structure-guides">
              ${["Inicio emotivo", "Desarrollo", "Lenguaje poetico", "Cierre"].map((item, index) => `
                <article class="oda-guide-card">
                  <strong>${index + 1}. ${item}</strong>
                </article>
              `).join("")}
            </div>
          ` : ""}
          ${level.choices.length ? `
            <section class="oda-select-panel">
              <div class="radial-kicker">Selecciona solo los fragmentos correctos</div>
              <div class="oda-choice-grid">
                ${level.choices.map((item) => {
                  const active = (state.selected[state.levelIndex] || []).includes(item.id);
                  return `<button class="oda-pick-card ${active ? "selected" : ""}" data-oda-pick="${item.id}" type="button">${item.text}</button>`;
                }).join("")}
              </div>
            </section>
          ` : ""}
          <div class="drag-strip-list oda-strip-list" data-oda-board="1">
            ${items.map((item, index) => `
              <div class="drag-strip oda-strip ${item.color}" draggable="true" data-oda-id="${item.id}">
                <span class="drag-num">${index + 1}</span>
                <div class="oda-strip-copy">
                  <strong>${level.supports ? item.part : "Fragmento"}</strong>
                  <span>${item.text}</span>
                </div>
              </div>
            `).join("")}
          </div>
        </section>

        <section class="radial-fill-feedback ${state.feedback && state.feedback.type ? state.feedback.type : ""}">
          <div class="radial-kicker">Retroalimentacion</div>
          <strong>${state.feedback ? state.feedback.title : "Ordena la oda desde la admiracion hasta el cierre."}</strong>
          <p>${state.feedback ? state.feedback.text : "Primero expresa admiracion, luego describe cualidades, incorpora lenguaje poetico y termina con una emocion final."}</p>
        </section>
      </section>
    `;

    actionRow.innerHTML = `
      <button class="real-ghost" type="button" data-oda-hint="1">Pista</button>
      <button class="real-ghost" type="button" data-oda-reset="1">Reintentar</button>
      <button class="real-action" type="button" data-oda-check="1">Verificar</button>
      <button class="real-action ${reviewed ? "" : "radial-disabled"}" type="button" data-oda-next="1" ${reviewed ? "" : "disabled"}>${state.levelIndex === LEVELS.length - 1 ? "Finalizar" : "Siguiente nivel"}</button>
    `;

    bindLevel(card, board, actionRow, state);
  }

  function renderIntro(card, board, actionRow, state) {
    board.innerHTML = `
      <section class="oda-order-intro">
        <div class="radial-kicker">Estructura de la oda</div>
        <h3>Antes de jugar, observa como se organiza una oda</h3>
        <p>La oda expresa admiracion, describe cualidades, usa lenguaje poetico y termina con una emocion final.</p>
        <div class="oda-structure-grid">
          <article class="oda-structure-card pink"><strong>1. Inicio emotivo</strong><span>Expresa admiracion.</span></article>
          <article class="oda-structure-card sky"><strong>2. Desarrollo</strong><span>Describe cualidades.</span></article>
          <article class="oda-structure-card gold"><strong>3. Lenguaje poetico</strong><span>Usa metaforas y comparaciones.</span></article>
          <article class="oda-structure-card mint"><strong>4. Cierre</strong><span>Expresion final de emocion.</span></article>
        </div>
      </section>
    `;

    actionRow.innerHTML = `<button class="real-action" type="button" data-oda-start="1">Comenzar</button>`;
    const startButton = actionRow.querySelector("[data-oda-start]");
    if (startButton) {
      startButton.addEventListener("click", () => {
        state.introSeen = true;
        saveState(state);
        render(card, board, actionRow, state);
      });
    }
  }

  function getVisibleItems(state, level) {
    if (!level.choices.length) return state.arrangements[state.levelIndex] || [];
    const selectedIds = state.selected[state.levelIndex] || [];
    const selected = selectedIds.map((id) => level.order.find((item) => item.id === id)).filter(Boolean);
    if (selected.length && !sameIdList(state.arrangements[state.levelIndex] || [], selected)) {
      state.arrangements[state.levelIndex] = selected;
    }
    return state.arrangements[state.levelIndex] || [];
  }

  function bindLevel(card, board, actionRow, state) {
    const level = LEVELS[state.levelIndex];
    let dragged = null;

    board.querySelectorAll("[data-oda-id]").forEach((item) => {
      item.addEventListener("dragstart", () => {
        dragged = item;
        item.classList.add("dragging");
        playTone("move");
      });
      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        dragged = null;
      });
      item.addEventListener("dragover", (event) => event.preventDefault());
      item.addEventListener("drop", (event) => {
        event.preventDefault();
        if (!dragged || dragged === item) return;
        reorderItems(state, dragged.dataset.odaId, item.dataset.odaId, level);
        saveState(state);
        render(card, board, actionRow, state);
      });
    });

    board.querySelectorAll("[data-oda-pick]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.odaPick;
        const current = state.selected[state.levelIndex] || [];
        state.selected[state.levelIndex] = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
        state.reviewed[state.levelIndex] = false;
        saveState(state);
        render(card, board, actionRow, state);
      });
    });

    const repeatButton = board.querySelector("[data-oda-repeat]");
    if (repeatButton) {
      repeatButton.addEventListener("click", () => {
        state.feedback = { type: "", title: "Instrucciones repetidas", text: level.help };
        saveState(state);
        render(card, board, actionRow, state);
      });
    }

    const hintButton = actionRow.querySelector("[data-oda-hint]");
    if (hintButton) {
      hintButton.addEventListener("click", () => {
        state.hints[state.levelIndex] = (state.hints[state.levelIndex] || 0) + 1;
        state.feedback = { type: "", title: "Pista activada", text: "Recuerda la secuencia: admiracion inicial, descripcion, lenguaje poetico y cierre emotivo." };
        playTone("move");
        saveState(state);
        render(card, board, actionRow, state);
      });
    }

    const resetButton = actionRow.querySelector("[data-oda-reset]");
    if (resetButton) {
      resetButton.addEventListener("click", () => {
        state.arrangements[state.levelIndex] = shuffle(level.order);
        state.selected[state.levelIndex] = [];
        state.reviewed[state.levelIndex] = false;
        state.feedback = { type: "", title: "Nivel reiniciado", text: "Vuelve a ordenar las partes de la oda con calma." };
        saveState(state);
        render(card, board, actionRow, state);
      });
    }

    const checkButton = actionRow.querySelector("[data-oda-check]");
    if (checkButton) {
      checkButton.addEventListener("click", () => {
        verifyLevel(state, level);
        saveState(state);
        render(card, board, actionRow, state);
      });
    }

    const nextButton = actionRow.querySelector("[data-oda-next]");
    if (nextButton) {
      nextButton.addEventListener("click", () => {
        if (!state.reviewed[state.levelIndex]) return;
        if (state.levelIndex === LEVELS.length - 1) {
          state.finished = true;
          persistPlatformSuccess();
          saveState(state);
          render(card, board, actionRow, state);
          return;
        }
        state.levelIndex += 1;
        ensureLevelState(state);
        state.feedback = { type: "", title: `Ahora vas a ${LEVELS[state.levelIndex].title}`, text: LEVELS[state.levelIndex].help };
        saveState(state);
        render(card, board, actionRow, state);
      });
    }
  }

  function reorderItems(state, draggedId, targetId, level) {
    const current = [...getVisibleItems(state, level)];
    const draggedIndex = current.findIndex((item) => item.id === draggedId);
    const targetIndex = current.findIndex((item) => item.id === targetId);
    if (draggedIndex < 0 || targetIndex < 0) return;
    const moved = current.splice(draggedIndex, 1)[0];
    current.splice(targetIndex, 0, moved);
    state.arrangements[state.levelIndex] = current;
  }

  function verifyLevel(state, level) {
    const current = getVisibleItems(state, level);
    const attempts = (state.attempts[state.levelIndex] || 0) + 1;
    const hintPenalty = (state.hints[state.levelIndex] || 0) > 0 ? 5 : 0;
    const correctIds = level.order.map((item) => item.id);
    const currentIds = current.map((item) => item.id);
    const selectedIds = state.selected[state.levelIndex] || [];
    const correctSelected = level.choices.length ? level.choices.filter((item) => item.correct && selectedIds.includes(item.id)).length : level.order.length;
    const wrongSelected = level.choices.length ? level.choices.filter((item) => !item.correct && selectedIds.includes(item.id)).length : 0;
    const orderHits = currentIds.reduce((sum, id, index) => sum + (id === correctIds[index] ? 1 : 0), 0);
    const orderCorrect = currentIds.length === correctIds.length && currentIds.every((id, index) => id === correctIds[index]);
    const selectionCorrect = level.choices.length ? correctSelected === level.order.length && wrongSelected === 0 : true;

    state.attempts[state.levelIndex] = attempts;
    state.reviewed[state.levelIndex] = true;

    let score = 0;
    if (orderCorrect && selectionCorrect) {
      score = Math.max(0, 10 + (attempts === 1 ? 5 : 0) - hintPenalty);
      state.stars[state.levelIndex] = attempts === 1 && !hintPenalty ? 3 : 2;
      state.feedback = {
        type: "success",
        title: "Estructura correcta",
        text: "Logro: organizaste correctamente la oda. Siguiente paso: explica cual fragmento expresa admiracion y cual usa lenguaje poetico. Pregunta para pensar: como cambia la emocion del texto cuando el cierre queda al final?"
      };
      playTone("success");
    } else {
      score = Math.max(0, orderHits * 2 + correctSelected * 2 - wrongSelected * 2 - 5 - hintPenalty);
      state.stars[state.levelIndex] = orderHits >= 2 || correctSelected >= 2 ? 1 : 0;
      state.feedback = {
        type: "error",
        title: "Retroalimentacion del nivel",
        text: `Logro: colocaste ${orderHits} posiciones correctas${level.choices.length ? ` y seleccionaste ${correctSelected} fragmentos adecuados` : ""}. Para mejorar: revisa si la oda empieza con admiracion, luego describe cualidades, usa una comparacion poetica y termina con emocion final. Pregunta para pensar: que fragmento muestra mejor el lenguaje poetico?`
      };
      playTone("error");
    }

    state.scores[state.levelIndex] = Math.max(Number(state.scores[state.levelIndex] || 0), score);
  }

  function renderFinal(card, board, actionRow, state) {
    board.innerHTML = `
      <section class="radial-final-screen oda-final-screen">
        <div class="radial-kicker">Juego completado</div>
        <h3>Terminaste Ordena la estructura de la oda</h3>
        <p>Puntuacion total: <strong>${totalScore(state)}</strong></p>
        <p>Estrellas acumuladas: <strong>${"★".repeat(Math.max(1, totalStars(state) || 1))}</strong></p>
        <p>${totalScore(state) >= 35 ? "Excelente. Ya reconoces como se organiza una oda y como transmite admiracion con lenguaje poetico." : "Buen trabajo. Ya identificas las partes de la oda y puedes seguir reforzando el lenguaje poetico."}</p>
      </section>
    `;

    actionRow.innerHTML = `
      <button class="real-action" type="button" data-oda-replay="1">Volver a jugar</button>
      <button class="real-ghost" type="button" data-oda-close="1">Listo</button>
    `;

    const replayButton = actionRow.querySelector("[data-oda-replay]");
    if (replayButton) {
      replayButton.addEventListener("click", () => {
        const next = baseState();
        saveState(next);
        const nextBoard = card.querySelector(".game-board");
        const nextActionRow = card.querySelector(".action-row");
        render(card, nextBoard, nextActionRow, next);
      });
    }

    const closeButton = actionRow.querySelector("[data-oda-close]");
    if (closeButton) {
      closeButton.addEventListener("click", () => window.location.reload());
    }
  }

  function clearLegacyFeedback(card) {
    card.querySelectorAll(".radial-feedback").forEach((node) => node.remove());
  }

  function persistPlatformSuccess() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      if (!session || !session.id) return;
      const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
      progress[session.id] = progress[session.id] || {};
      progress[session.id][TARGET_GAME] = {
        ok: true,
        score: Math.min(10, Math.max(6, Math.round(totalScore(loadState()) / 3))),
        c: ["C1", "C2"],
        msg: "Organizaste la estructura de la oda y reconociste su lenguaje poetico.",
        topicId: "oda"
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {}
  }

  function playTone(type) {
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const preset = { move: [430, 0.05], success: [640, 0.08], error: [220, 0.08] }[type] || [430, 0.05];
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.frequency.value = preset[0];
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + preset[1]);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + preset[1]);
    } catch {}
  }

  function sameIdList(listA, listB) {
    if (listA.length !== listB.length) return false;
    return listA.every((item, index) => item && listB[index] && item.id === listB[index].id);
  }

  function shuffle(list) {
    const clone = [...list];
    for (let index = clone.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [clone[index], clone[swap]] = [clone[swap], clone[index]];
    }
    return clone;
  }

  function ensureObserver() {
    if (observerBound) return;
    observerBound = true;
    const observer = new MutationObserver(() => mount());
    observer.observe(app, { childList: true, subtree: true });
  }

  ensureObserver();
  mount();
})();
