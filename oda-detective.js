(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const TARGET_GAME = "oda-5";
  const SESSION_KEY = "yoyo_rg_x";
  const PROGRESS_KEY = "yoyo_rg_p";
  const STATE_KEY = "yoyo_oda_detective_state";

  const CASES = [
    {
      level: "Nivel 1",
      title: "Caso 1",
      fragment: "Oh hermosa bicicleta, companera del camino.",
      prompt: "Que se esta alabando?",
      options: ["La bicicleta", "El sol", "El camino"],
      answer: "La bicicleta",
      hint: "Observa que objeto recibe admiracion en el verso.",
      note: "La bicicleta es el objeto lirico admirado en este fragmento."
    },
    {
      level: "Nivel 1",
      title: "Caso 2",
      fragment: "Oh juguetes silenciosos, grandes anorados.",
      prompt: "Que se alaba en este fragmento?",
      options: ["Los juguetes silenciosos", "Los juguetes ruidosos", "Las canciones"],
      answer: "Los juguetes silenciosos",
      hint: "Busca quien recibe el carino de la voz poetica.",
      note: "La voz poetica recuerda con afecto a los juguetes silenciosos."
    },
    {
      level: "Nivel 1",
      title: "Caso 3",
      fragment: "Oh flor pequena, perfume de alegria.",
      prompt: "Que objeto o ser inspira la oda?",
      options: ["Una flor", "Una silla", "Una puerta"],
      answer: "Una flor",
      hint: "La respuesta aparece nombrada en el mismo fragmento.",
      note: "La flor es el objeto lirico que inspira admiracion."
    },
    {
      level: "Nivel 2",
      title: "Caso 4",
      fragment: "Corres como el viento.",
      prompt: "Que quiere decir esta expresion?",
      options: ["Que se mueve muy rapido", "Que esta detenida", "Que hace frio"],
      answer: "Que se mueve muy rapido",
      hint: "La comparacion con el viento sugiere rapidez.",
      note: "El verso usa una comparacion para expresar movimiento rapido."
    },
    {
      level: "Nivel 2",
      title: "Caso 5",
      fragment: "La bicicleta canta en el camino.",
      prompt: "Que figura literaria aparece?",
      options: ["Personificacion", "Enumeracion", "Noticia"],
      answer: "Personificacion",
      hint: "Piensa si un objeto recibe una accion humana.",
      note: "La bicicleta recibe una accion humana: cantar."
    },
    {
      level: "Nivel 2",
      title: "Caso 6",
      fragment: "Eres un rayo brillante.",
      prompt: "Que tipo de lenguaje se usa?",
      options: ["Figurado", "Cientifico", "Informativo literal"],
      answer: "Figurado",
      hint: "No se habla de un rayo real, sino de una imagen poetica.",
      note: "Se usa lenguaje figurado para exaltar una cualidad."
    },
    {
      level: "Nivel 3",
      title: "Caso 7",
      fragment: "El sol se desgranaba como maiz ardiendo.",
      prompt: "Que quiso expresar el autor?",
      options: ["Que hacia mucho calor y el sol brillaba intensamente", "Que estaba lloviendo", "Que el sol era pequeno"],
      answer: "Que hacia mucho calor y el sol brillaba intensamente",
      hint: "La imagen del maiz ardiendo sugiere calor y brillo fuerte.",
      note: "La imagen poetica transmite calor intenso y gran resplandor."
    },
    {
      level: "Nivel 3",
      title: "Caso 8",
      fragment: "Las bicicletas eran insectos transparentes.",
      prompt: "Por que el autor compara las bicicletas con insectos?",
      options: ["Porque parecen ligeras, rapidas y en movimiento", "Porque son peligrosas", "Porque vuelan realmente"],
      answer: "Porque parecen ligeras, rapidas y en movimiento",
      hint: "Piensa en las cualidades que comparten: ligereza y dinamismo.",
      note: "La comparacion resalta ligereza, rapidez y movimiento."
    },
    {
      level: "Nivel 3",
      title: "Caso 9",
      fragment: "Queridos juguetes silenciosos, ojala seais mas apreciados.",
      prompt: "Que sentimiento transmite la autora?",
      options: ["Nostalgia y aprecio", "Enojo contra los ninos", "Miedo a los juguetes"],
      answer: "Nostalgia y aprecio",
      hint: "Las palabras queridos y ojala muestran afecto y valoracion.",
      note: "La autora expresa carino, memoria y deseo de valoracion."
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
      caseIndex: 0,
      selected: {},
      checked: {},
      hints: {},
      scores: {},
      feedback: {
        type: "",
        title: "Lee el fragmento y piensa como detective poetico.",
        text: "Busca que se alaba, que sentimiento aparece y que imagen poetica usa el verso."
      },
      finished: false
    };
  }

  function loadState() {
    try {
      const all = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
      return all[getStudentId()] || baseState();
    } catch {
      return baseState();
    }
  }

  function saveState(state) {
    try {
      const all = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
      all[getStudentId()] = state;
      localStorage.setItem(STATE_KEY, JSON.stringify(all));
    } catch {}
  }

  function clearLegacyProgress(state) {
    if (state.finished) return;
    const checkedCount = Object.values(state.checked || {}).filter(Boolean).length;
    if (checkedCount > 0) return;
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

  function totalScore(state) {
    return Object.values(state.scores || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  }

  function totalStars(state) {
    const score = totalScore(state);
    if (score >= 80) return 3;
    if (score >= 50) return 2;
    return 1;
  }

  function clearLegacyFeedback(card) {
    card.querySelectorAll(".radial-feedback").forEach((node) => node.remove());
  }

  function renameActivityCard() {
    app.querySelectorAll(`[data-oa="${TARGET_GAME}"]`).forEach((button) => {
      const heading = button.querySelector("h4");
      const copy = button.querySelector("p");
      if (heading) heading.textContent = "5. Detective de la oda";
      if (copy) copy.textContent = "Analiza fragmentos poeticos para descubrir lo que se alaba, lo que se siente y el sentido del lenguaje figurado.";
    });
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function playTone(type) {
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const tone = {
        success: [620, 0.09],
        error: [220, 0.1],
        hint: [420, 0.07],
        advance: [520, 0.06],
        final: [760, 0.18]
      }[type] || [520, 0.06];
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.frequency.value = tone[0];
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + tone[1]);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + tone[1]);
    } catch {}
  }

  function speak(text) {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-DO";
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    } catch {}
  }

  function persistSuccess(state) {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      if (!session || !session.id) return;
      const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
      progress[session.id] = progress[session.id] || {};
      progress[session.id][TARGET_GAME] = {
        ok: true,
        score: Math.max(1, Math.min(10, Math.round(totalScore(state) / 10))),
        c: ["C1", "C2", "C3"],
        msg: "Interpretaste fragmentos poeticos, reconociste emociones y analizaste el lenguaje de la oda.",
        topicId: "oda"
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {}
  }

  function renderFinal(card, board, row, state) {
    const stars = totalStars(state);
    board.innerHTML = `
      <section class="radial-final-screen detective-final-screen">
        <div class="radial-kicker">Mision completada</div>
        <h3>Terminaste Detective de la oda</h3>
        <p>Puntuacion total: <strong>${totalScore(state)}</strong></p>
        <p>Estrellas: <strong>${"&#9733; ".repeat(stars)}</strong></p>
        <p>${stars === 3 ? "Excelente. Interpretas odas con sensibilidad y pensamiento critico." : stars === 2 ? "Vas muy bien. Ya reconoces mejor el lenguaje poetico y las emociones." : "Buen esfuerzo. Sigue practicando para descubrir con mas seguridad el sentido de los versos."}</p>
      </section>`;
    row.innerHTML = `
      <button class="real-action" type="button" data-oda5-replay="1">Volver a jugar</button>
      <button class="real-ghost" type="button" data-oda5-close="1">Volver al temario</button>`;

    row.querySelector("[data-oda5-replay]")?.addEventListener("click", () => {
      const next = baseState();
      saveState(next);
      render(card, board, row, next);
    });

    row.querySelector("[data-oda5-close]")?.addEventListener("click", () => window.location.reload());
  }

  function renderGame(card, board, row, state) {
    const current = CASES[state.caseIndex];
    const selected = state.selected[state.caseIndex] || "";
    const checked = Boolean(state.checked[state.caseIndex]);

    board.innerHTML = `
      <section class="detective-app">
        <div class="detective-topbar">
          <article class="detective-stat"><div class="radial-kicker">Caso activo</div><strong>${current.title}</strong><span>${current.level}</span></article>
          <article class="detective-stat"><div class="radial-kicker">Avance</div><strong>${state.caseIndex + 1}/${CASES.length}</strong><span>${checked ? "caso revisado" : "en investigacion"}</span></article>
          <article class="detective-stat"><div class="radial-kicker">Puntos</div><strong>${totalScore(state)}</strong><span>Detective poetico</span></article>
        </div>

        <section class="detective-brief">
          <div><div class="radial-kicker">Mision</div><p>Lee el fragmento y usa las pistas del lenguaje poetico para responder.</p></div>
          <button class="real-ghost studio-sound-button" type="button" data-oda5-read="1">Leer fragmento</button>
        </section>

        <section class="detective-case-card">
          <div class="detective-case-head"><span class="case-badge">Caso poetico</span></div>
          <div class="detective-ad"><p>${escapeHtml(current.fragment)}</p></div>
        </section>

        <section class="detective-question-grid">
          <article class="detective-question-card ${checked && selected === current.answer ? "correct" : ""} ${checked && selected && selected !== current.answer ? "wrong" : ""}">
            <div class="detective-question-top"><span class="question-index">Pregunta</span><h4>${escapeHtml(current.prompt)}</h4></div>
            <div class="detective-option-grid">
              ${current.options.map((option) => `
                <button class="detective-option ${selected === option ? "selected" : ""} ${checked && option === current.answer ? "answer" : ""} ${checked && selected === option && option !== current.answer ? "selected-wrong" : ""}" type="button" data-oda5-option="${escapeHtml(option)}" ${checked ? "disabled" : ""}>${escapeHtml(option)}</button>`).join("")}
            </div>
          </article>
        </section>

        <section class="radial-fill-feedback ${state.feedback.type || ""}">
          <div class="radial-kicker">Retroalimentacion</div>
          <strong>${escapeHtml(state.feedback.title)}</strong>
          <p>${escapeHtml(state.feedback.text)}</p>
        </section>
      </section>`;

    row.innerHTML = `
      <button class="real-ghost" type="button" data-oda5-hint="1">Ver pista</button>
      <button class="real-ghost" type="button" data-oda5-retry="1">Reintentar</button>
      <button class="real-action" type="button" data-oda5-check="1" ${selected && !checked ? "" : "disabled"}>Verificar</button>
      <button class="real-action" type="button" data-oda5-next="1" ${checked ? "" : "disabled"}>${state.caseIndex === CASES.length - 1 ? "Finalizar" : "Siguiente caso"}</button>`;

    board.querySelectorAll("[data-oda5-option]").forEach((button) => {
      button.addEventListener("click", () => {
        if (state.checked[state.caseIndex]) return;
        state.selected[state.caseIndex] = button.dataset.oda5Option;
        state.feedback = { type: "", title: "Respuesta seleccionada", text: "Muy bien. Ahora verifica tu analisis del fragmento poetico." };
        saveState(state);
        render(card, board, row, state);
      });
    });

    board.querySelector("[data-oda5-read]")?.addEventListener("click", () => speak(current.fragment));

    row.querySelector("[data-oda5-hint]")?.addEventListener("click", () => {
      state.hints[state.caseIndex] = 1;
      state.feedback = { type: "", title: "Pista", text: current.hint };
      playTone("hint");
      saveState(state);
      render(card, board, row, state);
    });

    row.querySelector("[data-oda5-retry]")?.addEventListener("click", () => {
      state.selected[state.caseIndex] = "";
      state.checked[state.caseIndex] = false;
      state.scores[state.caseIndex] = 0;
      state.feedback = { type: "", title: "Intentalo de nuevo", text: "Vuelve a leer el fragmento y piensa en la pista principal del caso." };
      saveState(state);
      render(card, board, row, state);
    });

    row.querySelector("[data-oda5-check]")?.addEventListener("click", () => {
      const choice = state.selected[state.caseIndex] || "";
      const hintPenalty = state.hints[state.caseIndex] ? 5 : 0;
      const ok = choice === current.answer;
      state.checked[state.caseIndex] = true;
      state.scores[state.caseIndex] = ok ? Math.max(0, 10 - hintPenalty) : 0;
      if (ok) {
        state.feedback = { type: "success", title: "Caso resuelto", text: `Logro: interpretaste correctamente el fragmento. ${current.note} Pregunta para pensar: que palabra del verso te ayudo a descubrir la respuesta?` };
        playTone("success");
      } else {
        state.feedback = { type: "error", title: "Respuesta revisada", text: `Tu respuesta fue revisada. Para mejorar: ${current.note} Pregunta para pensar: que detalle del fragmento te conviene mirar mejor?` };
        playTone("error");
      }
      saveState(state);
      render(card, board, row, state);
    });

    row.querySelector("[data-oda5-next]")?.addEventListener("click", () => {
      if (!state.checked[state.caseIndex]) return;
      if (state.caseIndex === CASES.length - 1) {
        state.finished = true;
        persistSuccess(state);
        state.feedback = { type: "success", title: "Mision completada", text: "Terminaste los casos del detective de la oda." };
        playTone("final");
      } else {
        state.caseIndex += 1;
        state.feedback = { type: "", title: `Nuevo ${CASES[state.caseIndex].title}`, text: "Lee el nuevo fragmento y resuelve la pista poetica." };
        playTone("advance");
      }
      saveState(state);
      render(card, board, row, state);
    });
  }

  function render(card, board, row, state) {
    clearLegacyFeedback(card);
    if (state.finished) {
      renderFinal(card, board, row, state);
      return;
    }
    renderGame(card, board, row, state);
  }

  function mount() {
    renameActivityCard();
    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    if (!card || card.dataset.oda5Ready === "1") return;
    card.dataset.oda5Ready = "1";

    const title = card.querySelector(".play-top h3");
    const text = card.querySelector(".play-top .muted-main");
    if (title) title.textContent = "5. Detective de la oda";
    if (text) text.textContent = "Analiza fragmentos poeticos para descubrir lo que se alaba, lo que se siente y el sentido del lenguaje figurado.";

    const board = card.querySelector(".game-board");
    const row = card.querySelector(".action-row");
    if (!board || !row) return;

    const state = loadState();
    clearLegacyProgress(state);
    saveState(state);
    render(card, board, row, state);
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
