(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const TARGET_GAME = "oda-5";
  const SESSION_KEY = "yoyo_rg_x";
  const PROGRESS_KEY = "yoyo_rg_p";

  const CASES = [
    {
      level: "Nivel 1",
      title: "Caso 1",
      focus: "Que se alaba",
      fragment: "Oh hermosa bicicleta, companera del camino.",
      prompt: "Que se esta alabando en este fragmento?",
      options: ["La bicicleta", "El sol", "El camino"],
      answer: "La bicicleta",
      hint: "Observa que objeto recibe la admiracion del verso.",
      note: "La bicicleta es el objeto lirico que recibe la alabanza."
    },
    {
      level: "Nivel 2",
      title: "Caso 2",
      focus: "Figura literaria",
      fragment: "La bicicleta canta en el camino.",
      prompt: "Que figura literaria aparece aqui?",
      options: ["Personificacion", "Enumeracion", "Noticia"],
      answer: "Personificacion",
      hint: "Piensa si un objeto esta haciendo una accion humana.",
      note: "Hay personificacion porque la bicicleta recibe la accion de cantar."
    },
    {
      level: "Nivel 3",
      title: "Caso 3",
      focus: "Sentimiento",
      fragment: "Queridos juguetes silenciosos, ojala seais mas apreciados.",
      prompt: "Que sentimiento transmite la autora?",
      options: ["Nostalgia y aprecio", "Enojo contra los ninos", "Miedo a los juguetes"],
      answer: "Nostalgia y aprecio",
      hint: "Las palabras queridos y ojala muestran afecto y valoracion.",
      note: "La autora expresa carino, memoria y deseo de que esos juguetes sean valorados."
    }
  ];

  let observerBound = false;
  let audioContext = null;

  function clearPlatformProgress() {
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

  function persistSuccess(state) {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      if (!session || !session.id) return;
      const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
      progress[session.id] = progress[session.id] || {};
      progress[session.id][TARGET_GAME] = {
        ok: true,
        score: Math.max(1, Math.min(10, Math.round(totalScore(state) / 4.5))),
        c: ["C1", "C2"],
        msg: "Interpretaste fragmentos poeticos y descubriste pistas de la oda.",
        topicId: "oda"
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {}
  }

  function baseState() {
    return {
      caseIndex: 0,
      selected: {},
      checked: {},
      hints: {},
      errors: {},
      scores: {},
      feedback: {
        type: "",
        title: "Investiga el fragmento poetico",
        text: "Lee el verso, elige una opcion y luego verifica tu analisis."
      },
      finished: false
    };
  }

  function totalScore(state) {
    return Object.values(state.scores || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  }

  function totalStars(state) {
    const score = totalScore(state);
    if (score >= 35) return 3;
    if (score >= 20) return 2;
    return 1;
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
        success: [620, 0.08],
        error: [240, 0.1],
        hint: [430, 0.06],
        next: [540, 0.07],
        final: [760, 0.16]
      }[type] || [500, 0.06];
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

  function renameActivityCard() {
    app.querySelectorAll(`[data-oa="${TARGET_GAME}"]`).forEach((button) => {
      const heading = button.querySelector("h4");
      const copy = button.querySelector("p");
      if (heading) heading.textContent = "5. Detective de la oda";
      if (copy) copy.textContent = "Investiga fragmentos poeticos para descubrir que se alaba, que figura aparece y que sentimiento transmite.";
    });
  }

  function clearLegacyFeedback(card) {
    card.querySelectorAll(".radial-feedback").forEach((node) => node.remove());
  }

  function mount() {
    renameActivityCard();
    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    if (!card || card.dataset.odaDetectiveLiteReady === "1") return;
    card.dataset.odaDetectiveLiteReady = "1";
    clearLegacyFeedback(card);

    const title = card.querySelector(".play-top h3");
    const text = card.querySelector(".play-top .muted-main");
    const board = card.querySelector(".game-board");
    const actionRow = card.querySelector(".action-row");
    if (title) title.textContent = "5. Detective de la oda";
    if (text) text.textContent = "Analiza pistas poeticas para descubrir que se alaba, que figura aparece y que sentimiento transmite la oda.";
    if (!board || !actionRow) return;

    clearPlatformProgress();
    card._odaDetectiveLiteState = baseState();
    render(card, board, actionRow);
  }

  function render(card, board, actionRow) {
    const state = card._odaDetectiveLiteState || baseState();
    card._odaDetectiveLiteState = state;
    clearLegacyFeedback(card);

    if (state.finished) {
      renderFinal(card, board, actionRow, state);
      return;
    }

    const current = CASES[state.caseIndex];
    const selected = state.selected[state.caseIndex] || "";
    const checked = Boolean(state.checked[state.caseIndex]);

    board.innerHTML = `
      <section class="detective-app">
        <div class="detective-topbar">
          <article class="detective-stat">
            <div class="radial-kicker">Progreso</div>
            <strong>${current.level}</strong>
            <span>${current.title}</span>
          </article>
          <article class="detective-stat">
            <div class="radial-kicker">Puntos</div>
            <strong>${totalScore(state)}</strong>
            <span>${state.caseIndex + 1}/${CASES.length} casos</span>
          </article>
          <article class="detective-stat">
            <div class="radial-kicker">Meta</div>
            <strong>${current.focus}</strong>
            <span>Detective poetico</span>
          </article>
        </div>

        <section class="detective-brief">
          <div class="detective-icon">Lupa</div>
          <div>
            <div class="radial-kicker">Como jugar</div>
            <p>Lee el fragmento, busca la pista poetica y elige la opcion que mejor interpreta la oda.</p>
          </div>
          <button class="real-ghost" type="button" data-oda5-speak="1">Escuchar</button>
        </section>

        <section class="detective-case-card">
          <div class="detective-case-head">
            <span class="status-badge">${current.level}</span>
            <span class="status-badge">${current.focus}</span>
          </div>
          <article class="detective-ad">
            <div class="radial-kicker">Fragmento</div>
            <p>${escapeHtml(current.fragment)}</p>
          </article>

          <div class="detective-question-grid">
            <article class="detective-question-card ${checked ? (selected === current.answer ? "correct" : "wrong") : ""}">
              <div class="detective-question-top">
                <span class="question-index">Pregunta</span>
                <h4>${escapeHtml(current.prompt)}</h4>
              </div>
              <div class="detective-option-grid">
                ${current.options.map((option) => {
                  const classes = ["detective-option"];
                  if (!checked && selected === option) classes.push("selected");
                  if (checked && option === current.answer) classes.push("answer");
                  if (checked && selected === option && option !== current.answer) classes.push("selected-wrong");
                  return `<button class="${classes.join(" ")}" type="button" data-oda5-option="${escapeHtml(option)}">${escapeHtml(option)}</button>`;
                }).join("")}
              </div>
              <div class="detective-note ${state.feedback.type || ""}">
                ${escapeHtml(state.feedback.text)}
              </div>
            </article>
          </div>

          <section class="radial-fill-feedback ${state.feedback.type || ""}">
            <div class="radial-kicker">Retroalimentacion</div>
            <strong>${escapeHtml(state.feedback.title)}</strong>
            <p>${escapeHtml(state.feedback.text)}</p>
          </section>
        </section>
      </section>`;

    actionRow.innerHTML = `
      <button class="real-ghost" type="button" data-oda5-hint="1">Ver pista</button>
      <button class="real-ghost" type="button" data-oda5-reset="1">Reintentar</button>
      <button class="real-action" type="button" data-oda5-check="1">Verificar</button>
      <button class="real-action ${checked ? "" : "radial-disabled"}" type="button" data-oda5-next="1" ${checked ? "" : "disabled"}>${state.caseIndex === CASES.length - 1 ? "Finalizar" : "Siguiente caso"}</button>`;

    bind(card, board, actionRow);
  }

  function renderFinal(card, board, actionRow, state) {
    const stars = totalStars(state);
    board.innerHTML = `
      <section class="radial-final-screen detective-final-screen">
        <div class="radial-kicker">Mision completada</div>
        <h3>Terminaste Detective de la oda</h3>
        <p>Puntuacion total: <strong>${totalScore(state)}</strong></p>
        <p>Estrellas: <strong>${"? ".repeat(stars)}</strong></p>
        <p>${stars === 3 ? "Excelente. Comprendes muy bien las pistas del lenguaje poetico." : stars === 2 ? "Muy bien. Ya interpretas mejor los fragmentos de la oda." : "Buen esfuerzo. Sigue practicando para descubrir mejor sentimientos y recursos."}</p>
      </section>`;

    actionRow.innerHTML = `
      <button class="real-action" type="button" data-oda5-replay="1">Volver a jugar</button>
      <button class="real-ghost" type="button" data-oda5-close="1">Volver al temario</button>`;

    actionRow.querySelector("[data-oda5-replay]")?.addEventListener("click", () => {
      card._odaDetectiveLiteState = baseState();
      render(card, card.querySelector(".game-board"), actionRow);
    });
    actionRow.querySelector("[data-oda5-close]")?.addEventListener("click", () => {
      app.querySelector('[data-nav="back"]')?.click();
    });
  }

  function bind(card, board, actionRow) {
    const state = card._odaDetectiveLiteState;
    const current = CASES[state.caseIndex];

    board.querySelectorAll("[data-oda5-option]").forEach((button) => {
      button.addEventListener("click", () => {
        if (state.checked[state.caseIndex]) return;
        state.selected[state.caseIndex] = button.dataset.oda5Option;
        state.feedback = {
          type: "",
          title: "Respuesta elegida",
          text: "Muy bien. Ahora verifica si tu interpretacion coincide con la pista poetica."
        };
        render(card, card.querySelector(".game-board"), actionRow);
      });
    });

    board.querySelector("[data-oda5-speak]")?.addEventListener("click", () => {
      speak(current.fragment);
    });

    actionRow.querySelector("[data-oda5-hint]")?.addEventListener("click", () => {
      state.hints[state.caseIndex] = true;
      state.feedback = {
        type: "",
        title: "Pista descubierta",
        text: current.hint
      };
      playTone("hint");
      render(card, card.querySelector(".game-board"), actionRow);
    });

    actionRow.querySelector("[data-oda5-reset]")?.addEventListener("click", () => {
      state.selected[state.caseIndex] = "";
      state.checked[state.caseIndex] = false;
      state.errors[state.caseIndex] = 0;
      state.scores[state.caseIndex] = 0;
      state.hints[state.caseIndex] = false;
      state.feedback = {
        type: "",
        title: "Caso reiniciado",
        text: "Vuelve a leer el fragmento y elige la opcion que mejor interpreta la oda."
      };
      render(card, card.querySelector(".game-board"), actionRow);
    });

    actionRow.querySelector("[data-oda5-check]")?.addEventListener("click", () => {
      const selected = state.selected[state.caseIndex];
      if (!selected) {
        state.feedback = {
          type: "error",
          title: "Falta responder",
          text: "Elige una opcion antes de verificar tu respuesta."
        };
        playTone("error");
        render(card, card.querySelector(".game-board"), actionRow);
        return;
      }

      state.checked[state.caseIndex] = true;
      if (selected === current.answer) {
        const bonus = !state.hints[state.caseIndex] && !state.errors[state.caseIndex] ? 5 : 0;
        state.scores[state.caseIndex] = 10 + bonus;
        state.feedback = {
          type: "success",
          title: "Caso resuelto",
          text: `${current.note} Sigue asi: estas interpretando el lenguaje poetico con claridad.`
        };
        playTone("success");
      } else {
        state.errors[state.caseIndex] = Number(state.errors[state.caseIndex] || 0) + 1;
        state.scores[state.caseIndex] = 0;
        state.feedback = {
          type: "error",
          title: "Respuesta por revisar",
          text: `La opcion correcta era: ${current.answer}. ${current.note}`
        };
        playTone("error");
      }
      render(card, card.querySelector(".game-board"), actionRow);
    });

    actionRow.querySelector("[data-oda5-next]")?.addEventListener("click", () => {
      if (!state.checked[state.caseIndex]) return;
      if (state.caseIndex === CASES.length - 1) {
        state.finished = true;
        persistSuccess(state);
        playTone("final");
      } else {
        state.caseIndex += 1;
        state.feedback = {
          type: "",
          title: "Nuevo caso",
          text: "Lee con atencion la nueva pista y busca la mejor interpretacion."
        };
        playTone("next");
      }
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
  setTimeout(mount, 60);
})();
