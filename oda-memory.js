(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const TARGET_GAME = "oda-4";
  const SESSION_KEY = "yoyo_rg_x";
  const PROGRESS_KEY = "yoyo_rg_p";
  const STATE_KEY = "yoyo_oda_memory_state";

  const LEVELS = [
    { title: "Nivel 1", subtitle: "Fragmento y significado", theme: "Comprension basica", help: "Destapa un fragmento y busca su significado o su funcion dentro de la oda.", pairs: [
      ["Oh hermosa bicicleta", "Admiracion por la bicicleta"],
      ["Corres como el viento", "Se mueve muy rapido"],
      ["Brillas bajo el sol", "Se destaca con belleza"],
      ["Por eso te admiro", "Cierre emotivo de la oda"],
    ]},
    { title: "Nivel 2", subtitle: "Figura y ejemplo", theme: "Recursos literarios", help: "Relaciona el nombre del recurso con el ejemplo que aparece en la oda.", pairs: [
      ["Comparacion", "Eres veloz como el viento"],
      ["Metafora", "Eres un rayo brillante"],
      ["Personificacion", "La bicicleta canta"],
      ["Hiperbole", "Tu luz llena todo el cielo"],
      ["Adjetivacion", "Hermosa, veloz y brillante"],
    ]},
    { title: "Nivel 3", subtitle: "Interpretacion poetica", theme: "Sentido profundo", help: "Relaciona cada fragmento inspirado en una oda con su interpretacion.", pairs: [
      ["El sol se desgranaba como maiz ardiendo", "El sol brillaba con mucho calor"],
      ["Las bicicletas eran insectos transparentes", "Las bicicletas parecian ligeras y veloces"],
      ["Juguetes silenciosos, grandes anorados", "Se extranan los juguetes tranquilos"],
      ["Voces de robot y musicas metalizadas", "Critica a los juguetes ruidosos"],
      ["Tu silencio calma mi corazon", "El silencio produce paz"],
      ["Oh flor pequena, perfume de alegria", "Se alaba la belleza y aroma de la flor"],
    ]},
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

  function buildCards(levelIndex) {
    const level = LEVELS[levelIndex];
    return shuffle(level.pairs.flatMap((pair, pairIndex) => [
      { id: `${levelIndex}-${pairIndex}-a`, pairId: `${levelIndex}-${pairIndex}`, label: pair[0], accent: "violet" },
      { id: `${levelIndex}-${pairIndex}-b`, pairId: `${levelIndex}-${pairIndex}`, label: pair[1], accent: "sky" },
    ]));
  }

  function baseState() { return { levelIndex: 0, selected: [], matched: {}, attempts: {}, scores: {}, stars: {}, hints: {}, feedback: null, cards: {}, finished: false }; }
  function loadState() { try { const all = JSON.parse(localStorage.getItem(STATE_KEY) || "{}"); return all[getStudentId()] || baseState(); } catch { return baseState(); } }
  function saveState(state) { try { const all = JSON.parse(localStorage.getItem(STATE_KEY) || "{}"); all[getStudentId()] = state; localStorage.setItem(STATE_KEY, JSON.stringify(all)); } catch {} }
  function clearLegacyProgress(state) { if (state.finished) return; const attempts = Object.values(state.attempts || {}).reduce((sum, value) => sum + Number(value || 0), 0); if (attempts > 0) return; try { const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); if (!session || !session.id) return; const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); if (progress[session.id] && progress[session.id][TARGET_GAME]) { delete progress[session.id][TARGET_GAME]; localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); } } catch {} }
  function ensureLevelState(state) { const level = LEVELS[state.levelIndex]; if (!level) return; state.matched[state.levelIndex] = state.matched[state.levelIndex] || []; state.attempts[state.levelIndex] = Number(state.attempts[state.levelIndex] || 0); state.scores[state.levelIndex] = Number(state.scores[state.levelIndex] || 0); state.stars[state.levelIndex] = Number(state.stars[state.levelIndex] || 0); state.hints[state.levelIndex] = Number(state.hints[state.levelIndex] || 0); state.cards[state.levelIndex] = state.cards[state.levelIndex] || buildCards(state.levelIndex); }
  function totalScore(state) { return Object.values(state.scores).reduce((sum, value) => sum + Number(value || 0), 0); }
  function totalStars(state) { return Object.values(state.stars).reduce((sum, value) => sum + Number(value || 0), 0); }

  function renameActivityCard() {
    app.querySelectorAll(`[data-oa="${TARGET_GAME}"]`).forEach((button) => {
      const heading = button.querySelector("h4");
      const copy = button.querySelector("p");
      if (heading && heading.textContent !== "4. Memoria visual") heading.textContent = "4. Memoria visual";
      if (copy && copy.textContent !== "Relaciona fragmentos poeticos, significados, emociones y recursos de la oda.") copy.textContent = "Relaciona fragmentos poeticos, significados, emociones y recursos de la oda.";
    });
  }

  function mount() {
    renameActivityCard();
    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    if (!card || card.dataset.odaMemoryReady === "1") return;
    card.dataset.odaMemoryReady = "1";
    clearLegacyFeedback(card);
    queueLegacyFeedbackCleanup(card);
    const title = card.querySelector(".play-top h3");
    const text = card.querySelector(".play-top .muted-main");
    if (title && title.textContent !== "4. Memoria visual") title.textContent = "4. Memoria visual";
    if (text && text.textContent !== "Encuentra pares relacionados con la oda, sus significados, emociones y recursos poeticos.") text.textContent = "Encuentra pares relacionados con la oda, sus significados, emociones y recursos poeticos.";
    const board = card.querySelector(".game-board");
    const actionRow = card.querySelector(".action-row");
    if (!board || !actionRow) return;
    const state = loadState(); clearLegacyProgress(state); ensureLevelState(state); saveState(state); render(card, board, actionRow, state);
  }

  function render(card, board, actionRow, state) {
    clearLegacyFeedback(card);
    queueLegacyFeedbackCleanup(card);
    if (state.finished) return renderFinal(card, board, actionRow, state);
    ensureLevelState(state);
    const level = LEVELS[state.levelIndex];
    const cards = state.cards[state.levelIndex];
    const matched = new Set(state.matched[state.levelIndex]);
    const selected = state.selected;
    const reviewed = matched.size === level.pairs.length || (state.attempts[state.levelIndex] || 0) > 0;
    board.innerHTML = `
      <section class="radial-memory-app">
        <div class="radial-fill-topbar">
          <article class="radial-fill-stat"><div class="radial-kicker">Progreso</div><strong>${level.title}</strong><span>${level.theme}</span></article>
          <article class="radial-fill-stat"><div class="radial-kicker">Puntos acumulados</div><strong>${totalScore(state)}</strong><span>${"★".repeat(Math.max(1, totalStars(state) || 1))}</span></article>
          <article class="radial-fill-stat"><div class="radial-kicker">Intentos</div><strong>${state.attempts[state.levelIndex] || 0}</strong><span>${matched.size}/${level.pairs.length} pares</span></article>
        </div>
        <section class="radial-fill-help"><div><div class="radial-kicker">Como jugar</div><p>Destapa dos tarjetas. Si el fragmento, la emocion o el significado se relacionan, la pareja queda visible. Si no coincide, ambas tarjetas se voltean nuevamente.</p></div><button class="real-ghost" type="button" data-oda-memory-repeat="1">Repetir instrucciones</button></section>
        <section class="radial-memory-status"><div class="instruction-chip">Encuentra pares relacionados con la oda</div><div class="radial-memory-badges"><span class="status-badge">Nivel: ${level.subtitle}</span><span class="status-badge">Pares hallados: ${matched.size}</span><span class="status-badge">Poesia visual</span></div></section>
        <div class="radial-memory-grid">${cards.map((item) => { const visible = matched.has(item.pairId) || selected.includes(item.id); const stateClass = matched.has(item.pairId) ? "matched correct" : selected.includes(item.id) ? "revealed" : "hidden"; return `<button class="memory-card radial-memory-card ${stateClass} ${item.accent}" data-oda-memory-id="${item.id}" data-oda-memory-pair="${item.pairId}" type="button"><span class="memory-face memory-front">?</span><span class="memory-face memory-back">${visible ? escapeHtml(item.label) : ""}</span></button>`; }).join("")}</div>
        <section class="radial-fill-feedback ${state.feedback && state.feedback.type ? state.feedback.type : ""}"><div class="radial-kicker">Retroalimentacion</div><strong>${state.feedback ? state.feedback.title : "Relaciona fragmentos poeticos, significados y emociones de la oda."}</strong><p>${state.feedback ? state.feedback.text : level.help}</p></section>
      </section>`;
    actionRow.innerHTML = `<button class="real-ghost" type="button" data-oda-memory-hint="1">Pista</button><button class="real-ghost" type="button" data-oda-memory-reset="1">Reiniciar</button><button class="real-action" type="button" data-oda-memory-check="1">Verificar</button><button class="real-action ${reviewed ? "" : "radial-disabled"}" type="button" data-oda-memory-next="1" ${reviewed ? "" : "disabled"}>${state.levelIndex === LEVELS.length - 1 ? "Finalizar" : "Siguiente nivel"}</button>`;
    bindBoard(card, board, actionRow, state);
  }

  function bindBoard(card, board, actionRow, state) {
    board.querySelectorAll("[data-oda-memory-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const level = LEVELS[state.levelIndex];
        const matched = new Set(state.matched[state.levelIndex]);
        const cardId = button.dataset.odaMemoryId;
        const pairId = button.dataset.odaMemoryPair;
        if (matched.has(pairId) || state.selected.includes(cardId) || state.selected.length === 2) return;
        state.selected = [...state.selected, cardId];
        state.feedback = { type: "", title: "Tarjetas reveladas", text: "Observa si ambas ideas se relacionan por significado, recurso o emocion." };
        playTone("flip");
        saveState(state);
        render(card, board, actionRow, state);
        if (state.selected.length === 2) {
          const [firstId, secondId] = state.selected;
          const cards = state.cards[state.levelIndex];
          const firstCard = cards.find((item) => item.id === firstId);
          const secondCard = cards.find((item) => item.id === secondId);
          state.attempts[state.levelIndex] = (state.attempts[state.levelIndex] || 0) + 1;
          if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
            state.matched[state.levelIndex] = [...state.matched[state.levelIndex], firstCard.pairId];
            state.selected = [];
            state.feedback = { type: "success", title: "Par correcto", text: "Logro: encontraste una relacion importante de la oda. Siguiente paso: explica por que estas dos tarjetas se corresponden." };
            playTone("success");
            if (state.matched[state.levelIndex].length === level.pairs.length) {
              const attempts = state.attempts[state.levelIndex];
              const hintPenalty = (state.hints[state.levelIndex] || 0) > 0 ? 5 : 0;
              const score = Math.max(0, level.pairs.length * 10 - Math.max(0, attempts - level.pairs.length) * 5 - hintPenalty + 5);
              state.scores[state.levelIndex] = Math.max(Number(state.scores[state.levelIndex] || 0), score);
              state.stars[state.levelIndex] = attempts <= level.pairs.length + 1 ? 3 : attempts <= level.pairs.length + 3 ? 2 : 1;
            }
            saveState(state);
            setTimeout(() => render(card, board, actionRow, state), 300);
          } else {
            state.feedback = { type: "error", title: "Par incorrecto", text: "Estas dos tarjetas no expresan la misma idea. Vuelve a observar el significado, la figura o la emocion." };
            playTone("error");
            saveState(state);
            setTimeout(() => { state.selected = []; saveState(state); render(card, board, actionRow, state); }, 700);
          }
        }
      });
    });
    board.querySelector("[data-oda-memory-repeat]")?.addEventListener("click", () => { state.feedback = { type: "", title: "Instrucciones repetidas", text: LEVELS[state.levelIndex].help }; saveState(state); render(card, board, actionRow, state); });
    actionRow.querySelector("[data-oda-memory-hint]")?.addEventListener("click", () => { state.hints[state.levelIndex] = (state.hints[state.levelIndex] || 0) + 1; state.feedback = { type: "", title: "Pista activada", text: "Busca una tarjeta que nombre el recurso o sentimiento y otra que explique su significado o ejemplo." }; saveState(state); playTone("flip"); render(card, board, actionRow, state); });
    actionRow.querySelector("[data-oda-memory-reset]")?.addEventListener("click", () => { state.selected = []; state.matched[state.levelIndex] = []; state.attempts[state.levelIndex] = 0; state.cards[state.levelIndex] = buildCards(state.levelIndex); state.feedback = { type: "", title: "Nivel reiniciado", text: "Vuelve a buscar los pares con calma." }; saveState(state); render(card, board, actionRow, state); });
    actionRow.querySelector("[data-oda-memory-check]")?.addEventListener("click", () => { const level = LEVELS[state.levelIndex]; const matched = state.matched[state.levelIndex].length; state.feedback = matched === level.pairs.length ? { type: "success", title: "Nivel completado", text: "Logro: encontraste todos los pares. Siguiente paso: explica que relacion te costo mas identificar." } : { type: "error", title: "Revision del nivel", text: `Llevas ${matched} pares correctos. Sigue observando el sentido de cada fragmento y su interpretacion.` }; saveState(state); render(card, board, actionRow, state); });
    actionRow.querySelector("[data-oda-memory-next]")?.addEventListener("click", () => { const level = LEVELS[state.levelIndex]; const reviewed = state.matched[state.levelIndex].length === level.pairs.length || (state.attempts[state.levelIndex] || 0) > 0; if (!reviewed) return; if (state.levelIndex === LEVELS.length - 1) { state.finished = true; persistPlatformSuccess(state); saveState(state); render(card, board, actionRow, state); return; } state.levelIndex += 1; ensureLevelState(state); state.selected = []; state.feedback = { type: "", title: `Ahora vas a ${LEVELS[state.levelIndex].title}`, text: LEVELS[state.levelIndex].help }; saveState(state); render(card, board, actionRow, state); });
  }

  function renderFinal(card, board, actionRow, state) { board.innerHTML = `<section class="radial-final-screen oda-final-screen"><div class="radial-kicker">Juego completado</div><h3>Terminaste Memoria visual</h3><p>Puntuacion total: <strong>${totalScore(state)}</strong></p><p>Estrellas acumuladas: <strong>${"★".repeat(Math.max(1, totalStars(state) || 1))}</strong></p><p>Ya fortaleciste la comprension poetica, la memoria y la interpretacion de la oda.</p></section>`; actionRow.innerHTML = `<button class="real-action" type="button" data-oda-memory-replay="1">Volver a jugar</button><button class="real-ghost" type="button" data-oda-memory-close="1">Listo</button>`; actionRow.querySelector("[data-oda-memory-replay]")?.addEventListener("click", () => { const next = baseState(); saveState(next); render(card, card.querySelector(".game-board"), card.querySelector(".action-row"), next); }); actionRow.querySelector("[data-oda-memory-close]")?.addEventListener("click", () => window.location.reload()); }
  function clearLegacyFeedback(card) {
    card.querySelectorAll(".radial-feedback").forEach((node) => {
      node.innerHTML = "";
      node.style.display = "none";
      node.remove();
    });
  }
  function queueLegacyFeedbackCleanup(card) {
    requestAnimationFrame(() => clearLegacyFeedback(card));
    setTimeout(() => clearLegacyFeedback(card), 0);
    setTimeout(() => clearLegacyFeedback(card), 120);
  }
  function persistPlatformSuccess(state) { try { const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); if (!session || !session.id) return; const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); progress[session.id] = progress[session.id] || {}; progress[session.id][TARGET_GAME] = { ok: true, score: Math.min(10, Math.max(6, Math.round(totalScore(state) / LEVELS.length))), c: ["C1", "C2"], msg: "Relacionaste fragmentos, significados y recursos de la oda.", topicId: "oda" }; localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); } catch {} }
  function playTone(type) { try { audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)(); const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain(); const tone = { flip: [420, 0.05], success: [640, 0.08], error: [220, 0.08] }[type] || [420, 0.05]; oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.frequency.value = tone[0]; gain.gain.setValueAtTime(0.0001, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.01); gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + tone[1]); oscillator.start(audioContext.currentTime); oscillator.stop(audioContext.currentTime + tone[1]); } catch {} }
  function shuffle(list) { const clone = [...list]; for (let index = clone.length - 1; index > 0; index -= 1) { const swap = Math.floor(Math.random() * (index + 1)); [clone[index], clone[swap]] = [clone[swap], clone[index]]; } return clone; }
  function escapeHtml(text) { return String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
  function ensureObserver() { if (observerBound) return; observerBound = true; const observer = new MutationObserver(() => mount()); observer.observe(app, { childList: true, subtree: true }); }
  ensureObserver();
  mount();
})();
