(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const TARGET_GAME = "anuncio-2";
  const SESSION_KEY = "yoyo_rg_x";
  const PROGRESS_KEY = "yoyo_rg_p";
  const STATE_KEY = "yoyo_radial_fill_state";

  const LEVELS = [
    {
      title: "Nivel 1",
      subtitle: "Producto natural",
      hint: "Piensa en palabras que persuaden y completan una idea positiva.",
      segments: [
        "Quieres un producto ",
        "__0__",
        "? Prueba nuestro jugo ",
        "__1__",
        ". Es ",
        "__2__",
        " para tu salud. ",
        "__3__",
        " ahora!",
      ],
      answers: ["saludable", "natural", "delicioso", "compra"],
      options: ["saludable", "natural", "delicioso", "compra", "ruidoso", "televisor"],
    },
    {
      title: "Nivel 2",
      subtitle: "Detergente",
      hint: "Un anuncio persuade usando cualidades positivas y una orden final.",
      segments: [
        "Te gustaria tener ropa mas ",
        "__0__",
        "? Usa nuestro detergente ",
        "__1__",
        ". Elimina manchas de forma ",
        "__2__",
        ". ",
        "__3__",
        " ya!",
      ],
      answers: ["limpia", "potente", "rapida", "compralo"],
      options: ["limpia", "potente", "rapida", "compralo", "sucio", "pesado", "lento"],
    },
    {
      title: "Nivel 3",
      subtitle: "Prevencion",
      hint: "En un anuncio social deben aparecer el problema, la accion y la invitacion a actuar.",
      segments: [
        "Sabes como prevenir la ",
        "__0__",
        "? Elimina los ",
        "__1__",
        " de mosquitos. Protege a tu ",
        "__2__",
        ". ",
        "__3__",
        " hoy!",
      ],
      answers: ["chikungunya", "criaderos", "familia", "actua"],
      options: ["chikungunya", "criaderos", "familia", "actua", "television", "ruido", "desorden"],
    },
    {
      title: "Nivel 4",
      subtitle: "Campana escolar",
      hint: "Busca coherencia: llamada, presentacion, beneficio, invitacion y accion final.",
      segments: [
        "Quieres una escuela mas ",
        "__0__",
        " y ",
        "__1__",
        "? Participa en nuestra campana de reciclaje ",
        "__2__",
        ". Ayuda a cuidar el ambiente con una actitud ",
        "__3__",
        ". ",
        "__4__",
        " tus materiales y unete hoy!",
      ],
      answers: ["limpia", "saludable", "escolar", "responsable", "trae"],
      options: ["limpia", "saludable", "escolar", "responsable", "trae", "pantalla", "amarga", "silencio", "cansada"],
    },
  ];

  let dragChip = null;
  let audioContext = null;

  function getStudentId() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      return session?.role === "student" ? session.id : "guest";
    } catch {
      return "guest";
    }
  }

  function initialState() {
    return {
      levelIndex: 0,
      placements: {},
      attempts: {},
      scores: {},
      medals: {},
      feedback: null,
      finished: false,
    };
  }

  function loadState() {
    const studentId = getStudentId();
    try {
      const all = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
      return all[studentId] || initialState();
    } catch {
      return initialState();
    }
  }

  function saveState(state) {
    const studentId = getStudentId();
    const all = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
    all[studentId] = state;
    localStorage.setItem(STATE_KEY, JSON.stringify(all));
  }

  function mount() {
    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    if (!card || card.dataset.radialFillReady === "1") return;
    card.dataset.radialFillReady = "1";

    const board = card.querySelector(".game-board");
    const actionRow = card.querySelector(".action-row");
    if (!board || !actionRow) return;

    const state = loadState();
    ensureLevelState(state);
    saveState(state);
    render(card, board, actionRow, state);
  }

  function ensureLevelState(state) {
    const level = LEVELS[state.levelIndex];
    state.placements[state.levelIndex] = state.placements[state.levelIndex] || {};
    level.answers.forEach((_, index) => {
      state.placements[state.levelIndex][index] = state.placements[state.levelIndex][index] || "";
    });
  }

  function render(card, board, actionRow, state) {
    if (state.finished) {
      renderFinal(board, actionRow, state);
      return;
    }

    const level = LEVELS[state.levelIndex];
    const placements = state.placements[state.levelIndex];
    const reviewed = (state.attempts[state.levelIndex] || 0) > 0;
    const usedWords = new Set(Object.values(placements).filter(Boolean));

    board.innerHTML = `
      <section class="radial-fill-app">
        <div class="radial-fill-topbar">
          <article class="radial-fill-stat">
            <div class="radial-kicker">Nivel</div>
            <strong>${level.title}</strong>
            <span>${level.subtitle}</span>
          </article>
          <article class="radial-fill-stat">
            <div class="radial-kicker">Puntaje</div>
            <strong>${getTotalScore(state)}</strong>
            <span>${getMedalLine(state)}</span>
          </article>
          <article class="radial-fill-stat">
            <div class="radial-kicker">Progreso</div>
            <strong>${state.levelIndex + 1}/${LEVELS.length}</strong>
            <span>avance del juego</span>
          </article>
        </div>

        <section class="radial-fill-help">
          <div>
            <div class="radial-kicker">Como jugar</div>
            <p>Arrastra las palabras del banco hacia los espacios vacios. Solo algunas palabras son correctas. Cuando todo tenga sentido, pulsa Verificar.</p>
          </div>
          <button class="real-ghost" type="button" data-fill-repeat="1">Repetir instrucciones</button>
        </section>

        <section class="radial-fill-stage">
          <div class="instruction-chip">Completa el anuncio radial con palabras persuasivas y coherentes</div>
          <div class="radial-fill-text">
            ${renderSentence(level, placements)}
          </div>
          <div class="radial-fill-bank">
            ${level.options.map((word) => `
              <button class="radial-fill-chip ${usedWords.has(word) ? "used" : ""}" draggable="${usedWords.has(word) ? "false" : "true"}" data-fill-word="${escapeHtml(word)}" type="button" ${usedWords.has(word) ? "disabled" : ""}>${word}</button>
            `).join("")}
          </div>
        </section>

        <section class="radial-fill-feedback ${state.feedback?.type || ""}">
          <div class="radial-kicker">Retroalimentacion</div>
          <strong>${state.feedback?.title || "Completa todos los espacios y revisa si el anuncio persuade correctamente."}</strong>
          <p>${state.feedback?.text || "Recuerda usar palabras que convenzan, conecten bien las ideas y mantengan la intencion comunicativa."}</p>
        </section>
      </section>
    `;

    actionRow.innerHTML = `
      <button class="real-ghost" type="button" data-fill-retry="1">Reintentar</button>
      <button class="real-action" type="button" data-fill-check="1">Verificar</button>
      <button class="real-action ${reviewed ? "" : "radial-disabled"}" type="button" data-fill-next="1" ${reviewed ? "" : "disabled"}>Siguiente nivel</button>
    `;

    bindBoard(board, state);
    bindActions(board, actionRow, state);
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
      chip.addEventListener("dragstart", () => {
        dragChip = chip;
        chip.classList.add("dragging");
        playTone("drag");
      });
      chip.addEventListener("dragend", () => {
        chip.classList.remove("dragging");
        dragChip = null;
      });
      chip.addEventListener("click", () => {
        const empty = [...board.querySelectorAll("[data-fill-slot]")].find((slot) => !slot.textContent || slot.textContent === "Arrastra aqui");
        if (empty) fillSlot(empty, chip.dataset.fillWord, state, board);
      });
    });

    board.querySelectorAll("[data-fill-slot]").forEach((slot) => {
      slot.addEventListener("dragover", (event) => event.preventDefault());
      slot.addEventListener("drop", (event) => {
        event.preventDefault();
        if (!dragChip) return;
        fillSlot(slot, dragChip.dataset.fillWord, state, board);
      });
      slot.addEventListener("click", () => {
        const index = Number(slot.dataset.fillSlot);
        if (!state.placements[state.levelIndex][index]) return;
        state.placements[state.levelIndex][index] = "";
        state.feedback = {
          type: "",
          title: "Palabra retirada",
          text: "Puedes arrastrar otra palabra al espacio vacio.",
        };
        saveState(state);
        render(board.closest(".play-card"), board, board.closest(".play-card").querySelector(".action-row"), state);
      });
    });
  }

  function fillSlot(slot, word, state, board) {
    const placements = state.placements[state.levelIndex];
    const slotIndex = Number(slot.dataset.fillSlot);

    Object.keys(placements).forEach((key) => {
      if (placements[key] === word) placements[key] = "";
    });

    placements[slotIndex] = word;
    slot.classList.add("filled");
    state.feedback = {
      type: "",
      title: "Palabra colocada",
      text: "Sigue completando el anuncio hasta que todas las ideas tengan sentido.",
    };
    saveState(state);
    playTone("drop");
    render(board.closest(".play-card"), board, board.closest(".play-card").querySelector(".action-row"), state);
  }

  function bindActions(board, actionRow, state) {
    actionRow.querySelector("[data-fill-repeat]")?.addEventListener("click", () => {});
    board.querySelector("[data-fill-repeat]")?.addEventListener("click", () => {
      state.feedback = {
        type: "",
        title: "Instrucciones repetidas",
        text: "Arrastra solo las palabras que completan el anuncio con coherencia y lenguaje persuasivo.",
      };
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });

    actionRow.querySelector("[data-fill-retry]")?.addEventListener("click", () => {
      state.placements[state.levelIndex] = {};
      ensureLevelState(state);
      state.feedback = {
        type: "",
        title: "Puedes volver a intentar",
        text: "Lee el anuncio completo y selecciona palabras que persuadan y conecten bien las ideas.",
      };
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });

    actionRow.querySelector("[data-fill-check]")?.addEventListener("click", () => {
      const level = LEVELS[state.levelIndex];
      const placements = state.placements[state.levelIndex];
      const current = level.answers.map((_, index) => placements[index] || "");
      state.attempts[state.levelIndex] = (state.attempts[state.levelIndex] || 0) + 1;

      const correctCount = level.answers.reduce((sum, answer, index) => sum + (current[index] === answer ? 1 : 0), 0);

      if (JSON.stringify(current) === JSON.stringify(level.answers)) {
        const tries = state.attempts[state.levelIndex];
        let score = tries === 1 ? 10 : tries === 2 ? 5 : Math.max(2, 5 - (tries - 2));
        const medal = tries === 1 ? 3 : tries === 2 ? 2 : 1;
        state.scores[state.levelIndex] = score;
        state.medals[state.levelIndex] = medal;
        state.feedback = {
          type: "success",
          title: "Muy bien, anuncio completo",
          text: `Completaste el nivel correctamente. Ganaste ${score} puntos y ${medal} estrella${medal > 1 ? "s" : ""}.`,
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
          title: "Revisa algunas palabras",
          text: `Completaste bien ${correctCount} de ${level.answers.length} espacios. ${level.hint}`,
        };
        playTone("error");
      }

      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });

    actionRow.querySelector("[data-fill-next]")?.addEventListener("click", () => {
      if ((state.attempts[state.levelIndex] || 0) === 0) return;
      if (state.levelIndex === LEVELS.length - 1) {
        state.finished = true;
      } else {
        state.levelIndex += 1;
        ensureLevelState(state);
        state.feedback = {
          type: "",
          title: `Preparado para ${LEVELS[state.levelIndex].title}`,
          text: "Arrastra las palabras correctas y completa el nuevo anuncio radial.",
        };
      }
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });
  }

  function renderFinal(board, actionRow, state) {
    const total = getTotalScore(state);
    const medals = Object.values(state.medals).reduce((sum, value) => sum + value, 0);
    board.innerHTML = `
      <section class="radial-final-screen">
        <div class="radial-kicker">Juego completado</div>
        <h3>Terminaste Completa con arrastre</h3>
        <p>Puntaje total: <strong>${total}</strong></p>
        <p>Estrellas acumuladas: <strong>${"★".repeat(Math.max(1, medals))}</strong></p>
        <p>${total >= 30 ? "Excelente trabajo. Ya completas anuncios radiales con coherencia y lenguaje persuasivo." : "Buen esfuerzo. Sigue practicando para mejorar la coherencia y la intencion comunicativa."}</p>
      </section>
    `;
    actionRow.innerHTML = `
      <button class="real-action" type="button" data-fill-replay="1">Volver a jugar</button>
      <button class="real-ghost" type="button" data-fill-close="1">Listo</button>
    `;

    actionRow.querySelector("[data-fill-replay]")?.addEventListener("click", () => {
      const next = initialState();
      ensureLevelState(next);
      saveState(next);
      mountReset();
    });
    actionRow.querySelector("[data-fill-close]")?.addEventListener("click", () => location.reload());
  }

  function mountReset() {
    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    const board = card?.querySelector(".game-board");
    const actionRow = card?.querySelector(".action-row");
    if (!card || !board || !actionRow) return;
    card.dataset.radialFillReady = "1";
    render(card, board, actionRow, loadState());
  }

  function getTotalScore(state) {
    return Object.values(state.scores).reduce((sum, value) => sum + value, 0);
  }

  function getMedalLine(state) {
    const medals = Object.values(state.medals).reduce((sum, value) => sum + value, 0);
    return medals ? "★".repeat(medals) : "sin medallas aun";
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
        c: ["C1"],
        msg: "Completaste anuncios radiales usando vocabulario persuasivo y coherencia textual.",
        topicId: "anuncio",
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {}
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
        drag: [330, 0.03],
        drop: [430, 0.04],
        success: [610, 0.09],
        error: [210, 0.07],
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
