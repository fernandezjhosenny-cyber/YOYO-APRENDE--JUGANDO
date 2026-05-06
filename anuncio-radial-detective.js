(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const TARGET_GAME = "anuncio-5";
  const SESSION_KEY = "yoyo_rg_x";
  const PROGRESS_KEY = "yoyo_rg_p";
  const STATE_KEY = "yoyo_radial_detective_state";

  const CASES = [
    {
      title: "Caso 1",
      subtitle: "Producto saludable",
      clue: "Observa el anuncio y descubre qu\u00E9 se vende, para qui\u00E9n es y c\u00F3mo convence.",
      ad: [
        "\u00BFQuieres cuidar tu salud?",
        "Prueba nuestro jugo natural.",
        "Es delicioso y lleno de vitaminas.",
        "\u00A1Compra ahora!",
      ],
      questions: [
        {
          id: "product",
          prompt: "\u00BFQu\u00E9 se anuncia?",
          answer: "Jugo",
          options: ["Jugo", "Libro", "Radio"],
          note: "El anuncio presenta un jugo natural como producto principal.",
        },
        {
          id: "audience",
          prompt: "\u00BFA qui\u00E9n va dirigido?",
          answer: "Personas que quieren cuidarse",
          options: ["Personas que quieren cuidarse", "Solo deportistas", "Ni\u00F1os que juegan f\u00FAtbol"],
          note: "La pregunta inicial conecta con personas interesadas en su salud.",
        },
        {
          id: "goal",
          prompt: "\u00BFQu\u00E9 quiere lograr el anuncio?",
          answer: "Que compren",
          options: ["Que compren", "Que dibujen", "Que apaguen la radio"],
          note: "La frase final invita directamente a comprar.",
        },
        {
          id: "word",
          prompt: "\u00BFQu\u00E9 palabra convence m\u00E1s?",
          answer: "delicioso",
          options: ["delicioso", "vitaminas", "natural"],
          note: "\u201cDelicioso\u201d busca despertar deseo y hacer el producto atractivo.",
        },
      ],
    },
    {
      title: "Caso 2",
      subtitle: "Producto de higiene",
      clue: "Lee el anuncio y analiza qu\u00E9 recurso usa para convencer al oyente.",
      ad: [
        "\u00BFTe gustar\u00EDa tener ropa m\u00E1s limpia?",
        "Usa nuestro detergente.",
        "Elimina manchas dif\u00EDciles.",
        "\u00A1Aprovecha hoy!",
      ],
      questions: [
        {
          id: "product",
          prompt: "\u00BFCu\u00E1l es el producto?",
          answer: "Detergente",
          options: ["Detergente", "Jab\u00F3n corporal", "Perfume"],
          note: "El anuncio dice claramente que el producto es un detergente.",
        },
        {
          id: "intent",
          prompt: "\u00BFCu\u00E1l es la intenci\u00F3n del anuncio?",
          answer: "Convencer",
          options: ["Convencer", "Narrar", "Explicar una receta"],
          note: "El anuncio usa lenguaje persuasivo para motivar la compra.",
        },
        {
          id: "benefit",
          prompt: "\u00BFQu\u00E9 beneficio presenta?",
          answer: "Elimina manchas",
          options: ["Elimina manchas", "Decora la casa", "Cambia el color de la ropa"],
          note: "Presentar beneficios concretos fortalece el mensaje publicitario.",
        },
        {
          id: "sentence",
          prompt: "\u00BFQu\u00E9 tipo de oraci\u00F3n aparece para atraer al oyente?",
          answer: "Interrogativa e imperativa",
          options: ["Interrogativa e imperativa", "Solo declarativa", "Exclamativa y po\u00E9tica"],
          note: "El anuncio usa una pregunta para captar atenci\u00F3n y una orden para mover a la acci\u00F3n.",
        },
      ],
    },
    {
      title: "Caso 3",
      subtitle: "Anuncio social",
      clue: "Investiga c\u00F3mo el anuncio orienta a la comunidad y previene un problema.",
      ad: [
        "\u00BFTe preocupa el dengue?",
        "Elimina el agua acumulada.",
        "Protege a tu familia.",
        "\u00A1Act\u00FAa hoy!",
      ],
      questions: [
        {
          id: "type",
          prompt: "\u00BFQu\u00E9 tipo de anuncio es?",
          answer: "Social",
          options: ["Social", "De entretenimiento", "De cocina"],
          note: "El anuncio busca orientar a la poblaci\u00F3n sobre un problema de salud.",
        },
        {
          id: "problem",
          prompt: "\u00BFCu\u00E1l es el problema mencionado?",
          answer: "Dengue",
          options: ["Dengue", "Basura escolar", "Ruido"],
          note: "El texto nombra directamente el dengue como riesgo.",
        },
        {
          id: "action",
          prompt: "\u00BFQu\u00E9 acci\u00F3n recomienda?",
          answer: "Eliminar el agua acumulada",
          options: ["Eliminar el agua acumulada", "Cerrar la radio", "Lavar la ropa"],
          note: "La acci\u00F3n preventiva aparece en forma de mandato claro.",
        },
        {
          id: "intent",
          prompt: "\u00BFQu\u00E9 quiere lograr el anuncio?",
          answer: "Prevenir",
          options: ["Prevenir", "Vender un juguete", "Contar una historia"],
          note: "Todo el mensaje busca prevenir enfermedades en la comunidad.",
        },
      ],
    },
    {
      title: "Caso 4",
      subtitle: "Mensaje con intenci\u00F3n impl\u00EDcita",
      clue: "Encuentra la emoci\u00F3n, la intenci\u00F3n escondida y el recurso persuasivo m\u00E1s fuerte.",
      ad: [
        "\u00BFQuieres un hogar m\u00E1s seguro y saludable?",
        "Revisa tu patio y elimina el agua acumulada.",
        "Una acci\u00F3n sencilla protege a tu familia y a tu comunidad.",
        "\u00A1Act\u00FAa hoy y evita enfermedades!",
      ],
      questions: [
        {
          id: "emotion",
          prompt: "\u00BFQu\u00E9 emoci\u00F3n busca activar el anuncio?",
          answer: "Cuidado y responsabilidad",
          options: ["Cuidado y responsabilidad", "Sue\u00F1o", "Aburrimiento"],
          note: "El anuncio intenta despertar preocupaci\u00F3n positiva por la familia y la comunidad.",
        },
        {
          id: "implicit",
          prompt: "\u00BFQu\u00E9 intenci\u00F3n impl\u00EDcita tiene el mensaje?",
          answer: "Mover a la acci\u00F3n inmediata",
          options: ["Mover a la acci\u00F3n inmediata", "Hacer re\u00EDr", "Explicar una noticia"],
          note: "El anuncio no solo informa: quiere que el oyente act\u00FAe de inmediato.",
        },
        {
          id: "language",
          prompt: "\u00BFQu\u00E9 ejemplo muestra mejor lenguaje persuasivo?",
          answer: "\u00A1Act\u00FAa hoy y evita enfermedades!",
          options: [
            "\u00A1Act\u00FAa hoy y evita enfermedades!",
            "Una acci\u00F3n sencilla protege a tu familia y a tu comunidad.",
            "\u00BFQuieres un hogar m\u00E1s seguro y saludable?",
          ],
          note: "La frase final combina urgencia, mandato y beneficio claro.",
        },
        {
          id: "audience",
          prompt: "\u00BFA qu\u00E9 p\u00FAblico se dirige principalmente?",
          answer: "Familias y comunidad",
          options: ["Familias y comunidad", "Pilotos", "Jugadores de b\u00E9isbol"],
          note: "Se enfoca en personas responsables del cuidado del hogar y su entorno.",
        },
      ],
    },
  ];

  let audioContext = null;

  function getStudentId() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      return session?.role === "student" ? session.id : "guest";
    } catch {
      return "guest";
    }
  }

  function createState() {
    return {
      caseIndex: 0,
      answers: {},
      checked: {},
      scores: {},
      stars: {},
      feedback: null,
      finished: false,
    };
  }

  function ensureState(state) {
    const caseKey = state.caseIndex;
    state.answers[caseKey] = state.answers[caseKey] || {};
    if (typeof state.checked[caseKey] !== "boolean") state.checked[caseKey] = false;
    if (typeof state.scores[caseKey] !== "number") state.scores[caseKey] = 0;
  }

  function loadState() {
    const studentId = getStudentId();
    try {
      const all = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
      return all[studentId] || createState();
    } catch {
      return createState();
    }
  }

  function saveState(state) {
    const studentId = getStudentId();
    const all = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
    all[studentId] = state;
    localStorage.setItem(STATE_KEY, JSON.stringify(all));
  }

  function totalScore(state) {
    return Object.values(state.scores).reduce((sum, value) => sum + value, 0);
  }

  function totalStars(state) {
    return Object.values(state.stars).reduce((sum, value) => sum + value, 0);
  }

  function mount() {
    renameActivityCard();

    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    if (!card || card.dataset.radialDetectiveReady === "1") return;
    card.dataset.radialDetectiveReady = "1";

    const title = card.querySelector(".play-top h3");
    const text = card.querySelector(".play-top .muted-main");
    if (title && title.textContent !== "5. Detective del anuncio") title.textContent = "5. Detective del anuncio";
    if (text && text.textContent !== "Analiza cada caso y descubre c\u00F3mo persuade el anuncio radial.") text.textContent = "Analiza cada caso y descubre c\u00F3mo persuade el anuncio radial.";

    const board = card.querySelector(".game-board");
    const actionRow = card.querySelector(".action-row");
    if (!board || !actionRow) return;

    const state = loadState();
    ensureState(state);
    saveState(state);
    render(card, board, actionRow, state);
  }

  function renameActivityCard() {
    app.querySelectorAll(`[data-oa="${TARGET_GAME}"]`).forEach((button) => {
      const heading = button.querySelector("h4");
      const copy = button.querySelector("p");
      if (heading && heading.textContent !== "5. Detective del anuncio") heading.textContent = "5. Detective del anuncio";
      if (copy && copy.textContent !== "Resuelve casos y descubre producto, p\u00FAblico, intenci\u00F3n y recursos persuasivos.") copy.textContent = "Resuelve casos y descubre producto, p\u00FAblico, intenci\u00F3n y recursos persuasivos.";
    });
  }

  function render(card, board, actionRow, state) {
    if (state.finished) {
      renderFinal(board, actionRow, state);
      return;
    }

    ensureState(state);
    const currentCase = CASES[state.caseIndex];
    const answers = state.answers[state.caseIndex];
    const checked = state.checked[state.caseIndex];

    board.innerHTML = `
      <section class="detective-app">
        <div class="detective-topbar">
          <article class="detective-stat">
            <div class="radial-kicker">Caso activo</div>
            <strong>${currentCase.title}</strong>
            <span>${currentCase.subtitle}</span>
          </article>
          <article class="detective-stat">
            <div class="radial-kicker">Archivo resuelto</div>
            <strong>${state.caseIndex + 1}/${CASES.length}</strong>
            <span>${checked ? "verificado" : "en investigaci\u00F3n"}</span>
          </article>
          <article class="detective-stat">
            <div class="radial-kicker">Puntaje</div>
            <strong>${totalScore(state)}</strong>
            <span>${"\u2605".repeat(Math.max(1, totalStars(state) || 1))}</span>
          </article>
        </div>

        <section class="detective-brief">
          <div class="detective-icon">\uD83D\uDD0E</div>
          <div>
            <div class="radial-kicker">Misi\u00F3n</div>
            <p>${currentCase.clue}</p>
          </div>
          <button class="real-ghost" type="button" data-detective-repeat="1">Repetir pista</button>
        </section>

        <section class="detective-case-card">
          <div class="detective-case-head">
            <span class="case-badge">\uD83D\uDCC1 Archivo del caso</span>
            <span class="case-badge">\uD83C\uDFAF Anuncio radial</span>
          </div>
          <div class="detective-ad">
            ${currentCase.ad.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
          </div>
        </section>

        <section class="detective-question-grid">
          ${currentCase.questions
            .map((question, questionIndex) => {
              const selected = answers[question.id];
              const isRight = checked && selected === question.answer;
              const isWrong = checked && selected && selected !== question.answer;
              return `
                <article class="detective-question-card ${isRight ? "correct" : ""} ${isWrong ? "wrong" : ""}">
                  <div class="detective-question-top">
                    <span class="question-index">Pista ${questionIndex + 1}</span>
                    <h4>${escapeHtml(question.prompt)}</h4>
                  </div>
                  <div class="detective-option-grid">
                    ${question.options
                      .map((option) => {
                        const optionState = checked
                          ? option === question.answer
                            ? "answer"
                            : option === selected
                              ? "selected-wrong"
                              : ""
                          : option === selected
                            ? "selected"
                            : "";
                        return `
                          <button
                            class="detective-option ${optionState}"
                            data-detective-question="${question.id}"
                            data-detective-option="${escapeHtml(option)}"
                            type="button"
                            ${checked ? "disabled" : ""}
                          >
                            ${escapeHtml(option)}
                          </button>
                        `;
                      })
                      .join("")}
                  </div>
                  ${
                    checked
                      ? `<div class="detective-note ${isRight ? "success" : "error"}">${escapeHtml(question.note)}</div>`
                      : ""
                  }
                </article>
              `;
            })
            .join("")}
        </section>

        <section class="radial-fill-feedback ${state.feedback?.type || ""}">
          <div class="radial-kicker">Retroalimentaci\u00F3n</div>
          <strong>${state.feedback?.title || "Lee el anuncio y responde como un detective del mensaje."}</strong>
          <p>${state.feedback?.text || "Descubre qu\u00E9 se anuncia, a qui\u00E9n se dirige, qu\u00E9 quiere lograr y qu\u00E9 recurso usa para persuadir."}</p>
        </section>

        <details class="radial-teacher-panel detective-teacher-panel">
          <summary>Panel docente</summary>
          <div class="radial-teacher-grid">
            <article>
              <h4>Objetivo</h4>
              <p>Analizar anuncios radiales y comprender su intenci\u00F3n.</p>
            </article>
            <article>
              <h4>Competencias</h4>
              <p>Comunicativa, pensamiento cr\u00EDtico, \u00E9tica y ciudadana.</p>
            </article>
            <article>
              <h4>Uso</h4>
              <p>Actividad de an\u00E1lisis y comprensi\u00F3n del anuncio radial.</p>
            </article>
            <article>
              <h4>Enfoque</h4>
              <p>Reconoce producto, p\u00FAblico, intenci\u00F3n, lenguaje persuasivo y tipos de oraciones.</p>
            </article>
          </div>
        </details>
      </section>
    `;

    const hasAnyAnswer = currentCase.questions.some((question) => answers[question.id]);
    const levelReviewed = checked;

    actionRow.innerHTML = `
      <button class="real-ghost" type="button" data-detective-retry="1">Reintentar</button>
      <button class="real-action" type="button" data-detective-check="1" ${hasAnyAnswer && !checked ? "" : "disabled"}>Verificar</button>
      <button class="real-action ${levelReviewed ? "" : "radial-disabled"}" type="button" data-detective-next="1" ${levelReviewed ? "" : "disabled"}>Siguiente caso</button>
    `;

    bindBoard(board, actionRow, state);
    bindActions(board, actionRow, state);
  }

  function bindBoard(board, actionRow, state) {
    board.querySelectorAll("[data-detective-option]").forEach((button) => {
      button.addEventListener("click", () => {
        if (state.checked[state.caseIndex]) return;
        const questionId = button.dataset.detectiveQuestion;
        const option = decodeHtml(button.dataset.detectiveOption);
        state.answers[state.caseIndex][questionId] = option;
        state.feedback = {
          type: "",
          title: "Pista marcada",
          text: "Sigue revisando el anuncio hasta completar todas las respuestas del caso.",
        };
        playTone("advance");
        saveState(state);
        render(board.closest(".play-card"), board, actionRow, state);
      });
    });
  }

  function bindActions(board, actionRow, state) {
    board.querySelector("[data-detective-repeat]")?.addEventListener("click", () => {
      state.feedback = {
        type: "",
        title: "Pista repetida",
        text: CASES[state.caseIndex].clue,
      };
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });

    actionRow.querySelector("[data-detective-retry]")?.addEventListener("click", () => {
      state.answers[state.caseIndex] = {};
      state.checked[state.caseIndex] = false;
      state.scores[state.caseIndex] = 0;
      state.feedback = {
        type: "",
        title: "Caso reiniciado",
        text: "Vuelve a leer el anuncio y analiza mejor las pistas antes de verificar.",
      };
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });

    actionRow.querySelector("[data-detective-check]")?.addEventListener("click", () => {
      const currentCase = CASES[state.caseIndex];
      const answers = state.answers[state.caseIndex];
      const correctCount = currentCase.questions.reduce(
        (sum, question) => sum + (answers[question.id] === question.answer ? 1 : 0),
        0
      );

      state.checked[state.caseIndex] = true;
      state.scores[state.caseIndex] = correctCount * 10;
      state.stars[state.caseIndex] = correctCount === currentCase.questions.length ? 3 : correctCount >= 3 ? 2 : 1;

      if (correctCount === currentCase.questions.length) {
        state.feedback = {
          type: "success",
          title: "Caso resuelto",
          text: `Excelente investigaci\u00F3n. Resolviste ${correctCount} de ${currentCase.questions.length} pistas correctamente.`,
        };
        playTone("success");
      } else {
        state.feedback = {
          type: "error",
          title: "Revisa el archivo",
          text: `Respondiste bien ${correctCount} de ${currentCase.questions.length}. Lee las explicaciones y vuelve a intentarlo si quieres mejorar.`,
        };
        playTone("error");
      }

      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });

    actionRow.querySelector("[data-detective-next]")?.addEventListener("click", () => {
      if (!state.checked[state.caseIndex]) return;
      if (state.caseIndex === CASES.length - 1) {
        state.finished = true;
        playTone("mission");
      } else {
        state.caseIndex += 1;
        ensureState(state);
        state.feedback = {
          type: "",
          title: `Nuevo archivo: ${CASES[state.caseIndex].title}`,
          text: CASES[state.caseIndex].clue,
        };
        playTone("advance");
      }
      saveState(state);
      render(board.closest(".play-card"), board, actionRow, state);
    });
  }

  function renderFinal(board, actionRow, state) {
    const score = totalScore(state);
    const stars = totalStars(state);
    board.innerHTML = `
      <section class="radial-final-screen detective-final-screen">
        <div class="radial-kicker">Misi\u00F3n completada</div>
        <h3>Terminaste Detective del anuncio</h3>
        <p>Puntuaci\u00F3n total: <strong>${score}</strong></p>
        <p>Estrellas acumuladas: <strong>${"\u2605".repeat(Math.max(1, stars))}</strong></p>
        <p>${score >= 140 ? "Excelente. Analizas anuncios radiales con mirada cr\u00EDtica y reconoces c\u00F3mo persuaden." : "Buen trabajo. Sigue practicando c\u00F3mo el anuncio presenta producto, p\u00FAblico e intenci\u00F3n comunicativa."}</p>
      </section>
    `;

    actionRow.innerHTML = `
      <button class="real-action" type="button" data-detective-replay="1">Volver a jugar</button>
      <button class="real-ghost" type="button" data-detective-close="1">Listo</button>
    `;

    actionRow.querySelector("[data-detective-replay]")?.addEventListener("click", () => {
      const next = createState();
      ensureState(next);
      saveState(next);
      mountReset();
    });
    actionRow.querySelector("[data-detective-close]")?.addEventListener("click", () => location.reload());
  }

  function mountReset() {
    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    const board = card?.querySelector(".game-board");
    const actionRow = card?.querySelector(".action-row");
    if (!card || !board || !actionRow) return;
    render(card, board, actionRow, loadState());
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
        c: ["C1", "C2", "C3"],
        msg: "Analizaste anuncios radiales y descubriste producto, p\u00FAblico, intenci\u00F3n y lenguaje persuasivo.",
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
        success: [620, 0.08],
        error: [220, 0.08],
        advance: [430, 0.06],
        mission: [760, 0.18],
      };
      const [frequency, duration] = presets[type] || presets.advance;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch {}
  }

  function decodeHtml(text) {
    const area = document.createElement("textarea");
    area.innerHTML = text;
    return area.value;
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
