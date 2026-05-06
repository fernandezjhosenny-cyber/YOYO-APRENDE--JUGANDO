(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const TARGET_GAME = "oda-5";
  const SESSION_KEY = "yoyo_rg_x";
  const PROGRESS_KEY = "yoyo_rg_p";

  const LEVELS = [
    {
      title: "Nivel 1",
      fragment: "Oh hermosa bicicleta",
      question: "Que se alaba?",
      options: ["Bicicleta", "Sol", "Mesa"],
      answer: "Bicicleta",
      note: "En este fragmento se alaba a la bicicleta."
    },
    {
      title: "Nivel 2",
      fragment: "Corres como el viento",
      question: "Que significa?",
      options: ["Va muy rapido", "Esta parada", "Esta rota"],
      answer: "Va muy rapido",
      note: "La comparacion indica que se mueve con mucha rapidez."
    },
    {
      title: "Nivel 3",
      fragment: "La bicicleta canta",
      question: "Que figura es?",
      options: ["Personificacion", "Noticia", "Enumeracion"],
      answer: "Personificacion",
      note: "Hay personificacion porque se da una accion humana a la bicicleta."
    }
  ];

  let observerBound = false;

  function renameActivityCard() {
    app.querySelectorAll(`[data-oa="${TARGET_GAME}"]`).forEach((button) => {
      const heading = button.querySelector("h4");
      const copy = button.querySelector("p");
      if (heading && heading.textContent !== "5. Detective de la oda") {
        heading.textContent = "5. Detective de la oda";
      }
      if (copy && copy.textContent !== "Lee un fragmento de la oda, responde una pregunta y verifica tu respuesta.") {
        copy.textContent = "Lee un fragmento de la oda, responde una pregunta y verifica tu respuesta.";
      }
    });
  }

  function clearLegacyFeedback(card) {
    card.querySelectorAll(".radial-feedback").forEach((node) => node.remove());
  }

  function totalScore(state) {
    return state.scores.reduce((sum, value) => sum + value, 0);
  }

  function getSessionId() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      return session && session.id ? session.id : null;
    } catch {
      return null;
    }
  }

  function persistProgress(state) {
    try {
      const studentId = getSessionId();
      if (!studentId) return;
      const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
      progress[studentId] = progress[studentId] || {};
      progress[studentId][TARGET_GAME] = {
        ok: state.levelIndex >= LEVELS.length - 1 && state.checked,
        score: Math.max(1, Math.min(10, Math.round(totalScore(state) / 3))),
        c: ["C1", "C2"],
        msg: "Analizaste fragmentos breves de la oda y respondiste preguntas de comprension.",
        topicId: "oda"
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {}
  }

  function baseState() {
    return {
      levelIndex: 0,
      selected: ["", "", ""],
      checked: false,
      scores: [0, 0, 0],
      feedback: {
        type: "",
        title: "Lee el fragmento",
        text: "Elige una opcion y luego presiona Verificar."
      },
      finished: false
    };
  }

  function mount() {
    renameActivityCard();
    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    if (!card || card.dataset.oda5SimpleReady === "1") return;
    card.dataset.oda5SimpleReady = "1";

    const title = card.querySelector(".play-top h3");
    const text = card.querySelector(".play-top .muted-main");
    const board = card.querySelector(".game-board");
    const actionRow = card.querySelector(".action-row");
    if (!board || !actionRow) return;

    if (title && title.textContent !== "5. Detective de la oda") {
      title.textContent = "5. Detective de la oda";
    }
    if (text && text.textContent !== "Lee un fragmento de la oda, responde una pregunta sencilla y verifica si esta correcta.") {
      text.textContent = "Lee un fragmento de la oda, responde una pregunta sencilla y verifica si esta correcta.";
    }

    clearLegacyFeedback(card);
    card._oda5SimpleState = baseState();
    render(card, board, actionRow);
  }

  function render(card, board, actionRow) {
    clearLegacyFeedback(card);
    const state = card._oda5SimpleState || baseState();
    card._oda5SimpleState = state;

    if (state.finished) {
      renderFinal(card, board, actionRow, state);
      return;
    }

    const level = LEVELS[state.levelIndex];
    const selected = state.selected[state.levelIndex] || "";

    board.innerHTML = `
      <section class="detective-app">
        <div class="detective-topbar">
          <article class="detective-stat">
            <div class="radial-kicker">Nivel</div>
            <strong>${level.title}</strong>
            <span>Pregunta ${state.levelIndex + 1} de ${LEVELS.length}</span>
          </article>
          <article class="detective-stat">
            <div class="radial-kicker">Puntos</div>
            <strong>${totalScore(state)}</strong>
            <span>+10 por acierto</span>
          </article>
          <article class="detective-stat">
            <div class="radial-kicker">Meta</div>
            <strong>Comprender la oda</strong>
            <span>Respuesta sencilla</span>
          </article>
        </div>

        <section class="detective-case-card">
          <div class="detective-case-head">
            <span class="status-badge">${level.title}</span>
          </div>
          <article class="detective-ad">
            <div class="radial-kicker">Fragmento</div>
            <p>${level.fragment}</p>
          </article>
          <article class="detective-question-card ${state.checked ? (selected === level.answer ? "correct" : "wrong") : ""}">
            <div class="detective-question-top">
              <span class="question-index">Pregunta</span>
              <h4>${level.question}</h4>
            </div>
            <div class="detective-option-grid">
              ${level.options.map((option) => {
                const classes = ["detective-option"];
                if (!state.checked && selected === option) classes.push("selected");
                if (state.checked && option === level.answer) classes.push("answer");
                if (state.checked && selected === option && option !== level.answer) classes.push("selected-wrong");
                return `<button class="${classes.join(" ")}" type="button" data-oda5-option="${option}">${option}</button>`;
              }).join("")}
            </div>
          </article>
          <section class="radial-fill-feedback ${state.feedback.type || ""}">
            <div class="radial-kicker">Retroalimentacion</div>
            <strong>${state.feedback.title}</strong>
            <p>${state.feedback.text}</p>
          </section>
        </section>
      </section>`;

    actionRow.innerHTML = `
      <button class="real-ghost" type="button" data-oda5-reset="1">Reintentar</button>
      <button class="real-action" type="button" data-oda5-check="1">Verificar</button>
      <button class="real-action ${state.checked ? "" : "radial-disabled"}" type="button" data-oda5-next="1" ${state.checked ? "" : "disabled"}>${state.levelIndex === LEVELS.length - 1 ? "Finalizar" : "Siguiente"}</button>`;

    bind(card, board, actionRow);
  }

  function renderFinal(card, board, actionRow, state) {
    board.innerHTML = `
      <section class="radial-final-screen detective-final-screen">
        <div class="radial-kicker">Actividad completada</div>
        <h3>Terminaste Detective de la oda</h3>
        <p>Puntuacion total: <strong>${totalScore(state)}</strong></p>
        <p>${totalScore(state) >= 20 ? "Muy buen trabajo interpretando los fragmentos." : "Sigue practicando la interpretacion de la oda."}</p>
      </section>`;

    actionRow.innerHTML = `
      <button class="real-action" type="button" data-oda5-replay="1">Volver a jugar</button>`;

    actionRow.querySelector("[data-oda5-replay]")?.addEventListener("click", () => {
      card._oda5SimpleState = baseState();
      render(card, card.querySelector(".game-board"), actionRow);
    });
  }

  function bind(card, board, actionRow) {
    const state = card._oda5SimpleState;
    const level = LEVELS[state.levelIndex];

    board.querySelectorAll("[data-oda5-option]").forEach((button) => {
      button.addEventListener("click", () => {
        if (state.checked) return;
        state.selected[state.levelIndex] = button.dataset.oda5Option;
        state.feedback = {
          type: "",
          title: "Respuesta elegida",
          text: "Ahora presiona Verificar para revisar tu respuesta."
        };
        render(card, card.querySelector(".game-board"), actionRow);
      });
    });

    actionRow.querySelector("[data-oda5-reset]")?.addEventListener("click", () => {
      state.selected[state.levelIndex] = "";
      state.checked = false;
      state.scores[state.levelIndex] = 0;
      state.feedback = {
        type: "",
        title: "Intentalo de nuevo",
        text: "Lee otra vez el fragmento y elige la mejor opcion."
      };
      render(card, card.querySelector(".game-board"), actionRow);
    });

    actionRow.querySelector("[data-oda5-check]")?.addEventListener("click", () => {
      const choice = state.selected[state.levelIndex];
      if (!choice) {
        state.feedback = {
          type: "error",
          title: "Falta responder",
          text: "Primero debes elegir una opcion."
        };
        render(card, card.querySelector(".game-board"), actionRow);
        return;
      }

      state.checked = true;
      if (choice === level.answer) {
        state.scores[state.levelIndex] = 10;
        state.feedback = {
          type: "success",
          title: "Correcto",
          text: level.note
        };
      } else {
        state.scores[state.levelIndex] = 0;
        state.feedback = {
          type: "error",
          title: "Incorrecto",
          text: `La respuesta correcta es: ${level.answer}. ${level.note}`
        };
      }
      persistProgress(state);
      render(card, card.querySelector(".game-board"), actionRow);
    });

    actionRow.querySelector("[data-oda5-next]")?.addEventListener("click", () => {
      if (!state.checked) return;
      if (state.levelIndex === LEVELS.length - 1) {
        state.finished = true;
      } else {
        state.levelIndex += 1;
        state.checked = false;
        state.feedback = {
          type: "",
          title: "Siguiente nivel",
          text: "Lee el nuevo fragmento y responde la siguiente pregunta."
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
