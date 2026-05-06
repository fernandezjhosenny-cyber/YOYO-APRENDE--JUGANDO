(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const TARGET_GAME = "anuncio-10";
  const SESSION_KEY = "yoyo_rg_x";
  const PROGRESS_KEY = "yoyo_rg_p";
  const STATE_KEY = "yoyo_radial_studio_state";
  const PERSUASIVE_WORDS = ["delicioso", "saludable", "rápido", "importante", "seguro", "divertido", "beneficioso", "urgente"];
  const IMPERATIVE_WORDS = ["compra", "ven", "prueba", "actúa", "cuida", "elimina", "aprovecha", "protege", "participa", "visita", "no faltes"];
  const LEVELS = {
    classify: [
      { title: "Anuncio 1", type: "Anuncio de producto", icon: "🧃", text: "¿Quieres cuidar tu salud? Prueba nuestro jugo natural. Es delicioso y lleno de vitaminas. ¡Compra ahora!" },
      { title: "Anuncio 2", type: "Anuncio de interés social", icon: "🛡️", text: "¿Te preocupa el dengue? Elimina el agua acumulada en tu hogar. Protege a tu familia. ¡Actúa hoy!" },
      { title: "Anuncio 3", type: "Anuncio de evento", icon: "🎉", text: "¿Quieres pasar una tarde divertida? Ven a la feria escolar este viernes. Habrá juegos, música y sorpresas. ¡No faltes!" },
      { title: "Anuncio 4", type: "Anuncio de producto", icon: "🧼", text: "¿Te gustaría tener ropa más limpia? Usa nuestro detergente Súper Limpio. Elimina manchas difíciles. ¡Aprovecha hoy!" }
    ],
    fragments: [
      { title: "Caso 1", prompt: "Coloca cada fragmento del anuncio social en la parte correcta de la estructura radial.", parts: { "Llamada": "¿Quieres proteger a tu familia?", "Presentación": "Elimina el agua acumulada en tu hogar.", "Argumentación": "Así evitas criaderos de mosquitos.", "Cierre": "¡Actúa hoy por tu comunidad!" } },
      { title: "Caso 2", prompt: "Ordena este anuncio de producto según su llamada, presentación, argumentación y cierre.", parts: { "Llamada": "¿Buscas una merienda saludable?", "Presentación": "Prueba nuestra galleta de avena.", "Argumentación": "Es nutritiva, rica y te da energía.", "Cierre": "¡Pruébala hoy!" } }
    ],
    createTypes: [
      { id: "producto", title: "Producto", help: "Crea un anuncio para vender un producto útil o saludable." },
      { id: "evento", title: "Evento", help: "Invita a otras personas a participar en una actividad o celebración." },
      { id: "social", title: "Interés social", help: "Motiva a la comunidad a actuar para cuidarse o mejorar su entorno." }
    ]
  };

  const recordings = {};
  let audioContext = null;
  let observerBound = false;

  const studentId = () => { try { const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); return s?.role === "student" ? s.id : "guest"; } catch { return "guest"; } };
  const stateKey = () => studentId();
  const freshState = () => ({ phase: 0, classifyIndex: 0, classifySelected: {}, classifySolved: {}, classifyReviewed: {}, classifyScore: 0, fragmentIndex: 0, fragmentAssignments: {}, fragmentSolved: {}, fragmentReviewed: {}, fragmentScore: 0, selectedFragment: "", createType: "", script: { llamada: "", presentacion: "", argumentacion: "", cierre: "" }, createValidated: false, createReviewed: false, createScore: 0, createBonus: 0, recordingActive: false, recordingReady: false, audioEvaluation: null, feedback: null, finished: false });
  const loadState = () => { try { const all = JSON.parse(localStorage.getItem(STATE_KEY) || "{}"); return { ...freshState(), ...(all[stateKey()] || {}) }; } catch { return freshState(); } };
  const saveState = (state) => { const all = JSON.parse(localStorage.getItem(STATE_KEY) || "{}"); all[stateKey()] = state; localStorage.setItem(STATE_KEY, JSON.stringify(all)); };
  const totalScore = (state) => state.classifyScore + state.fragmentScore + state.createScore + state.createBonus + (state.audioEvaluation?.score || 0);
  const totalStars = (state) => totalScore(state) >= 120 ? 3 : totalScore(state) >= 75 ? 2 : 1;
  const currentScriptText = (state) => [state.script.llamada, state.script.presentacion, state.script.argumentacion, state.script.cierre].filter(Boolean).join(" ");
  const hasAudioSource = () => { const current = recordings[stateKey()]; return Boolean(current?.url && (current?.blob || current?.file)); };
  const escapeHtml = (text) => String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const decodeHtml = (text) => { const area = document.createElement("textarea"); area.innerHTML = text; return area.value; };

  function renameActivityCard() {
    app.querySelectorAll(`[data-oa="${TARGET_GAME}"]`).forEach((button) => {
      const heading = button.querySelector("h4");
      const copy = button.querySelector("p");
      if (heading && heading.textContent !== "10. Mi anuncio en la radio") heading.textContent = "10. Mi anuncio en la radio";
      if (copy && copy.textContent !== "Escucha, organiza, escribe y graba tu anuncio radial final.") copy.textContent = "Escucha, organiza, escribe y graba tu anuncio radial final.";
    });
  }

  function mount() {
    renameActivityCard();
    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    if (!card) return;
    if (card.dataset.radialStudioReady === "1") return;
    card.dataset.radialStudioReady = "1";
    const title = card.querySelector(".play-top h3");
    const text = card.querySelector(".play-top .muted-main");
    if (title && title.textContent !== "10. Mi anuncio en la radio") title.textContent = "10. Mi anuncio en la radio";
    if (text && text.textContent !== "Escucha, clasifica, organiza y crea tu propio anuncio radial.") text.textContent = "Escucha, clasifica, organiza y crea tu propio anuncio radial.";
    const board = card.querySelector(".game-board");
    const actionRow = card.querySelector(".action-row");
    if (!board || !actionRow) return;
    render(card, board, actionRow, loadState());
  }

  function render(card, board, actionRow, state) {
    if (state.finished) return renderFinal(board, actionRow, state);
    board.innerHTML = `
      <section class="radial-studio-app">
        <div class="radial-fill-topbar">
          <article class="radial-fill-stat"><div class="radial-kicker">Progreso</div><strong>${phaseLabel(state.phase)}</strong><span>${phaseSubtitle(state)}</span></article>
          <article class="radial-fill-stat"><div class="radial-kicker">Puntos acumulados</div><strong>${totalScore(state)}</strong><span>${"★".repeat(totalStars(state))}</span></article>
          <article class="radial-fill-stat"><div class="radial-kicker">Meta</div><strong>${phaseMeta(state)}</strong><span>${phaseHint(state)}</span></article>
        </div>
        <section class="radial-fill-help"><div><div class="radial-kicker">Cómo jugar</div><p>${phaseInstruction(state)}</p></div><button class="real-ghost" type="button" data-studio-repeat="1">Escuchar instrucciones</button></section>
        ${state.phase === 0 ? renderClassify(state) : state.phase === 1 ? renderFragments(state) : renderCreate(state)}
        <section class="radial-fill-feedback ${state.feedback?.type || ""}"><div class="radial-kicker">Retroalimentación</div><strong>${state.feedback?.title || "Sigue avanzando en tu anuncio radial final."}</strong><p>${state.feedback?.text || "Escucha, clasifica, organiza y luego crea tu propio anuncio usando llamada, presentación, argumentación y cierre."}</p></section>
        <details class="radial-teacher-panel"><summary>Panel docente</summary><div class="radial-teacher-grid"><article><h4>Objetivo</h4><p>Demostrar comprensión y producción de anuncios radiales escuchando, clasificando, organizando y grabando un anuncio propio.</p></article><article><h4>Competencias</h4><p>Comunicativa, pensamiento crítico y creativo, y ética y ciudadanía.</p></article><article><h4>Uso en clase</h4><p>Actividad final de cierre para integrar comprensión oral, producción escrita y expresión oral del anuncio radial.</p></article><article><h4>Evidencia</h4><p>El estudiante clasifica anuncios, organiza su estructura y produce un guion con lenguaje persuasivo y grabación oral.</p></article></div></details>
      </section>`;
    actionRow.innerHTML = actionButtons(state);
    bind(board, actionRow, card, state);
  }

  function renderClassify(state) {
    const item = LEVELS.classify[state.classifyIndex];
    const selected = state.classifySelected[state.classifyIndex] || "";
    const solved = Boolean(state.classifySolved[state.classifyIndex]);
    const completed = Object.keys(state.classifySolved).length;
    return `<section class="studio-case-card"><div class="studio-case-head"><div class="instruction-chip">Nivel 1: Escucha y clasifica</div><span class="status-badge">${completed}/${LEVELS.classify.length} anuncios resueltos</span></div><article class="studio-audio-card"><div class="studio-audio-top"><div><div class="radial-kicker">${item.title}</div><h4>${item.icon} ${item.title}</h4></div><button class="real-action studio-sound-button" type="button" data-studio-speak="${escapeHtml(item.text)}">🔊 Escuchar anuncio</button></div><p>${escapeHtml(item.text)}</p></article><div class="studio-classify-grid">${["Anuncio de producto", "Anuncio de evento", "Anuncio de interés social"].map((category) => `<button class="studio-choice-card ${selected === category ? "selected" : ""}" data-studio-category="${escapeHtml(category)}" type="button" ${solved ? "disabled" : ""}><strong>${escapeHtml(category)}</strong><span>${category.includes("producto") ? "Promociona algo para comprar o usar." : category.includes("evento") ? "Invita a participar en una actividad." : "Busca cuidar o mejorar a la comunidad."}</span></button>`).join("")}</div></section>`;
  }

  function renderFragments(state) {
    const item = LEVELS.fragments[state.fragmentIndex];
    const assignments = state.fragmentAssignments[state.fragmentIndex] || {};
    const selected = state.selectedFragment;
    const allFragments = Object.values(item.parts);
    const used = new Set(Object.values(assignments));
    return `<section class="studio-case-card"><div class="studio-case-head"><div class="instruction-chip">Nivel 2: Coloca cada parte en su lugar</div><span class="status-badge">${Object.keys(state.fragmentSolved).length}/${LEVELS.fragments.length} casos resueltos</span></div><p class="studio-case-copy">${item.prompt}</p><div class="studio-fragment-layout"><div class="studio-slot-grid">${["Llamada", "Presentación", "Argumentación", "Cierre"].map((label) => { const value = assignments[label] || ""; return `<button class="studio-slot-card ${value ? "filled" : ""}" data-studio-slot="${label}" type="button"><span class="slot-label">${label}</span><span class="slot-value">${value ? escapeHtml(value) : "Coloca aquí el fragmento correcto"}</span></button>`; }).join("")}</div><div class="studio-fragment-bank">${allFragments.map((fragment) => `<button class="studio-fragment-card ${selected === fragment ? "selected" : ""}" data-studio-fragment="${escapeHtml(fragment)}" type="button" ${used.has(fragment) ? "disabled" : ""}>${escapeHtml(fragment)}</button>`).join("")}</div></div></section>`;
  }

  function renderCreate(state) {
    const canRecord = Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
    const recording = recordings[stateKey()] || {};
    const typeCard = LEVELS.createTypes.find((item) => item.id === state.createType);
    const sourceLabel = recording.fileName ? `Archivo: ${recording.fileName}` : recording.url ? "Audio grabado en la plataforma" : "Aún no hay audio cargado";
    const recordingLabel = state.recordingActive ? "Grabando ahora mismo. Lee con voz clara y luego presiona Detener." : recording.url ? "Tu grabación está lista. Puedes escucharla o volver a grabarla." : canRecord ? "Cuando tu guion esté listo, grábalo con buena entonación." : "Tu navegador no permite grabar audio. Puedes leerlo en voz alta a la maestra.";
    return `<section class="studio-case-card"><div class="studio-case-head"><div class="instruction-chip">Nivel 3: Elige, escribe y graba tu anuncio</div><span class="status-badge">${state.createValidated ? "guion validado" : "creación guiada"}</span></div><div class="studio-type-grid"><label class="studio-type-select-card"><span class="slot-label">Tipo de anuncio</span><select data-studio-type-select="1"><option value="">Selecciona una opción</option>${LEVELS.createTypes.map((item) => `<option value="${item.id}" ${state.createType === item.id ? "selected" : ""}>${item.title}</option>`).join("")}</select></label>${LEVELS.createTypes.map((item) => `<button class="studio-type-card ${state.createType === item.id ? "selected" : ""}" data-studio-type="${item.id}" type="button"><strong>${item.title}</strong><span>${item.help}</span></button>`).join("")}</div><section class="studio-create-grid">${renderField("llamada", "Llamada", "Escribe una pregunta o frase que llame la atención.", state.script.llamada)}${renderField("presentacion", "Presentación", "Presenta el producto, evento o acción social.", state.script.presentacion)}${renderField("argumentacion", "Argumentación", "Explica beneficios o razones para convencer.", state.script.argumentacion)}${renderField("cierre", "Cierre", "Escribe una invitación o llamado a la acción.", state.script.cierre)}</section><section class="studio-creator-info"><article class="content-card"><div class="radial-kicker">Requisitos</div><p>Incluye una pregunta, una frase imperativa y al menos dos palabras persuasivas.</p><div class="content-chip-grid">${PERSUASIVE_WORDS.slice(0, 6).map((word) => `<span class="real-chip">${word}</span>`).join("")}</div></article><article class="content-card"><div class="radial-kicker">Tipo elegido</div><p>${typeCard ? typeCard.help : "Primero elige si tu anuncio será de producto, evento o interés social."}</p></article></section><section class="studio-record-panel"><div><div class="radial-kicker">Grabación</div><p>${recordingLabel}</p></div><div class="studio-record-status ${state.recordingActive ? "active" : recording.url ? "ready" : ""}"><span class="studio-record-dot"></span><span>${state.recordingActive ? "Grabando anuncio" : recording.url ? "Audio listo" : "Sin audio"}</span><span class="studio-record-source">${sourceLabel}</span>${state.recordingActive ? `<span class="studio-sound-wave"><i></i><i></i><i></i><i></i></span>` : ""}</div><div class="studio-record-actions"><button class="real-action" type="button" data-studio-record="1" ${canRecord && !state.recordingActive ? "" : "disabled"}>🎤 Grabar</button><button class="real-ghost" type="button" data-studio-stop="1" ${state.recordingActive ? "" : "disabled"}>Detener</button><button class="real-ghost" type="button" data-studio-play="1" ${recording.url && !state.recordingActive ? "" : "disabled"}>🔊 Escuchar mi grabación</button><button class="real-ghost" type="button" data-studio-rerecord="1" ${recording.url && !state.recordingActive ? "" : "disabled"}>Volver a grabar</button><button class="real-ghost" type="button" data-studio-read-script="1" ${currentScriptText(state) ? "" : "disabled"}>📣 Escuchar mi guion</button><button class="real-ghost" type="button" data-studio-upload-trigger="1" ${state.recordingActive ? "disabled" : ""}>📁 Cargar audio</button><button class="real-action" type="button" data-studio-grade-audio="1" ${hasAudioSource() && !state.recordingActive ? "" : "disabled"}>Calificar audio</button></div><input class="studio-upload-input" data-studio-upload="1" type="file" accept="audio/*"><audio class="studio-audio-player" controls ${recording.url ? "" : "hidden"} src="${recording.url || ""}"></audio>${renderAudioEvaluation(state)}</section></section>`;
  }
  function renderAudioEvaluation(state) {
    if (!state.audioEvaluation) return `<section class="studio-audio-eval pending"><div class="radial-kicker">Evaluación automática del audio</div><p>Carga o graba un audio y luego pulsa <strong>Calificar audio</strong>. El juego evaluará duración, presencia de voz, nivel de silencio y preparación del guion.</p></section>`;
    const e = state.audioEvaluation;
    return `<section class="studio-audio-eval ${e.levelClass}"><div class="studio-audio-eval-head"><div><div class="radial-kicker">Evaluación automática del audio</div><strong>${e.title}</strong></div><span class="status-badge">Puntos audio: ${e.score}</span></div><div class="studio-audio-metrics"><article class="content-card"><strong>Duración</strong><p>${e.durationText}</p></article><article class="content-card"><strong>Voz detectada</strong><p>${e.voiceText}</p></article><article class="content-card"><strong>Silencios</strong><p>${e.silenceText}</p></article><article class="content-card"><strong>Guion</strong><p>${e.scriptText}</p></article></div><p class="studio-audio-summary">${e.summary}</p></section>`;
  }

  function renderField(key, label, help, value) {
    return `<label class="studio-field-card"><span class="slot-label">${label}</span><span class="studio-field-help">${help}</span><textarea data-studio-field="${key}" rows="4" placeholder="${help}">${escapeHtml(value)}</textarea></label>`;
  }

  function actionButtons(state) {
    if (state.phase === 0) { const reviewed = Boolean(state.classifyReviewed[state.classifyIndex]); return `<button class="real-ghost" type="button" data-studio-reset="classify">Reintentar</button><button class="real-action" type="button" data-studio-check="classify">Verificar</button><button class="real-action ${reviewed ? "" : "radial-disabled"}" type="button" data-studio-next="classify" ${reviewed ? "" : "disabled"}>${state.classifyIndex === LEVELS.classify.length - 1 ? "Siguiente nivel" : "Siguiente anuncio"}</button>`; }
    if (state.phase === 1) { const reviewed = Boolean(state.fragmentReviewed[state.fragmentIndex]); return `<button class="real-ghost" type="button" data-studio-reset="fragment">Reintentar</button><button class="real-action" type="button" data-studio-check="fragment">Verificar</button><button class="real-action ${reviewed ? "" : "radial-disabled"}" type="button" data-studio-next="fragment" ${reviewed ? "" : "disabled"}>${state.fragmentIndex === LEVELS.fragments.length - 1 ? "Siguiente nivel" : "Siguiente caso"}</button>`; }
    return `<button class="real-ghost" type="button" data-studio-reset="create">Reintentar</button><button class="real-action" type="button" data-studio-check="create">Verificar</button><button class="real-action ${state.createReviewed ? "" : "radial-disabled"}" type="button" data-studio-next="create" ${state.createReviewed ? "" : "disabled"}>Finalizar juego</button>`;
  }

  function bind(board, actionRow, card, state) {
    board.querySelector("[data-studio-repeat]")?.addEventListener("click", () => { const text = phaseInstruction(state); state.feedback = { type: "", title: "Instrucciones repetidas", text }; speakText(text); saveState(state); render(card, board, actionRow, state); });
    board.querySelectorAll("[data-studio-speak]").forEach((button) => button.addEventListener("click", () => speakText(decodeHtml(button.dataset.studioSpeak))));
    if (state.phase === 0) bindClassify(board, actionRow, card, state);
    if (state.phase === 1) bindFragments(board, actionRow, card, state);
    if (state.phase === 2) bindCreate(board, actionRow, card, state);
  }

  function bindClassify(board, actionRow, card, state) {
    board.querySelectorAll("[data-studio-category]").forEach((button) => button.addEventListener("click", () => { state.classifySelected[state.classifyIndex] = decodeHtml(button.dataset.studioCategory); state.feedback = { type: "", title: "Clasificación marcada", text: "Ahora presiona Verificar para comprobar si el anuncio pertenece a esa categoría." }; saveState(state); render(card, board, actionRow, state); }));
    actionRow.querySelector('[data-studio-reset="classify"]')?.addEventListener("click", () => { delete state.classifySelected[state.classifyIndex]; state.feedback = { type: "", title: "Respuesta limpiada", text: "Escucha de nuevo el anuncio y piensa si promueve un producto, un evento o una causa social." }; saveState(state); render(card, board, actionRow, state); });
    actionRow.querySelector('[data-studio-check="classify"]')?.addEventListener("click", () => {
      const item = LEVELS.classify[state.classifyIndex]; const selected = state.classifySelected[state.classifyIndex]; state.classifyReviewed[state.classifyIndex] = true;
      if (!selected) { state.feedback = { type: "error", title: "Respuesta enviada para revisar", text: "Aún no elegiste una categoría. Observa si el anuncio vende un producto, invita a un evento o promueve una causa social, y luego compáralo con las opciones." }; playTone("error"); }
      else if (selected === item.type) { if (!state.classifySolved[state.classifyIndex]) state.classifyScore += 10; state.classifySolved[state.classifyIndex] = true; state.feedback = { type: "success", title: "Clasificación correcta", text: `Muy bien. ${item.title} corresponde a ${item.type.toLowerCase()}.` }; playTone("success"); }
      else { state.feedback = { type: "error", title: "Clasificación por revisar", text: "Escucha otra vez y fíjate si el anuncio quiere vender, invitar a un evento o promover el cuidado de la comunidad." }; playTone("error"); }
      saveState(state); render(card, board, actionRow, state);
    });
    actionRow.querySelector('[data-studio-next="classify"]')?.addEventListener("click", () => { if (!state.classifyReviewed[state.classifyIndex]) return; if (state.classifyIndex === LEVELS.classify.length - 1) { state.phase = 1; state.feedback = { type: "", title: "Pasas al Nivel 2", text: "Ahora colocarás fragmentos del anuncio radial en la parte correcta de la estructura." }; } else { state.classifyIndex += 1; state.feedback = { type: "", title: `Ahora escucha ${LEVELS.classify[state.classifyIndex].title}`, text: "Escucha el nuevo anuncio y clasifícalo correctamente." }; } saveState(state); render(card, board, actionRow, state); });
  }

  function bindFragments(board, actionRow, card, state) {
    const current = LEVELS.fragments[state.fragmentIndex];
    board.querySelectorAll("[data-studio-fragment]").forEach((button) => button.addEventListener("click", () => { state.selectedFragment = decodeHtml(button.dataset.studioFragment); state.feedback = { type: "", title: "Fragmento seleccionado", text: "Ahora toca la parte de la estructura donde debe colocarse." }; saveState(state); render(card, board, actionRow, state); }));
    board.querySelectorAll("[data-studio-slot]").forEach((button) => button.addEventListener("click", () => { const slot = button.dataset.studioSlot; state.fragmentAssignments[state.fragmentIndex] = state.fragmentAssignments[state.fragmentIndex] || {}; const assignments = state.fragmentAssignments[state.fragmentIndex]; if (assignments[slot]) { delete assignments[slot]; state.feedback = { type: "", title: "Fragmento retirado", text: "Quitaste ese fragmento del espacio. Puedes colocarlo en otra parte." }; } else if (state.selectedFragment) { assignments[slot] = state.selectedFragment; state.selectedFragment = ""; state.feedback = { type: "", title: "Fragmento colocado", text: "Sigue completando llamada, presentación, argumentación y cierre." }; playTone("drop"); } saveState(state); render(card, board, actionRow, state); }));
    actionRow.querySelector('[data-studio-reset="fragment"]')?.addEventListener("click", () => { state.fragmentAssignments[state.fragmentIndex] = {}; state.selectedFragment = ""; state.feedback = { type: "", title: "Caso reiniciado", text: current.prompt }; saveState(state); render(card, board, actionRow, state); });
    actionRow.querySelector('[data-studio-check="fragment"]')?.addEventListener("click", () => { const map = state.fragmentAssignments[state.fragmentIndex] || {}; const labels = Object.keys(current.parts); const correctCount = labels.reduce((sum, label) => sum + (map[label] === current.parts[label] ? 1 : 0), 0); state.fragmentReviewed[state.fragmentIndex] = true; if (correctCount === labels.length) { if (!state.fragmentSolved[state.fragmentIndex]) state.fragmentScore += correctCount * 10; state.fragmentSolved[state.fragmentIndex] = true; state.feedback = { type: "success", title: "Estructura correcta", text: `Excelente. Colocaste correctamente las ${correctCount} partes del anuncio radial.` }; playTone("success"); } else { state.feedback = { type: "error", title: "Retroalimentación del caso", text: `Logro: organizaste bien ${correctCount} de ${labels.length} partes. Para mejorar: revisa el orden lógico del anuncio radial, empezando por la llamada y terminando en el cierre. Pregunta para pensar: ¿qué función cumple cada fragmento dentro del mensaje?` }; playTone("error"); } saveState(state); render(card, board, actionRow, state); });
    actionRow.querySelector('[data-studio-next="fragment"]')?.addEventListener("click", () => { if (!state.fragmentReviewed[state.fragmentIndex]) return; if (state.fragmentIndex === LEVELS.fragments.length - 1) { state.phase = 2; state.feedback = { type: "", title: "Pasas al Nivel 3", text: "Ahora elegirás un tipo de anuncio, escribirás tu guion y lo grabarás." }; } else { state.fragmentIndex += 1; state.selectedFragment = ""; state.feedback = { type: "", title: `Ahora vas al ${LEVELS.fragments[state.fragmentIndex].title}`, text: LEVELS.fragments[state.fragmentIndex].prompt }; } saveState(state); render(card, board, actionRow, state); });
  }
  function bindCreate(board, actionRow, card, state) {
    board.querySelector("[data-studio-type-select]")?.addEventListener("change", (event) => { state.createType = event.target.value; state.feedback = state.createType ? { type: "", title: "Tipo elegido", text: "Ahora completa tu guion usando llamada, presentación, argumentación y cierre." } : { type: "", title: "Selecciona un tipo", text: "Elige si tu anuncio será de producto, evento o interés social para continuar." }; saveState(state); render(card, board, actionRow, state); });
    board.querySelectorAll("[data-studio-type]").forEach((button) => button.addEventListener("click", () => { state.createType = button.dataset.studioType; state.feedback = { type: "", title: "Tipo elegido", text: "Ahora completa tu guion usando llamada, presentación, argumentación y cierre." }; saveState(state); render(card, board, actionRow, state); }));
    board.querySelectorAll("[data-studio-field]").forEach((field) => field.addEventListener("input", () => { state.script[field.dataset.studioField] = field.value; saveState(state); }));
    board.querySelector("[data-studio-record]")?.addEventListener("click", async () => { await startRecording(board, state, card, actionRow); });
    board.querySelector("[data-studio-stop]")?.addEventListener("click", () => stopRecording());
    board.querySelector("[data-studio-play]")?.addEventListener("click", () => board.querySelector(".studio-audio-player")?.play());
    board.querySelector("[data-studio-read-script]")?.addEventListener("click", () => speakText(currentScriptText(state)));
    board.querySelector("[data-studio-upload-trigger]")?.addEventListener("click", () => board.querySelector("[data-studio-upload]")?.click());
    board.querySelector("[data-studio-upload]")?.addEventListener("change", async (event) => { const file = event.target.files?.[0]; if (file) await loadUploadedAudio(file, state, card, board, actionRow); });
    board.querySelector("[data-studio-grade-audio]")?.addEventListener("click", async () => { await gradeAudio(state, card, board, actionRow); });
    board.querySelector("[data-studio-rerecord]")?.addEventListener("click", () => { clearRecording(); state.recordingActive = false; state.recordingReady = false; state.audioEvaluation = null; state.feedback = { type: "", title: "Grabación eliminada", text: "Puedes grabar de nuevo tu anuncio radial cuando quieras." }; saveState(state); render(card, board, actionRow, state); });
    actionRow.querySelector('[data-studio-reset="create"]')?.addEventListener("click", () => { state.createType = ""; state.script = { llamada: "", presentacion: "", argumentacion: "", cierre: "" }; state.createValidated = false; state.createReviewed = false; state.createScore = 0; state.createBonus = 0; state.recordingActive = false; state.recordingReady = false; state.audioEvaluation = null; clearRecording(); state.feedback = { type: "", title: "Creación reiniciada", text: "Vuelve a elegir el tipo de anuncio y completa el guion paso a paso." }; saveState(state); render(card, board, actionRow, state); });
    actionRow.querySelector('[data-studio-check="create"]')?.addEventListener("click", () => { validateCreate(state); saveState(state); render(card, board, actionRow, state); });
    actionRow.querySelector('[data-studio-next="create"]')?.addEventListener("click", () => { if (!state.createReviewed) return; state.finished = true; persistPlatformSuccess(); playTone("victory"); saveState(state); render(card, board, actionRow, state); });
  }

  function validateCreate(state) {
    const allText = Object.values(state.script).join(" ").trim();
    const missing = Object.entries(state.script).filter(([, value]) => !String(value).trim());
    state.createReviewed = true;
    const hasQuestion = /[¿?]/.test(state.script.llamada) || /\?/.test(allText);
    const lower = allText.toLowerCase();
    const imperative = IMPERATIVE_WORDS.some((word) => lower.includes(word));
    const persuasiveCount = PERSUASIVE_WORDS.filter((word) => lower.includes(word)).length;
    const completedParts = 4 - missing.length;
    const issues = [];
    let score = 0;
    if (state.createType) score += 3; else issues.push("elige el tipo de anuncio");
    score += completedParts * 4;
    if (hasQuestion) score += 3; else issues.push("agrega una pregunta en la llamada");
    if (imperative) score += 3; else issues.push("incluye una invitación imperativa en el cierre");
    if (persuasiveCount >= 2) score += 3; else issues.push("usa al menos dos palabras persuasivas");
    state.createValidated = !issues.length && !missing.length;
    state.createScore = Math.min(20, score);
    state.createBonus = state.recordingReady ? 5 : 0;
    if (state.createValidated) {
      state.feedback = { type: "success", title: "Guion completo", text: state.recordingReady ? "Excelente. Tu guion cumple la estructura y además ya grabaste tu anuncio radial." : "Muy bien. Tu guion tiene estructura completa, pregunta, imperativo y palabras persuasivas. Si puedes, grábalo para sumar más puntos." };
      playTone("success");
      return;
    }
    const missingText = missing.length ? `Partes incompletas: ${missing.map(([key]) => fieldLabel(key)).join(", ")}. ` : "";
    state.feedback = { type: "error", title: "Retroalimentación del guion", text: `Logro: completaste ${completedParts} de 4 partes y tu borrador obtuvo ${state.createScore} puntos. ${missingText}Para mejorar: ${issues.join("; ")}. Pregunta para pensar: ¿tu anuncio realmente llama la atención, convence y cierra con una invitación clara?` };
    playTone("error");
  }

  async function startRecording(board, state, card, actionRow) {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      state.feedback = { type: "error", title: "Grabación no disponible", text: "Tu navegador no permite grabar audio. Puedes leerlo en voz alta a la maestra." };
      saveState(state); render(card, board, actionRow, state); return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream); const chunks = [];
      recordings[stateKey()] = { stream, recorder };
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => { const blob = new Blob(chunks, { type: "audio/webm" }); const current = recordings[stateKey()] || {}; if (current.url) URL.revokeObjectURL(current.url); recordings[stateKey()] = { blob, file: null, fileName: "grabacion-web.webm", url: URL.createObjectURL(blob) }; stream.getTracks().forEach((track) => track.stop()); state.recordingActive = false; state.recordingReady = true; state.audioEvaluation = null; state.feedback = { type: "success", title: "Grabación lista", text: "Ya puedes escuchar tu anuncio radial o volver a grabarlo para mejorarlo." }; saveState(state); render(card, board, actionRow, state); };
      recorder.start(); state.recordingActive = true; state.feedback = { type: "", title: "Grabando anuncio", text: "Lee tu anuncio con buena entonación y luego presiona Detener." }; saveState(state); render(card, board, actionRow, state);
    } catch {
      state.feedback = { type: "error", title: "No se pudo iniciar la grabación", text: "Revisa si el navegador tiene permiso para usar el micrófono." };
      saveState(state); render(card, board, actionRow, state);
    }
  }

  function stopRecording() {
    const current = recordings[stateKey()];
    if (current?.recorder && current.recorder.state === "recording") current.recorder.stop();
  }

  function clearRecording() {
    const current = recordings[stateKey()];
    if (!current) return;
    try { current.stream?.getTracks()?.forEach((track) => track.stop()); } catch {}
    if (current.url) URL.revokeObjectURL(current.url);
    delete recordings[stateKey()];
  }
  async function loadUploadedAudio(file, state, card, board, actionRow) {
    try {
      clearRecording();
      recordings[stateKey()] = { file, blob: file, fileName: file.name, url: URL.createObjectURL(file) };
      state.recordingActive = false; state.recordingReady = true; state.audioEvaluation = null;
      state.feedback = { type: "success", title: "Audio cargado", text: "El archivo se cargó correctamente. Ahora pulsa Calificar audio para obtener la evaluación automática." };
    } catch {
      state.feedback = { type: "error", title: "No se pudo cargar el audio", text: "Intenta otra vez con un archivo de audio compatible desde tu dispositivo." };
    }
    saveState(state); render(card, board, actionRow, state);
  }

  async function gradeAudio(state, card, board, actionRow) {
    const current = recordings[stateKey()]; const source = current?.blob || current?.file;
    if (!source) { state.feedback = { type: "error", title: "No hay audio para evaluar", text: "Primero graba o carga un archivo de audio dentro del juego." }; saveState(state); render(card, board, actionRow, state); return; }
    try {
      state.feedback = { type: "", title: "Evaluando audio", text: "Estoy revisando duración, presencia de voz, silencios y relación con el guion." }; saveState(state); render(card, board, actionRow, state);
      const evaluation = buildAudioEvaluation(await analyzeAudioBlob(source), state);
      state.audioEvaluation = evaluation;
      state.feedback = { type: evaluation.levelClass === "good" ? "success" : evaluation.levelClass === "warn" ? "" : "error", title: evaluation.title, text: evaluation.summary };
    } catch {
      state.feedback = { type: "error", title: "No se pudo evaluar el audio", text: "El archivo se cargó, pero no pude analizarlo. Prueba con otra grabación o un formato distinto." };
    }
    saveState(state); render(card, board, actionRow, state);
  }

  async function analyzeAudioBlob(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const channel = decoded.getChannelData(0); const sampleRate = decoded.sampleRate; const duration = decoded.duration;
    let sumSquares = 0; for (let i = 0; i < channel.length; i += 1) sumSquares += channel[i] * channel[i];
    const rms = Math.sqrt(sumSquares / Math.max(1, channel.length));
    const windowSize = Math.max(1, Math.floor(sampleRate * 0.2)); let silentWindows = 0; let totalWindows = 0;
    for (let start = 0; start < channel.length; start += windowSize) { let localSquares = 0; const end = Math.min(channel.length, start + windowSize); for (let i = start; i < end; i += 1) localSquares += channel[i] * channel[i]; const localRms = Math.sqrt(localSquares / Math.max(1, end - start)); if (localRms < 0.015) silentWindows += 1; totalWindows += 1; }
    return { duration, rms, silenceRatio: totalWindows ? silentWindows / totalWindows : 1 };
  }

  function buildAudioEvaluation(analysis, state) {
    const durationScore = analysis.duration >= 12 && analysis.duration <= 75 ? 10 : analysis.duration >= 8 && analysis.duration <= 95 ? 7 : 3;
    const voiceScore = analysis.rms >= 0.03 ? 10 : analysis.rms >= 0.018 ? 7 : 3;
    const silenceScore = analysis.silenceRatio <= 0.35 ? 10 : analysis.silenceRatio <= 0.55 ? 7 : 3;
    const scriptScore = state.createValidated ? 10 : 4;
    const score = durationScore + voiceScore + silenceScore + scriptScore;
    const title = score >= 34 ? "Excelente locución" : score >= 24 ? "Buen audio" : "Audio por mejorar";
    const levelClass = score >= 34 ? "good" : score >= 24 ? "warn" : "danger";
    return {
      score, title, levelClass,
      durationText: analysis.duration >= 12 && analysis.duration <= 75 ? `Duración adecuada: ${analysis.duration.toFixed(1)} s.` : `Duración mejorable: ${analysis.duration.toFixed(1)} s. Lo ideal es entre 12 y 75 segundos.`,
      voiceText: analysis.rms >= 0.03 ? "La voz se escucha clara y con buena presencia." : analysis.rms >= 0.018 ? "La voz se detecta, pero puede hablarse con más fuerza o cerca del micrófono." : "La voz se detecta débil. Conviene hablar más claro o acercarse al micrófono.",
      silenceText: analysis.silenceRatio <= 0.35 ? "Los silencios están bien controlados." : analysis.silenceRatio <= 0.55 ? "Hay varios silencios; conviene leer con más continuidad." : "Hay demasiados silencios. Practica el anuncio antes de grabarlo otra vez.",
      scriptText: state.createValidated ? "El audio se apoya en un guion completo y validado." : "El guion escrito todavía necesita ajustes; eso también afecta la evaluación final del audio.",
      summary: score >= 34 ? "Tu audio tiene buena duración, voz clara y un ritmo adecuado. Sigue así." : score >= 24 ? "El audio va bien, pero todavía puede mejorar en claridad, continuidad o preparación del guion." : "El audio necesita otra grabación más clara y continua para reflejar mejor el anuncio radial."
    };
  }

  function renderFinal(board, actionRow, state) {
    const score = totalScore(state); const stars = totalStars(state);
    board.innerHTML = `<section class="radial-final-screen studio-final-screen"><div class="radial-kicker">Juego completado</div><h3>Terminaste Mi anuncio en la radio</h3><p>Puntuación total: <strong>${score}</strong></p><p>Estrellas acumuladas: <strong>${"★".repeat(stars)}</strong></p><p>${stars === 3 ? "Excelente locutor o locutora. Comprendes y produces anuncios radiales con mucha seguridad." : stars === 2 ? "Muy buen trabajo. Ya sabes escuchar, organizar y crear anuncios radiales con intención persuasiva." : "Sigue practicando. Ya diste un gran paso para crear anuncios radiales claros y convincentes."}</p></section>`;
    actionRow.innerHTML = `<button class="real-action" type="button" data-studio-replay="1">Volver a jugar</button><button class="real-ghost" type="button" data-studio-close="1">Listo</button>`;
    actionRow.querySelector("[data-studio-replay]")?.addEventListener("click", () => { clearRecording(); saveState(freshState()); mount(); });
    actionRow.querySelector("[data-studio-close]")?.addEventListener("click", () => location.reload());
  }

  const phaseLabel = (phase) => phase === 0 ? "Nivel 1" : phase === 1 ? "Nivel 2" : "Nivel 3";
  const phaseSubtitle = (state) => state.phase === 0 ? "Escucha y clasifica" : state.phase === 1 ? "Coloca cada parte en su lugar" : "Elige, escribe y graba";
  const phaseMeta = (state) => state.phase === 0 ? `${Object.keys(state.classifySolved).length}/${LEVELS.classify.length}` : state.phase === 1 ? `${Object.keys(state.fragmentSolved).length}/${LEVELS.fragments.length}` : state.recordingReady ? "guion + audio" : "guion final";
  const phaseHint = (state) => state.phase === 0 ? "anuncios clasificados" : state.phase === 1 ? "casos organizados" : state.createValidated ? "listo para finalizar" : "estructura completa";
  const phaseInstruction = (state) => state.phase === 0 ? "Escucha cada anuncio y decide si es de producto, evento o interés social." : state.phase === 1 ? "Coloca cada fragmento en llamada, presentación, argumentación o cierre." : "Elige un tipo de anuncio, escribe tu guion con las cuatro partes y luego grábalo.";
  const fieldLabel = (key) => ({ llamada: "la llamada", presentacion: "la presentación", argumentacion: "la argumentación", cierre: "el cierre" }[key] || key);

  function persistPlatformSuccess() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); if (!session?.id) return;
      const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); progress[session.id] = progress[session.id] || {}; progress[session.id][TARGET_GAME] = { ok: true, score: 10, c: ["C1", "C2", "C3"], msg: "Escuchaste, organizaste y creaste tu propio anuncio radial final.", topicId: "anuncio" }; localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {}
  }

  function playTone(type) {
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain(); oscillator.connect(gain); gain.connect(audioContext.destination);
      const now = audioContext.currentTime; const presets = { success: [640, 0.08], error: [220, 0.08], drop: [430, 0.05], victory: [760, 0.18] }; const [frequency, duration] = presets[type] || presets.drop;
      oscillator.frequency.value = frequency; gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01); gain.gain.exponentialRampToValueAtTime(0.0001, now + duration); oscillator.start(now); oscillator.stop(now + duration);
    } catch {}
  }

  function speakText(text) {
    try { if (!window.speechSynthesis || !text) return; window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = "es-DO"; utterance.rate = 0.95; window.speechSynthesis.speak(utterance); } catch {}
  }

  function ensureObserver() {
    if (observerBound) return; observerBound = true;
    const observer = new MutationObserver(() => mount()); observer.observe(app, { childList: true, subtree: true });
  }

  ensureObserver();
  mount();
})();
