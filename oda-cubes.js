(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const TARGET_GAME = "oda-6";
  const SESSION_KEY = "yoyo_rg_x";
  const PROGRESS_KEY = "yoyo_rg_p";

  const LEVELS = [
    {
      title: "Nivel 1",
      subtitle: "Basico",
      prompt: "Ordena los versos desde el inicio emotivo hasta el cierre emotivo.",
      labels: [
        "1. Inicio emotivo",
        "2. Cualidad o descripcion",
        "3. Lenguaje poetico",
        "4. Cierre emotivo"
      ],
      cubes: [
        "Oh hermosa bicicleta",
        "Eres veloz y brillante",
        "Corres como el viento",
        "Por eso te admiro"
      ],
      correct: [
        "Oh hermosa bicicleta",
        "Eres veloz y brillante",
        "Corres como el viento",
        "Por eso te admiro"
      ]
    },
    {
      title: "Nivel 2",
      subtitle: "Intermedio",
      prompt: "Construye la oda ordenando los cuatro versos poeticos.",
      labels: [
        "1. Inicio emotivo",
        "2. Cualidad o descripcion",
        "3. Lenguaje poetico",
        "4. Cierre emotivo"
      ],
      cubes: [
        "Oh flor pequena y dulce",
        "Tu perfume alegra la manana",
        "Eres una estrella de colores",
        "Gracias por llenar de belleza mi camino"
      ],
      correct: [
        "Oh flor pequena y dulce",
        "Tu perfume alegra la manana",
        "Eres una estrella de colores",
        "Gracias por llenar de belleza mi camino"
      ]
    },
    {
      title: "Nivel 3",
      subtitle: "Avanzado",
      prompt: "Elige solo los versos poeticos y ordinalos correctamente.",
      labels: [
        "1. Inicio emotivo",
        "2. Cualidad o descripcion",
        "3. Lenguaje poetico",
        "4. Cierre emotivo"
      ],
      cubes: [
        "Oh juguetes silenciosos",
        "Guardan suenos y recuerdos",
        "Me hablan como viejos amigos",
        "Por eso viven en mi corazon",
        "La mesa tiene cuatro patas",
        "Hoy es martes"
      ],
      correct: [
        "Oh juguetes silenciosos",
        "Guardan suenos y recuerdos",
        "Me hablan como viejos amigos",
        "Por eso viven en mi corazon"
      ]
    }
  ];

  let observerBound = false;

  function renameActivityCard() {
    app.querySelectorAll(`[data-oa="${TARGET_GAME}"]`).forEach((button) => {
      const heading = button.querySelector("h4");
      const copy = button.querySelector("p");
      if (heading && heading.textContent !== "6. Cubos 3D") heading.textContent = "6. Cubos 3D";
      if (copy && copy.textContent !== "Ordena versos para construir una oda breve y coherente.") copy.textContent = "Ordena versos para construir una oda breve y coherente.";
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

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function sameOrder(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    return a.every((item, index) => item === b[index]);
  }

  function shuffledForLevel(level) {
    if (!level || !Array.isArray(level.cubes)) return [];
    if (level.cubes.length < 2) return [...level.cubes];
    let mixed = shuffle(level.cubes);
    let tries = 0;
    while (sameOrder(mixed, level.cubes) && tries < 12) {
      mixed = shuffle(level.cubes);
      tries += 1;
    }
    if (sameOrder(mixed, level.cubes)) {
      mixed = [...level.cubes.slice(1), level.cubes[0]];
    }
    return mixed;
  }

  function persistProgress(state) {
    try {
      const studentId = getSessionId();
      if (!studentId) return;
      const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
      progress[studentId] = progress[studentId] || {};
      progress[studentId][TARGET_GAME] = {
        ok: state.finished,
        score: Math.max(1, Math.min(10, Math.round(totalScore(state) / 12))),
        c: ["C1", "C2"],
        msg: "Organizaste versos para construir una oda breve.",
        topicId: "oda"
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {}
  }

  function baseState() {
    return {
      levelIndex: 0,
      selected: [[], [], []],
      bank: [null, null, null],
      checked: false,
      scores: [0, 0, 0],
      feedback: {
        type: "",
        title: "Construye la oda",
        text: "Selecciona los cubos en el orden correcto y luego presiona Verificar."
      },
      finished: false
    };
  }

  function ensureBank(state) {
    if (!state.bank[state.levelIndex]) {
      state.bank[state.levelIndex] = shuffledForLevel(LEVELS[state.levelIndex]);
    }
    return state.bank[state.levelIndex];
  }

  function mount() {
    renameActivityCard();
    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    if (!card || card.dataset.oda6SimpleReady === "1") return;
    card.dataset.oda6SimpleReady = "1";

    const title = card.querySelector(".play-top h3");
    const text = card.querySelector(".play-top .muted-main");
    const board = card.querySelector(".game-board");
    const actionRow = card.querySelector(".action-row");
    if (!board || !actionRow) return;

    if (title && title.textContent !== "6. Cubos 3D") title.textContent = "6. Cubos 3D";
    if (text && text.textContent !== "Ordena versos para construir una oda breve con inicio emotivo, descripcion, lenguaje poetico y cierre.") text.textContent = "Ordena versos para construir una oda breve con inicio emotivo, descripcion, lenguaje poetico y cierre.";

    clearLegacyFeedback(card);
    card._oda6State = baseState();
    render(card, board, actionRow);
  }

  function render(card, board, actionRow) {
    clearLegacyFeedback(card);
    const state = card._oda6State || baseState();
    card._oda6State = state;

    if (state.finished) {
      renderFinal(card, board, actionRow, state);
      return;
    }

    const level = LEVELS[state.levelIndex];
    const selected = state.selected[state.levelIndex] || [];
    const selectedSet = new Set(selected);
    const checked = state.checked;
    const cubes = ensureBank(state);

    board.innerHTML = `
      <section class="radial-cubes-app oda-cubes-app">
        <div class="radial-fill-topbar">
          <article class="radial-fill-stat">
            <div class="radial-kicker">Nivel</div>
            <strong>${level.title}</strong>
            <span>${level.subtitle}</span>
          </article>
          <article class="radial-fill-stat">
            <div class="radial-kicker">Puntos acumulados</div>
            <strong>${totalScore(state)}</strong>
            <span>Maximo 40 por nivel</span>
          </article>
          <article class="radial-fill-stat">
            <div class="radial-kicker">Meta</div>
            <strong>${selected.length}/4</strong>
            <span>versos elegidos</span>
          </article>
        </div>

        <section class="radial-fill-help">
          <div>
            <div class="radial-kicker">Como jugar</div>
            <p>${level.prompt}</p>
          </div>
          <button class="real-ghost" type="button" data-oda6-hint="1">Pista</button>
        </section>

        <section class="radial-cubes-stage">
          <div class="instruction-chip">Ordena la oda en cuatro pasos</div>
          <div class="oda-cubes-layout">
            <div class="radial-cubes-slots">
              ${level.labels.map((label, index) => `
                <button class="radial-cubes-slot ${selected[index] ? "filled" : ""}" type="button" data-oda6-slot="${index}">
                  <span class="slot-label">${label}</span>
                  <span class="slot-value">${selected[index] || "Selecciona un cubo"}</span>
                </button>
              `).join("")}
            </div>

            <div class="radial-cubes-bank">
              ${cubes.map((cube, index) => `
                <button class="radial-cube-card ${selectedSet.has(cube) ? "placed" : ""} tone-${index % 5}" type="button" data-oda6-cube="${cube}" ${selectedSet.has(cube) ? "disabled" : ""}>
                  <span class="cube-face cube-front">${cube}</span>
                </button>
              `).join("")}
            </div>
          </div>
        </section>

        <section class="radial-fill-feedback ${state.feedback.type || ""}">
          <div class="radial-kicker">Retroalimentacion</div>
          <strong>${state.feedback.title}</strong>
          <p>${state.feedback.text}</p>
        </section>
      </section>`;

    actionRow.innerHTML = `
      <button class="real-ghost" type="button" data-oda6-reset="1">Reintentar</button>
      <button class="real-action" type="button" data-oda6-check="1" ${selected.length === 4 ? "" : "disabled"}>Verificar</button>
      <button class="real-action ${checked ? "" : "radial-disabled"}" type="button" data-oda6-next="1" ${checked ? "" : "disabled"}>${state.levelIndex === LEVELS.length - 1 ? "Finalizar" : "Siguiente nivel"}</button>`;

    bind(card, board, actionRow);
  }

  function renderFinal(card, board, actionRow, state) {
    board.innerHTML = `
      <section class="radial-final-screen radial-cubes-final">
        <div class="radial-kicker">Actividad completada</div>
        <h3>Terminaste Cubos 3D</h3>
        <p>Puntuacion total: <strong>${totalScore(state)}</strong></p>
        <p>${totalScore(state) >= 80 ? "Muy buen trabajo construyendo odas." : "Sigue practicando el orden de los versos poeticos."}</p>
      </section>`;

    actionRow.innerHTML = `
      <button class="real-action" type="button" data-oda6-replay="1">Volver a jugar</button>`;

    actionRow.querySelector("[data-oda6-replay]")?.addEventListener("click", () => {
      card._oda6State = baseState();
      render(card, card.querySelector(".game-board"), actionRow);
    });
  }

  function buildHint(levelIndex) {
    const hints = [
      "Recuerda que la oda inicia expresando admiracion.",
      "Despues se describen cualidades.",
      "Luego se usa lenguaje poetico.",
      "Al final se cierra con emocion."
    ];
    return hints[levelIndex] || hints[0];
  }

  function bind(card, board, actionRow) {
    const state = card._oda6State;
    const level = LEVELS[state.levelIndex];

    board.querySelectorAll("[data-oda6-cube]").forEach((button) => {
      button.addEventListener("click", () => {
        if (state.checked) return;
        const cube = button.dataset.oda6Cube;
        if (!cube) return;
        const current = state.selected[state.levelIndex];
        if (current.length >= 4) return;
        state.selected[state.levelIndex] = [...current, cube];
        state.feedback = {
          type: "",
          title: "Cubo seleccionado",
          text: "Sigue ordenando los versos hasta completar la oda."
        };
        render(card, card.querySelector(".game-board"), actionRow);
      });
    });

    board.querySelectorAll("[data-oda6-slot]").forEach((button) => {
      button.addEventListener("click", () => {
        if (state.checked) return;
        const slotIndex = Number(button.dataset.oda6Slot);
        const current = [...state.selected[state.levelIndex]];
        if (!current[slotIndex]) return;
        current.splice(slotIndex, 1);
        state.selected[state.levelIndex] = current;
        state.feedback = {
          type: "",
          title: "Cubo retirado",
          text: "Puedes colocarlo otra vez o elegir otro verso."
        };
        render(card, card.querySelector(".game-board"), actionRow);
      });
    });

    board.querySelector("[data-oda6-hint]")?.addEventListener("click", () => {
      state.feedback = {
        type: "",
        title: "Pista",
        text: buildHint(state.levelIndex)
      };
      render(card, card.querySelector(".game-board"), actionRow);
    });

    actionRow.querySelector("[data-oda6-reset]")?.addEventListener("click", () => {
      state.selected[state.levelIndex] = [];
      state.bank[state.levelIndex] = shuffledForLevel(level);
      state.checked = false;
      state.scores[state.levelIndex] = 0;
      state.feedback = {
        type: "",
        title: "Nivel reiniciado",
        text: "Vuelve a ordenar los versos desde el inicio emotivo hasta el cierre."
      };
      render(card, card.querySelector(".game-board"), actionRow);
    });

    actionRow.querySelector("[data-oda6-check]")?.addEventListener("click", () => {
      const chosen = state.selected[state.levelIndex];
      const correct = level.correct;
      let score = 0;
      let errors = 0;

      for (let i = 0; i < 4; i += 1) {
        if (chosen[i] === correct[i]) {
          score += 10;
        } else {
          errors += 1;
        }
      }

      if (errors > 0) {
        score = Math.max(0, score - 5);
      }

      state.checked = true;
      state.scores[state.levelIndex] = score;
      if (errors === 0) {
        state.feedback = {
          type: "success",
          title: "Correcto",
          text: "Ordenaste la oda correctamente. Ya identificas su estructura."
        };
      } else {
        state.feedback = {
          type: "error",
          title: "Por revisar",
          text: `${buildHint(state.levelIndex)} Revisa el orden de los versos y vuelve a leer cada cubo.`
        };
      }
      persistProgress(state);
      render(card, card.querySelector(".game-board"), actionRow);
    });

    actionRow.querySelector("[data-oda6-next]")?.addEventListener("click", () => {
      if (!state.checked) return;
      if (state.levelIndex === LEVELS.length - 1) {
        state.finished = true;
      } else {
        state.levelIndex += 1;
        ensureBank(state);
        state.checked = false;
        state.feedback = {
          type: "",
          title: "Siguiente nivel",
          text: "Ahora organiza una nueva oda con mayor atencion al sentido poetico."
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
