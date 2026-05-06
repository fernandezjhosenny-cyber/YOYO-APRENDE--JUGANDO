(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const TARGET_GAME = "oda-3";
  const SESSION_KEY = "yoyo_rg_x";
  const PROGRESS_KEY = "yoyo_rg_p";
  const STATE_KEY = "yoyo_oda_classify_state";

  const ZONES = [
    { key: "comparacion", title: "Verde: Comparacion", tone: "#22c55e", soft: "linear-gradient(180deg,#ecfdf5,#dcfce7)", clue: "Usa como para comparar." },
    { key: "metafora", title: "Azul: Metafora", tone: "#3b82f6", soft: "linear-gradient(180deg,#eff6ff,#dbeafe)", clue: "Dice que una cosa es otra." },
    { key: "personificacion", title: "Amarillo: Personificacion", tone: "#f59e0b", soft: "linear-gradient(180deg,#fff7ed,#fef3c7)", clue: "Da acciones humanas a objetos o elementos." },
    { key: "hiperbole", title: "Morado: Hiperbole", tone: "#8b5cf6", soft: "linear-gradient(180deg,#f5f3ff,#ede9fe)", clue: "Exagera para expresar una emocion fuerte." },
  ];

  const LEVELS = [
    { title: "Nivel 1", subtitle: "Figuras claras", intro: true, hint: "Busca si la expresion compara, transforma, da vida o exagera.", phrases: [
      { text: "Eres veloz como el viento.", zone: "comparacion" },
      { text: "Tu risa es musica.", zone: "metafora" },
      { text: "La bicicleta canta en el camino.", zone: "personificacion" },
      { text: "Te quiero mas que todo el universo.", zone: "hiperbole" },
    ]},
    { title: "Nivel 2", subtitle: "Mas lenguaje poetico", intro: false, hint: "Analiza la intencion de cada verso y la imagen poetica que crea.", phrases: [
      { text: "Tus ruedas giran como alas de luz.", zone: "comparacion" },
      { text: "Eres un rayo sobre la tierra.", zone: "metafora" },
      { text: "El sol abraza mi bicicleta.", zone: "personificacion" },
      { text: "Tu belleza llena todo el cielo.", zone: "hiperbole" },
      { text: "Tus petalos son estrellas.", zone: "metafora" },
      { text: "Corres como rio alegre.", zone: "comparacion" },
    ]},
    { title: "Nivel 3", subtitle: "Interpretacion poetica", intro: false, hint: "Piensa en el sentido figurado de cada expresion antes de clasificarla.", phrases: [
      { text: "El sol se desgranaba como maiz ardiendo.", zone: "comparacion" },
      { text: "Las bicicletas eran insectos transparentes.", zone: "metafora" },
      { text: "La tarde me llamo con su voz dorada.", zone: "personificacion" },
      { text: "Tu silencio calma mil tormentas.", zone: "hiperbole" },
      { text: "Oh juguete querido, me hablas desde la memoria.", zone: "personificacion" },
      { text: "Eres fuego pequeno que ilumina mi infancia.", zone: "metafora" },
      { text: "Tu recuerdo pesa como una montana.", zone: "comparacion" },
      { text: "Tu luz despierta al mundo entero.", zone: "hiperbole" },
    ]},
  ];

  let observerBound = false;
  let draggedPhrase = null;
  let audioContext = null;

  function getStudentId() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      return session && session.role === "student" ? session.id : "guest";
    } catch {
      return "guest";
    }
  }
  function baseState() { return { introSeen: false, levelIndex: 0, attempts: {}, scores: {}, stars: {}, hints: {}, placements: {}, feedback: null, finished: false }; }
  function loadState() { try { const all = JSON.parse(localStorage.getItem(STATE_KEY) || "{}"); return all[getStudentId()] || baseState(); } catch { return baseState(); } }
  function saveState(state) { try { const all = JSON.parse(localStorage.getItem(STATE_KEY) || "{}"); all[getStudentId()] = state; localStorage.setItem(STATE_KEY, JSON.stringify(all)); } catch {} }
  function clearLegacyProgress(state) { if (state.finished) return; const attempts = Object.values(state.attempts || {}).reduce((sum, value) => sum + Number(value || 0), 0); if (attempts > 0) return; try { const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); if (!session || !session.id) return; const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); if (progress[session.id] && progress[session.id][TARGET_GAME]) { delete progress[session.id][TARGET_GAME]; localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); } } catch {} }
  function ensureLevelState(state) { const level = LEVELS[state.levelIndex]; state.placements[state.levelIndex] = state.placements[state.levelIndex] || {}; state.attempts[state.levelIndex] = Number(state.attempts[state.levelIndex] || 0); state.scores[state.levelIndex] = Number(state.scores[state.levelIndex] || 0); state.stars[state.levelIndex] = Number(state.stars[state.levelIndex] || 0); state.hints[state.levelIndex] = Number(state.hints[state.levelIndex] || 0); level.phrases.forEach((phrase) => { if (typeof state.placements[state.levelIndex][phrase.text] !== "string") state.placements[state.levelIndex][phrase.text] = ""; }); }
  function totalScore(state) { return Object.values(state.scores).reduce((sum, value) => sum + Number(value || 0), 0); }
  function totalStars(state) { return Object.values(state.stars).reduce((sum, value) => sum + Number(value || 0), 0); }

  function renameActivityCard() {
    app.querySelectorAll(`[data-oa="${TARGET_GAME}"]`).forEach((button) => {
      const heading = button.querySelector("h4");
      const copy = button.querySelector("p");
      if (heading && heading.textContent !== "3. Clasifica por colores") heading.textContent = "3. Clasifica por colores";
      if (copy && copy.textContent !== "Clasifica versos de la oda segun la figura literaria que contienen.") copy.textContent = "Clasifica versos de la oda segun la figura literaria que contienen.";
    });
  }

  function mount() {
    renameActivityCard();
    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    if (!card || card.dataset.odaClassifyReady === "1") return;
    card.dataset.odaClassifyReady = "1";
    clearLegacyFeedback(card);
    const title = card.querySelector(".play-top h3");
    const text = card.querySelector(".play-top .muted-main");
    if (title && title.textContent !== "3. Clasifica por colores") title.textContent = "3. Clasifica por colores";
    if (text && text.textContent !== "Reconoce comparacion, metafora, personificacion e hiperbole dentro de la oda.") text.textContent = "Reconoce comparacion, metafora, personificacion e hiperbole dentro de la oda.";
    const board = card.querySelector(".game-board");
    const actionRow = card.querySelector(".action-row");
    if (!board || !actionRow) return;
    const state = loadState(); clearLegacyProgress(state); ensureLevelState(state); saveState(state); render(card, board, actionRow, state);
  }

  function render(card, board, actionRow, state) {
    clearLegacyFeedback(card);
    if (state.finished) return renderFinal(card, board, actionRow, state);
    if (LEVELS[state.levelIndex].intro && !state.introSeen) return renderIntro(card, board, actionRow, state);
    const level = LEVELS[state.levelIndex];
    const placements = state.placements[state.levelIndex];
    const reviewed = (state.attempts[state.levelIndex] || 0) > 0;
    board.innerHTML = `
      <section class="radial-classify-app" style="grid-column:1/-1;width:100%">
        <div class="radial-fill-topbar">
          <article class="radial-fill-stat"><div class="radial-kicker">Nivel</div><strong>${level.title}</strong><span>${level.subtitle}</span></article>
          <article class="radial-fill-stat"><div class="radial-kicker">Puntos acumulados</div><strong>${totalScore(state)}</strong><span>${"★".repeat(Math.max(1, totalStars(state) || 1))}</span></article>
          <article class="radial-fill-stat"><div class="radial-kicker">Meta</div><strong>${level.phrases.length} tarjetas</strong><span>lenguaje figurado</span></article>
        </div>
        <section class="radial-fill-help"><div><div class="radial-kicker">Como jugar</div><p>Lee cada verso y arrastralo a la figura literaria correcta. Piensa si compara, exagera, transforma o da vida.</p></div><button class="real-ghost" type="button" data-oda-classify-repeat="1">Repetir instrucciones</button></section>
        <section class="radial-classify-stage" style="grid-column:1/-1;width:100%"><div class="instruction-chip">Clasifica por colores las figuras literarias de la oda</div><div class="radial-classify-zones" style="grid-template-columns:repeat(4,minmax(0,1fr));width:100%">${ZONES.map((zone) => `<article class="zone radial-classify-zone" data-oda-zone="${zone.key}" style="--zone-tone:${zone.tone};--zone-soft:${zone.soft};min-height:320px;"><h4>${zone.title}</h4><div class="zone-items">${level.phrases.filter((phrase) => placements[phrase.text] === zone.key).map((phrase) => renderToken(phrase.text)).join("")}</div></article>`).join("")}</div><div class="classify-bank radial-classify-bank" data-oda-bank="1" style="grid-template-columns:repeat(4,minmax(0,1fr));width:100%">${level.phrases.filter((phrase) => !placements[phrase.text]).map((phrase) => renderToken(phrase.text)).join("")}</div></section>
        <section class="radial-fill-feedback ${state.feedback && state.feedback.type ? state.feedback.type : ""}"><div class="radial-kicker">Retroalimentacion</div><strong>${state.feedback ? state.feedback.title : "Clasifica cada tarjeta segun la figura literaria que contiene."}</strong><p>${state.feedback ? state.feedback.text : level.hint}</p></section>
      </section>`;
    actionRow.innerHTML = `<button class="real-ghost" type="button" data-oda-classify-hint="1">Pista</button><button class="real-ghost" type="button" data-oda-classify-reset="1">Reintentar</button><button class="real-action" type="button" data-oda-classify-check="1">Verificar</button><button class="real-action ${reviewed ? "" : "radial-disabled"}" type="button" data-oda-classify-next="1" ${reviewed ? "" : "disabled"}>${state.levelIndex === LEVELS.length - 1 ? "Finalizar" : "Siguiente nivel"}</button>`;
    bindBoard(card, board, actionRow, state);
  }

  function renderIntro(card, board, actionRow, state) {
    board.innerHTML = `<section class="oda-order-intro"><div class="radial-kicker">Figuras literarias</div><h3>Antes de jugar, recuerda estas pistas</h3><div class="oda-structure-grid">${ZONES.map((zone) => `<article class="oda-structure-card"><strong>${zone.title}</strong><span>${zone.clue}</span></article>`).join("")}</div></section>`;
    actionRow.innerHTML = `<button class="real-action" type="button" data-oda-classify-start="1">Comenzar</button>`;
    actionRow.querySelector("[data-oda-classify-start]")?.addEventListener("click", () => { state.introSeen = true; saveState(state); render(card, board, actionRow, state); });
  }

  function bindBoard(card, board, actionRow, state) {
    board.querySelectorAll("[data-oda-token]").forEach((token) => {
      token.addEventListener("dragstart", () => { draggedPhrase = token; token.classList.add("dragging"); playTone("move"); });
      token.addEventListener("dragend", () => { token.classList.remove("dragging"); draggedPhrase = null; });
      token.addEventListener("click", () => { state.placements[state.levelIndex][token.dataset.odaToken] = ""; saveState(state); render(card, board, actionRow, state); });
    });
    board.querySelectorAll("[data-oda-zone]").forEach((zone) => {
      zone.addEventListener("dragover", (event) => event.preventDefault());
      zone.addEventListener("drop", (event) => { event.preventDefault(); if (!draggedPhrase) return; state.placements[state.levelIndex][draggedPhrase.dataset.odaToken] = zone.dataset.odaZone; saveState(state); render(card, board, actionRow, state); });
    });
    board.querySelector("[data-oda-bank]")?.addEventListener("dragover", (event) => event.preventDefault());
    board.querySelector("[data-oda-bank]")?.addEventListener("drop", (event) => { event.preventDefault(); if (!draggedPhrase) return; state.placements[state.levelIndex][draggedPhrase.dataset.odaToken] = ""; saveState(state); render(card, board, actionRow, state); });
    board.querySelector("[data-oda-classify-repeat]")?.addEventListener("click", () => { state.feedback = { type: "", title: "Instrucciones repetidas", text: LEVELS[state.levelIndex].hint }; saveState(state); render(card, board, actionRow, state); });
    actionRow.querySelector("[data-oda-classify-hint]")?.addEventListener("click", () => { state.hints[state.levelIndex] = (state.hints[state.levelIndex] || 0) + 1; state.feedback = { type: "", title: "Pista activada", text: "Comparacion usa como, metafora transforma, personificacion da acciones humanas e hiperbole exagera." }; saveState(state); playTone("move"); render(card, board, actionRow, state); });
    actionRow.querySelector("[data-oda-classify-reset]")?.addEventListener("click", () => { Object.keys(state.placements[state.levelIndex]).forEach((key) => { state.placements[state.levelIndex][key] = ""; }); state.attempts[state.levelIndex] = 0; state.feedback = { type: "", title: "Nivel reiniciado", text: "Vuelve a clasificar los versos con calma." }; saveState(state); render(card, board, actionRow, state); });
    actionRow.querySelector("[data-oda-classify-check]")?.addEventListener("click", () => { verifyLevel(state); saveState(state); render(card, board, actionRow, state); });
    actionRow.querySelector("[data-oda-classify-next]")?.addEventListener("click", () => { if (!(state.attempts[state.levelIndex] > 0)) return; if (state.levelIndex === LEVELS.length - 1) { state.finished = true; persistPlatformSuccess(state); saveState(state); render(card, board, actionRow, state); return; } state.levelIndex += 1; ensureLevelState(state); state.feedback = { type: "", title: `Ahora vas a ${LEVELS[state.levelIndex].title}`, text: LEVELS[state.levelIndex].hint }; saveState(state); render(card, board, actionRow, state); });
  }

  function verifyLevel(state) {
    const level = LEVELS[state.levelIndex];
    const placements = state.placements[state.levelIndex];
    const attempts = (state.attempts[state.levelIndex] || 0) + 1;
    let correct = 0; let wrong = 0;
    level.phrases.forEach((phrase) => { if (!placements[phrase.text]) return; if (placements[phrase.text] === phrase.zone) correct += 1; else wrong += 1; });
    const missing = level.phrases.length - correct - wrong;
    const hintPenalty = (state.hints[state.levelIndex] || 0) > 0 ? 5 : 0;
    const bonus = wrong === 0 && missing === 0 ? 5 : 0;
    const score = Math.max(0, correct * 10 - wrong * 5 - hintPenalty + bonus);
    state.attempts[state.levelIndex] = attempts;
    state.scores[state.levelIndex] = Math.max(Number(state.scores[state.levelIndex] || 0), score);
    state.stars[state.levelIndex] = wrong === 0 && missing === 0 ? 3 : correct >= Math.ceil(level.phrases.length / 2) ? 2 : 1;
    if (wrong === 0 && missing === 0) { state.feedback = { type: "success", title: "Clasificacion correcta", text: "Logro: reconociste las figuras literarias de la oda. Siguiente paso: explica por que un verso es comparacion y otro es metafora. Pregunta para pensar: que figura te ayuda mas a expresar admiracion?" }; playTone("success"); }
    else { state.feedback = { type: "error", title: "Retroalimentacion del nivel", text: `Logro: clasificaste ${correct} tarjetas correctamente. Para mejorar: revisa si el verso compara con como, exagera, da vida o transforma una imagen. Pregunta para pensar: cual palabra del verso te da la pista principal?` }; playTone("error"); }
  }

  function renderToken(text) { return `<div class="zone-token" draggable="true" data-oda-token="${escapeHtml(text)}">${escapeHtml(text)}</div>`; }
  function renderFinal(card, board, actionRow, state) { board.innerHTML = `<section class="radial-final-screen oda-final-screen"><div class="radial-kicker">Juego completado</div><h3>Terminaste Clasifica por colores</h3><p>Puntuacion total: <strong>${totalScore(state)}</strong></p><p>Estrellas acumuladas: <strong>${"★".repeat(Math.max(1, totalStars(state) || 1))}</strong></p><p>Ya fortaleciste la interpretacion del lenguaje figurado dentro de la oda.</p></section>`; actionRow.innerHTML = `<button class="real-action" type="button" data-oda-classify-replay="1">Volver a jugar</button><button class="real-ghost" type="button" data-oda-classify-close="1">Listo</button>`; actionRow.querySelector("[data-oda-classify-replay]")?.addEventListener("click", () => { const next = baseState(); saveState(next); render(card, card.querySelector(".game-board"), card.querySelector(".action-row"), next); }); actionRow.querySelector("[data-oda-classify-close]")?.addEventListener("click", () => window.location.reload()); }
  function clearLegacyFeedback(card) { card.querySelectorAll(".radial-feedback").forEach((node) => node.remove()); }
  function persistPlatformSuccess(state) { try { const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); if (!session || !session.id) return; const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); progress[session.id] = progress[session.id] || {}; progress[session.id][TARGET_GAME] = { ok: true, score: Math.min(10, Math.max(6, Math.round(totalScore(state) / LEVELS.length))), c: ["C1", "C2"], msg: "Clasificaste versos de la oda segun sus figuras literarias.", topicId: "oda" }; localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); } catch {} }
  function playTone(type) { try { audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)(); const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain(); const tone = { move: [420, 0.05], success: [650, 0.08], error: [220, 0.08] }[type] || [420, 0.05]; oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.frequency.value = tone[0]; gain.gain.setValueAtTime(0.0001, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.01); gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + tone[1]); oscillator.start(audioContext.currentTime); oscillator.stop(audioContext.currentTime + tone[1]); } catch {} }
  function escapeHtml(text) { return String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
  function ensureObserver() { if (observerBound) return; observerBound = true; const observer = new MutationObserver(() => mount()); observer.observe(app, { childList: true, subtree: true }); }
  ensureObserver();
  mount();
})();
