(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const TARGET_GAME = "oda-7";
  const SESSION_KEY = "yoyo_rg_x";
  const PROGRESS_KEY = "yoyo_rg_p";

  const LEVELS = [
    {
      title: "Nivel 1",
      subtitle: "Conceptos de la oda",
      prompt: "Relaciona cada concepto con su definicion correcta.",
      hint: "Busca el significado que mejor explique la idea.",
      pairs: [
        ["Oda", "Poema que expresa admiracion o alabanza."],
        ["Verso", "Cada linea de un poema."],
        ["Objeto lirico", "Persona, animal, cosa o idea que se alaba."],
        ["Adjetivo", "Palabra que expresa cualidades."],
        ["Sentimiento", "Emocion que transmite el poema."]
      ]
    },
    {
      title: "Nivel 2",
      subtitle: "Figuras literarias",
      prompt: "Relaciona cada figura literaria con su ejemplo.",
      hint: "Recuerda que la comparacion usa la palabra como.",
      pairs: [
        ["Comparacion", "Eres veloz como el viento."],
        ["Metafora", "Eres un rayo brillante."],
        ["Personificacion", "La bicicleta canta en el camino."],
        ["Hiperbole", "Tu luz llena todo el cielo."],
        ["Adjetivacion", "Hermosa, dulce y tranquila."]
      ]
    },
    {
      title: "Nivel 3",
      subtitle: "Interpretacion de fragmentos",
      prompt: "Relaciona cada fragmento con su interpretacion.",
      hint: "La personificacion da acciones humanas a objetos.",
      pairs: [
        ["El sol se desgranaba como maiz ardiendo", "El sol brillaba fuerte y hacia mucho calor."],
        ["Las bicicletas eran insectos transparentes", "Parecian ligeras, rapidas y en movimiento."],
        ["Juguetes silenciosos, grandes anorados", "Se extranian los juguetes tranquilos."],
        ["Voces de robot y musicas metalizadas", "Critica a los juguetes ruidosos."],
        ["Tu silencio calma mi corazon", "El silencio transmite paz y emocion."]
      ]
    }
  ];

  let observerBound = false;

  function renameActivityCard() {
    app.querySelectorAll(`[data-oa="${TARGET_GAME}"]`).forEach((button) => {
      const heading = button.querySelector("h4");
      const copy = button.querySelector("p");
      if (heading && heading.textContent !== "7. Relaciona ideas") heading.textContent = "7. Relaciona ideas";
      if (copy && copy.textContent !== "Relaciona conceptos, ejemplos e interpretaciones de la oda.") copy.textContent = "Relaciona conceptos, ejemplos e interpretaciones de la oda.";
    });
  }

  function clearLegacyFeedback(card) {
    card.querySelectorAll(".radial-feedback").forEach((node) => node.remove());
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
        score: Math.max(1, Math.min(10, Math.round(totalScore(state) / 15))),
        c: ["C1", "C2"],
        msg: "Relacionaste conceptos, figuras e interpretaciones de la oda.",
        topicId: "oda"
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {}
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function baseState() {
    return {
      levelIndex: 0,
      activePrompt: "",
      answers: [{}, {}, {}],
      options: [null, null, null],
      checked: false,
      scores: [0, 0, 0],
      feedback: {
        type: "",
        title: "Relaciona las ideas",
        text: "Primero selecciona una idea de la columna A y luego una opcion de la columna B."
      },
      finished: false
    };
  }

  function ensureOptions(state) {
    if (!state.options[state.levelIndex]) {
      state.options[state.levelIndex] = shuffle(LEVELS[state.levelIndex].pairs.map((pair) => pair[1]));
    }
    return state.options[state.levelIndex];
  }

  function mount() {
    renameActivityCard();
    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    if (!card || card.dataset.oda7SimpleReady === "1") return;
    card.dataset.oda7SimpleReady = "1";

    const title = card.querySelector(".play-top h3");
    const text = card.querySelector(".play-top .muted-main");
    const board = card.querySelector(".game-board");
    const actionRow = card.querySelector(".action-row");
    if (!board || !actionRow) return;

    if (title && title.textContent !== "7. Relaciona ideas") title.textContent = "7. Relaciona ideas";
    if (text && text.textContent !== "Relaciona conceptos de la oda con su definicion, ejemplo o interpretacion.") text.textContent = "Relaciona conceptos de la oda con su definicion, ejemplo o interpretacion.";

    clearLegacyFeedback(card);
    card._oda7State = baseState();
    render(card, board, actionRow);
  }

  function render(card, board, actionRow) {
    clearLegacyFeedback(card);
    const state = card._oda7State || baseState();
    card._oda7State = state;

    if (state.finished) {
      renderFinal(card, board, actionRow, state);
      return;
    }

    const level = LEVELS[state.levelIndex];
    const answers = state.answers[state.levelIndex] || {};
    const options = ensureOptions(state);
    const answeredCount = Object.keys(answers).length;

    board.innerHTML = `
      <section class="radial-pair-app oda-pair-app">
        <div class="radial-fill-topbar">
          <article class="radial-fill-stat">
            <div class="radial-kicker">Nivel</div>
            <strong>${level.title}</strong>
            <span>${level.subtitle}</span>
          </article>
          <article class="radial-fill-stat">
            <div class="radial-kicker">Puntos acumulados</div>
            <strong>${totalScore(state)}</strong>
            <span>+10 correcto</span>
          </article>
          <article class="radial-fill-stat">
            <div class="radial-kicker">Meta</div>
            <strong>${answeredCount}/${level.pairs.length}</strong>
            <span>relaciones</span>
          </article>
        </div>

        <section class="radial-fill-help">
          <div>
            <div class="radial-kicker">Como jugar</div>
            <p>${level.prompt}</p>
          </div>
          <button class="real-ghost" type="button" data-oda7-hint="1">Pista</button>
        </section>

        <section class="radial-pair-stage oda-pair-simple-stage">
          <div class="instruction-chip">Selecciona una idea y luego su pareja correcta</div>
          <div class="oda-pair-columns">
            <section class="oda-pair-column">
              <div class="radial-kicker">Columna A</div>
              <div class="oda-pair-stack">
                ${level.pairs.map(([prompt]) => `
                  <button class="pair-pack-card radial-link-card oda-pair-prompt ${state.activePrompt === prompt ? "active" : ""}" type="button" data-oda7-prompt="${prompt}" ${state.checked ? "disabled" : ""}>
                    <h4>${prompt}</h4>
                    <p>${answers[prompt] ? "Relacion elegida" : "Toca para seleccionar"}</p>
                  </button>
                `).join("")}
              </div>
            </section>

            <section class="oda-pair-column">
              <div class="radial-kicker">Columna B</div>
              <div class="oda-pair-stack">
                ${options.map((option) => {
                  const used = Object.values(answers).includes(option);
                  return `
                    <button class="choice-card pair-choice radial-link-option oda-pair-option ${used ? "used" : ""}" type="button" data-oda7-option="${option}" ${state.checked ? "disabled" : ""}>
                      ${option}
                    </button>`;
                }).join("")}
              </div>
            </section>
          </div>

          <div class="oda-pair-summary">
            ${level.pairs.map(([prompt]) => `
              <article class="oda-pair-summary-row ${state.checked ? (answers[prompt] === level.pairs.find((pair) => pair[0] === prompt)[1] ? "correct" : "wrong") : ""}">
                <strong>${prompt}</strong>
                <span>${answers[prompt] || "Sin relacion"}</span>
              </article>
            `).join("")}
          </div>
        </section>

        <section class="radial-fill-feedback ${state.feedback.type || ""}">
          <div class="radial-kicker">Retroalimentacion</div>
          <strong>${state.feedback.title}</strong>
          <p>${state.feedback.text}</p>
        </section>
      </section>`;

    actionRow.innerHTML = `
      <button class="real-ghost" type="button" data-oda7-reset="1">Reintentar</button>
      <button class="real-action" type="button" data-oda7-check="1" ${answeredCount > 0 && !state.checked ? "" : "disabled"}>Verificar</button>
      <button class="real-action ${state.checked ? "" : "radial-disabled"}" type="button" data-oda7-next="1" ${state.checked ? "" : "disabled"}>${state.levelIndex === LEVELS.length - 1 ? "Finalizar" : "Siguiente nivel"}</button>`;

    bind(card, board, actionRow);
  }

  function renderFinal(card, board, actionRow, state) {
    const score = totalScore(state);
    const result = score >= 120 ? "Excelente" : score >= 70 ? "Aprobado" : "Necesita mejorar";
    board.innerHTML = `
      <section class="radial-final-screen radial-pair-final">
        <div class="radial-kicker">Actividad completada</div>
        <h3>Terminaste Relaciona ideas</h3>
        <p>Puntuacion total: <strong>${score}</strong></p>
        <p><strong>${result}</strong></p>
      </section>`;

    actionRow.innerHTML = `
      <button class="real-action" type="button" data-oda7-replay="1">Volver a jugar</button>`;

    actionRow.querySelector("[data-oda7-replay]")?.addEventListener("click", () => {
      card._oda7State = baseState();
      render(card, card.querySelector(".game-board"), actionRow);
    });
  }

  function bind(card, board, actionRow) {
    const state = card._oda7State;
    const level = LEVELS[state.levelIndex];

    board.querySelectorAll("[data-oda7-prompt]").forEach((button) => {
      button.addEventListener("click", () => {
        if (state.checked) return;
        state.activePrompt = button.dataset.oda7Prompt;
        state.feedback = {
          type: "",
          title: "Idea seleccionada",
          text: "Ahora elige en la columna B la opcion que mejor corresponda."
        };
        render(card, card.querySelector(".game-board"), actionRow);
      });
    });

    board.querySelectorAll("[data-oda7-option]").forEach((button) => {
      button.addEventListener("click", () => {
        if (state.checked || !state.activePrompt) return;
        const option = button.dataset.oda7Option;
        const answers = { ...state.answers[state.levelIndex] };
        Object.keys(answers).forEach((key) => {
          if (answers[key] === option) delete answers[key];
        });
        answers[state.activePrompt] = option;
        state.answers[state.levelIndex] = answers;
        state.feedback = {
          type: "",
          title: "Relacion marcada",
          text: "Puedes seguir relacionando ideas o verificar cuando termines."
        };
        render(card, card.querySelector(".game-board"), actionRow);
      });
    });

    board.querySelector("[data-oda7-hint]")?.addEventListener("click", () => {
      state.feedback = {
        type: "",
        title: "Pista",
        text: level.hint
      };
      render(card, card.querySelector(".game-board"), actionRow);
    });

    actionRow.querySelector("[data-oda7-reset]")?.addEventListener("click", () => {
      state.answers[state.levelIndex] = {};
      state.options[state.levelIndex] = shuffle(level.pairs.map((pair) => pair[1]));
      state.activePrompt = "";
      state.checked = false;
      state.scores[state.levelIndex] = 0;
      state.feedback = {
        type: "",
        title: "Nivel reiniciado",
        text: "Vuelve a relacionar las ideas con calma."
      };
      render(card, card.querySelector(".game-board"), actionRow);
    });

    actionRow.querySelector("[data-oda7-check]")?.addEventListener("click", () => {
      const answers = state.answers[state.levelIndex] || {};
      let correct = 0;
      let wrong = 0;
      level.pairs.forEach(([prompt, answer]) => {
        if (!answers[prompt]) return;
        if (answers[prompt] === answer) correct += 1;
        else wrong += 1;
      });
      state.checked = true;
      state.scores[state.levelIndex] = Math.max(0, correct * 10 - wrong * 5);
      if (correct === level.pairs.length) {
        state.feedback = {
          type: "success",
          title: "Correcto",
          text: "Relacionaste correctamente las ideas de este nivel."
        };
      } else {
        state.feedback = {
          type: "error",
          title: "Por revisar",
          text: `Tienes ${correct} relaciones correctas. ${level.hint}`
        };
      }
      persistProgress(state);
      render(card, card.querySelector(".game-board"), actionRow);
    });

    actionRow.querySelector("[data-oda7-next]")?.addEventListener("click", () => {
      if (!state.checked) return;
      if (state.levelIndex === LEVELS.length - 1) {
        state.finished = true;
      } else {
        state.levelIndex += 1;
        state.activePrompt = "";
        state.checked = false;
        state.feedback = {
          type: "",
          title: "Siguiente nivel",
          text: "Ahora relaciona nuevas ideas de la oda."
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
