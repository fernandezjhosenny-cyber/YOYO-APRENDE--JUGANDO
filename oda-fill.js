(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const TARGET_GAME = "oda-2";
  const SESSION_KEY = "yoyo_rg_x";
  const PROGRESS_KEY = "yoyo_rg_p";
  const STATE_KEY = "yoyo_oda_fill_state";

  const LEVELS = [
    {
      title: "Nivel 1",
      subtitle: "Oda guiada",
      hint: "Usa palabras de admiracion y una comparacion sencilla.",
      supports: true,
      segments: ["Oh hermosa ", "__0__", " Eres tan ", "__1__", " como el viento Brillas bajo el ", "__2__", " ardiente Por eso te ", "__3__", " tanto"],
      answers: ["bicicleta", "veloz", "sol", "admiro"],
      options: ["bicicleta", "veloz", "sol", "admiro"],
    },
    {
      title: "Nivel 2",
      subtitle: "Mas analisis",
      hint: "Elige solo palabras que mantengan un sentido poetico y expresen alabanza.",
      supports: false,
      segments: ["Oh dulce ", "__0__", " Eres tan ", "__1__", " como la brisa Tu aroma llena el ", "__2__", " Por eso te ", "__3__", " siempre"],
      answers: ["flor", "suave", "aire", "prefiero"],
      options: ["flor", "viento", "suave", "fuerte", "aire", "mesa", "prefiero", "rompo"],
    },
    {
      title: "Nivel 3",
      subtitle: "Sentido figurado",
      hint: "Busca palabras coherentes con una oda y con imagenes poeticas.",
      supports: false,
      segments: ["Oh querido ", "__0__", " Eres un ", "__1__", " brillante Iluminas mi ", "__2__", " Como un ", "__3__", " eterno"],
      answers: ["sol", "fuego", "camino", "sueno"],
      options: ["sol", "libro", "fuego", "piedra", "camino", "silla", "sueno", "ruido"],
    },
  ];

  let dragChip = null;
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
    return { levelIndex: 0, placements: {}, attempts: {}, scores: {}, stars: {}, hints: {}, feedback: null, finished: false };
  }

  function loadState() {
    try {
      const all = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
      return all[getStudentId()] || baseState();
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
    state.placements[state.levelIndex] = state.placements[state.levelIndex] || {};
    state.hints[state.levelIndex] = Number(state.hints[state.levelIndex] || 0);
    state.attempts[state.levelIndex] = Number(state.attempts[state.levelIndex] || 0);
    state.scores[state.levelIndex] = Number(state.scores[state.levelIndex] || 0);
    state.stars[state.levelIndex] = Number(state.stars[state.levelIndex] || 0);
    level.answers.forEach((_, index) => {
      if (typeof state.placements[state.levelIndex][index] !== "string") state.placements[state.levelIndex][index] = "";
    });
  }

  function totalScore(state) { return Object.values(state.scores).reduce((sum, value) => sum + Number(value || 0), 0); }
  function totalStars(state) { return Object.values(state.stars).reduce((sum, value) => sum + Number(value || 0), 0); }

  function renameActivityCard() {
    app.querySelectorAll(`[data-oa="${TARGET_GAME}"]`).forEach((button) => {
      const heading = button.querySelector("h4");
      const copy = button.querySelector("p");
      if (heading && heading.textContent !== "2. Completa con arrastre") heading.textContent = "2. Completa con arrastre";
      if (copy && copy.textContent !== "Completa versos de la oda con palabras poeticas y coherentes.") copy.textContent = "Completa versos de la oda con palabras poeticas y coherentes.";
    });
  }

  function mount() {
    renameActivityCard();
    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    if (!card || card.dataset.odaFillReady === "1") return;
    card.dataset.odaFillReady = "1";
    clearLegacyFeedback(card);
    const title = card.querySelector(".play-top h3");
    const text = card.querySelector(".play-top .muted-main");
    if (title && title.textContent !== "2. Completa con arrastre") title.textContent = "2. Completa con arrastre";
    if (text && text.textContent !== "Completa versos de una oda usando adjetivos, comparaciones y expresiones emocionales.") text.textContent = "Completa versos de una oda usando adjetivos, comparaciones y expresiones emocionales.";
    const board = card.querySelector(".game-board");
    const actionRow = card.querySelector(".action-row");
    if (!board || !actionRow) return;
    const state = loadState();
    clearLegacyProgress(state);
    ensureLevelState(state);
    saveState(state);
    render(card, board, actionRow, state);
  }

  function render(card, board, actionRow, state) {
    clearLegacyFeedback(card);
    if (state.finished) return renderFinal(card, board, actionRow, state);
    const level = LEVELS[state.levelIndex];
    const placements = state.placements[state.levelIndex];
    const reviewed = (state.attempts[state.levelIndex] || 0) > 0;
    const usedWords = new Set(Object.values(placements).filter(Boolean));
    board.innerHTML = `
      <section class="radial-fill-app">
        <div class="radial-fill-topbar">
          <article class="radial-fill-stat"><div class="radial-kicker">Nivel</div><strong>${level.title}</strong><span>${level.subtitle}</span></article>
          <article class="radial-fill-stat"><div class="radial-kicker">Puntos acumulados</div><strong>${totalScore(state)}</strong><span>${"★".repeat(Math.max(1, totalStars(state) || 1))}</span></article>
          <article class="radial-fill-stat"><div class="radial-kicker">Meta</div><strong>${state.levelIndex + 1}/${LEVELS.length}</strong><span>versos completos</span></article>
        </div>
        <section class="radial-fill-help"><div><div class="radial-kicker">Como jugar</div><p>Arrastra las palabras del banco hacia los espacios vacios. Elige palabras poeticas, coherentes y llenas de admiracion.</p></div><button class="real-ghost" type="button" data-oda-fill-repeat="1">Repetir instrucciones</button></section>
        <section class="radial-fill-stage oda-fill-stage-wide">
          <div class="instruction-chip">Completa la oda con palabras poeticas y expresiones de emocion</div>
          ${level.supports ? `<div class="oda-structure-guides"><article class="oda-guide-card"><strong>1. Objeto admirado</strong></article><article class="oda-guide-card"><strong>2. Cualidad</strong></article><article class="oda-guide-card"><strong>3. Imagen poetica</strong></article><article class="oda-guide-card"><strong>4. Emocion final</strong></article></div>` : ""}
          <div class="oda-fill-layout">
            <div class="radial-fill-text oda-fill-text">${renderSentence(level, placements)}</div>
            <aside class="oda-fill-bank-panel">
              <div class="radial-kicker">Banco de palabras</div>
              <div class="radial-fill-bank">${level.options.map((word) => `<button class="radial-fill-chip ${usedWords.has(word) ? "used" : ""}" draggable="${usedWords.has(word) ? "false" : "true"}" data-fill-word="${escapeHtml(word)}" type="button" ${usedWords.has(word) ? "disabled" : ""}>${word}</button>`).join("")}</div>
            </aside>
          </div>
        </section>
        <section class="radial-fill-feedback ${state.feedback && state.feedback.type ? state.feedback.type : ""}"><div class="radial-kicker">Retroalimentacion</div><strong>${state.feedback ? state.feedback.title : "Completa los versos con palabras que expresen alabanza, belleza y emocion."}</strong><p>${state.feedback ? state.feedback.text : level.hint}</p></section>
      </section>`;
    actionRow.innerHTML = `<button class="real-ghost" type="button" data-oda-fill-hint="1">Pista</button><button class="real-ghost" type="button" data-oda-fill-retry="1">Reintentar</button><button class="real-action" type="button" data-oda-fill-check="1">Verificar</button><button class="real-action ${reviewed ? "" : "radial-disabled"}" type="button" data-oda-fill-next="1" ${reviewed ? "" : "disabled"}>${state.levelIndex === LEVELS.length - 1 ? "Finalizar" : "Siguiente nivel"}</button>`;
    bindBoard(board, state);
    bindActions(card, board, actionRow, state);
  }

  function renderSentence(level, placements) {
    let slotIndex = -1;
    return level.segments.map((segment) => {
      if (!segment.startsWith("__")) return `<span>${segment}</span>`;
      slotIndex += 1;
      const value = placements[slotIndex] || "";
      return `<button class="radial-fill-slot ${value ? "filled" : ""}" type="button" data-fill-slot="${slotIndex}">${value || "Arrastra aqui"}</button>`;
    }).join("");
  }

  function bindBoard(board, state) {
    board.querySelectorAll("[data-fill-word]").forEach((chip) => {
      chip.addEventListener("dragstart", () => { dragChip = chip; chip.classList.add("dragging"); playTone("drag"); });
      chip.addEventListener("dragend", () => { chip.classList.remove("dragging"); dragChip = null; });
      chip.addEventListener("click", () => {
        const empty = [...board.querySelectorAll("[data-fill-slot]")].find((slot) => slot.textContent === "Arrastra aqui");
        if (empty) fillSlot(empty, chip.dataset.fillWord, state, board);
      });
    });
    board.querySelectorAll("[data-fill-slot]").forEach((slot) => {
      slot.addEventListener("dragover", (event) => event.preventDefault());
      slot.addEventListener("drop", (event) => { event.preventDefault(); if (!dragChip) return; fillSlot(slot, dragChip.dataset.fillWord, state, board); });
      slot.addEventListener("click", () => {
        const index = Number(slot.dataset.fillSlot);
        if (!state.placements[state.levelIndex][index]) return;
        state.placements[state.levelIndex][index] = "";
        saveState(state);
        const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
        render(card, card.querySelector(".game-board"), card.querySelector(".action-row"), state);
      });
    });
  }

  function bindActions(card, board, actionRow, state) {
    board.querySelector("[data-oda-fill-repeat]")?.addEventListener("click", () => { const level = LEVELS[state.levelIndex]; state.feedback = { type: "", title: "Instrucciones repetidas", text: level.hint }; saveState(state); render(card, board, actionRow, state); });
    actionRow.querySelector("[data-oda-fill-hint]")?.addEventListener("click", () => { const level = LEVELS[state.levelIndex]; state.hints[state.levelIndex] = (state.hints[state.levelIndex] || 0) + 1; state.feedback = { type: "", title: "Pista activada", text: level.hint }; saveState(state); playTone("drag"); render(card, board, actionRow, state); });
    actionRow.querySelector("[data-oda-fill-retry]")?.addEventListener("click", () => {
      Object.keys(state.placements[state.levelIndex]).forEach((key) => { state.placements[state.levelIndex][key] = ""; });
      state.attempts[state.levelIndex] = 0;
      state.feedback = { type: "", title: "Nivel reiniciado", text: "Vuelve a completar los versos con calma y sentido poetico." };
      saveState(state);
      render(card, board, actionRow, state);
    });
    actionRow.querySelector("[data-oda-fill-check]")?.addEventListener("click", () => { verifyLevel(state); saveState(state); render(card, board, actionRow, state); });
    actionRow.querySelector("[data-oda-fill-next]")?.addEventListener("click", () => {
      if (!(state.attempts[state.levelIndex] > 0)) return;
      if (state.levelIndex === LEVELS.length - 1) { state.finished = true; persistPlatformSuccess(state); saveState(state); render(card, board, actionRow, state); return; }
      state.levelIndex += 1; ensureLevelState(state); state.feedback = { type: "", title: `Ahora vas a ${LEVELS[state.levelIndex].title}`, text: LEVELS[state.levelIndex].hint }; saveState(state); render(card, board, actionRow, state);
    });
  }

  function fillSlot(slot, word, state, board) {
    const index = Number(slot.dataset.fillSlot);
    state.placements[state.levelIndex][index] = word;
    saveState(state);
    playTone("drag");
    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    render(card, board, card.querySelector(".action-row"), state);
  }

  function verifyLevel(state) {
    const level = LEVELS[state.levelIndex];
    const placements = state.placements[state.levelIndex];
    const attempts = (state.attempts[state.levelIndex] || 0) + 1;
    let correct = 0;
    level.answers.forEach((answer, index) => { if ((placements[index] || "") === answer) correct += 1; });
    const errors = level.answers.length - correct;
    const hintPenalty = (state.hints[state.levelIndex] || 0) > 0 ? 5 : 0;
    const bonus = errors === 0 ? 5 : 0;
    const score = Math.max(0, correct * 10 - errors * 5 - hintPenalty + bonus);
    state.attempts[state.levelIndex] = attempts;
    state.scores[state.levelIndex] = Math.max(Number(state.scores[state.levelIndex] || 0), score);
    state.stars[state.levelIndex] = errors === 0 ? 3 : correct >= 2 ? 2 : 1;
    if (errors === 0) {
      state.feedback = { type: "success", title: "Versos completos", text: "Logro: completaste la oda con coherencia y lenguaje poetico. Siguiente paso: explica que palabras expresan admiracion y cuales crean una imagen poetica. Pregunta para pensar: por que estas palabras hacen que el verso suene mas emotivo?" };
      playTone("success");
    } else {
      state.feedback = { type: "error", title: "Retroalimentacion del nivel", text: `Logro: completaste ${correct} espacios correctamente. Para mejorar: elige palabras que mantengan admiracion, belleza y sentido figurado. Pregunta para pensar: que opcion rompe el tono poetico de la oda?` };
      playTone("error");
    }
  }

  function renderFinal(card, board, actionRow, state) {
    board.innerHTML = `<section class="radial-final-screen oda-final-screen"><div class="radial-kicker">Juego completado</div><h3>Terminaste Completa con arrastre</h3><p>Puntuacion total: <strong>${totalScore(state)}</strong></p><p>Estrellas acumuladas: <strong>${"★".repeat(Math.max(1, totalStars(state) || 1))}</strong></p><p>Ya fortaleciste el uso de adjetivos, comparaciones y expresiones emocionales dentro de la oda.</p></section>`;
    actionRow.innerHTML = `<button class="real-action" type="button" data-oda-fill-replay="1">Volver a jugar</button><button class="real-ghost" type="button" data-oda-fill-close="1">Listo</button>`;
    actionRow.querySelector("[data-oda-fill-replay]")?.addEventListener("click", () => { const next = baseState(); saveState(next); render(card, card.querySelector(".game-board"), card.querySelector(".action-row"), next); });
    actionRow.querySelector("[data-oda-fill-close]")?.addEventListener("click", () => window.location.reload());
  }

  function clearLegacyFeedback(card) {
    card.querySelectorAll(".radial-feedback").forEach((node) => node.remove());
  }

  function persistPlatformSuccess(state) {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      if (!session || !session.id) return;
      const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
      progress[session.id] = progress[session.id] || {};
      progress[session.id][TARGET_GAME] = { ok: true, score: Math.min(10, Math.max(6, Math.round(totalScore(state) / LEVELS.length))), c: ["C1","C2"], msg: "Completaste versos de una oda con coherencia y lenguaje poetico.", topicId: "oda" };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {}
  }

  function playTone(type) {
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const tone = { drag: [420, 0.04], success: [620, 0.08], error: [220, 0.08] }[type] || [420, 0.04];
      oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.frequency.value = tone[0]; gain.gain.setValueAtTime(0.0001, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.01); gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + tone[1]); oscillator.start(audioContext.currentTime); oscillator.stop(audioContext.currentTime + tone[1]);
    } catch {}
  }

  function escapeHtml(text) { return String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
  function ensureObserver() { if (observerBound) return; observerBound = true; const observer = new MutationObserver(() => mount()); observer.observe(app, { childList: true, subtree: true }); }
  ensureObserver();
  mount();
})();
