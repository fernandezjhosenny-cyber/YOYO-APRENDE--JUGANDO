(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const TARGET_GAME = "oda-8";
  const SESSION_KEY = "yoyo_rg_x";
  const PROGRESS_KEY = "yoyo_rg_p";

  const LEVELS = [
    {
      title: "Nivel 1",
      subtitle: "Basico",
      size: 9,
      hint: "Busca palabras relacionadas con el poema. Tambien pueden ir en diagonal.",
      words: [
        { label: "ODA", note: "⭐ Es un poema que expresa admiracion." },
        { label: "POEMA", note: "📖 Es un texto literario escrito en versos." },
        { label: "VERSO", note: "💖 Es cada linea de un poema." },
        { label: "RIMA", note: "⭐ Repite sonidos al final de los versos." },
        { label: "AUTOR", note: "📖 Es la persona que escribe el poema." }
      ]
    },
    {
      title: "Nivel 2",
      subtitle: "Lenguaje poetico",
      size: 15,
      hint: "Recuerda que las palabras pueden ir en horizontal, vertical o diagonal.",
      words: [
        { label: "METAFORA", note: "Comparacion sin usar la palabra como." },
        { label: "COMPARACION", note: "Relaciona dos ideas usando la palabra como." },
        { label: "PERSONIFICACION", note: "Da acciones humanas a objetos o ideas." },
        { label: "ADJETIVO", note: "Palabra que expresa cualidades." },
        { label: "EMOCION", note: "Sentimiento que transmite el poema." }
      ]
    },
    {
      title: "Nivel 3",
      subtitle: "Creatividad y produccion",
      size: 12,
      hint: "Busca palabras de la oda relacionadas con admiracion, expresion y recitacion.",
      words: [
        { label: "ADMIRACION", note: "Sentimiento de aprecio." },
        { label: "ALABANZA", note: "Expresion positiva hacia alguien o algo." },
        { label: "SENTIMIENTO", note: "Emocion que comunica el poema." },
        { label: "LIRICO", note: "Se relaciona con la voz del poema." },
        { label: "OBJETO", note: "Es aquello que se alaba en la oda." },
        { label: "DECLAMAR", note: "Recitar un poema con expresion." }
      ]
    }
  ];

  const LETTERS = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
  let observerBound = false;

  function renameActivityCard() {
    app.querySelectorAll(`[data-oa="${TARGET_GAME}"]`).forEach((button) => {
      const heading = button.querySelector("h4");
      const copy = button.querySelector("p");
      if (heading && heading.textContent !== "8. Sopa de palabras") {
        heading.textContent = "8. Sopa de palabras";
      }
      if (copy && copy.textContent !== "Encuentra palabras de la oda y descubre su significado.") {
        copy.textContent = "Encuentra palabras de la oda y descubre su significado.";
      }
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

  function normalize(word) {
    return String(word)
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-ZÑ]/g, "");
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function samePath(a, b) {
    return a.length === b.length && a.every((item, index) => item === b[index]);
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
        score: Math.max(1, Math.min(10, Math.round(totalScore(state) / 18))),
        c: ["C1", "C2"],
        msg: "Encontraste palabras de la oda y comprendiste su significado.",
        topicId: "oda"
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {}
  }

  function buildPuzzle(level) {
    const normalizedWords = level.words.map((item) => ({
      ...item,
      normalized: normalize(item.label)
    }));
    const size = Math.max(level.size, ...normalizedWords.map((item) => item.normalized.length));
    const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => ""));
    const placements = [];
    const directions = [
      [1, 0],
      [0, 1],
      [1, 1],
      [-1, 1]
    ];

    normalizedWords.forEach((item, wordIndex) => {
      let placed = false;
      const dirs = shuffle(directions);

      for (let attempt = 0; attempt < 320 && !placed; attempt += 1) {
        const [dx, dy] = dirs[attempt % dirs.length];
        const startCol = random(dx === -1 ? item.normalized.length - 1 : 0, dx === 1 ? size - item.normalized.length : size - 1);
        const startRow = random(0, dy === 1 ? size - item.normalized.length : size - 1);
        const cells = [];
        let valid = true;

        for (let index = 0; index < item.normalized.length; index += 1) {
          const col = startCol + dx * index;
          const row = startRow + dy * index;
          const current = grid[row]?.[col];
          if (current === undefined || (current && current !== item.normalized[index])) {
            valid = false;
            break;
          }
          cells.push({
            row,
            col,
            letter: item.normalized[index],
            key: `${row}-${col}`
          });
        }

        if (!valid) continue;

        cells.forEach((cell) => {
          grid[cell.row][cell.col] = cell.letter;
        });

        placements.push({
          label: item.label,
          normalized: item.normalized,
          note: item.note,
          tone: wordIndex % 4,
          path: cells.map((cell) => cell.key),
          reversePath: [...cells].reverse().map((cell) => cell.key)
        });
        placed = true;
      }
    });

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (!grid[row][col]) {
          grid[row][col] = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        }
      }
    }

    return { size, grid, placements };
  }

  function baseState() {
    return {
      levelIndex: 0,
      found: [[], [], []],
      scores: [0, 0, 0],
      hints: [0, 0, 0],
      selection: [],
      hintCell: "",
      puzzles: [null, null, null],
      finished: false,
      feedback: {
        type: "",
        title: "Busca palabras de la oda",
        text: "Selecciona las letras en orden y luego presiona Verificar."
      }
    };
  }

  function ensurePuzzle(state) {
    if (!state.puzzles[state.levelIndex]) {
      state.puzzles[state.levelIndex] = buildPuzzle(LEVELS[state.levelIndex]);
    }
    return state.puzzles[state.levelIndex];
  }

  function mount() {
    renameActivityCard();
    const card = app.querySelector(`.play-card[data-g="${TARGET_GAME}"]`);
    if (!card || card.dataset.oda8Ready === "1") return;
    card.dataset.oda8Ready = "1";

    const title = card.querySelector(".play-top h3");
    const text = card.querySelector(".play-top .muted-main");
    const board = card.querySelector(".game-board");
    const actionRow = card.querySelector(".action-row");
    if (!board || !actionRow) return;

    if (title && title.textContent !== "8. Sopa de palabras") {
      title.textContent = "8. Sopa de palabras";
    }
    if (text && text.textContent !== "Encuentra palabras relacionadas con la oda y comprende su significado.") {
      text.textContent = "Encuentra palabras relacionadas con la oda y comprende su significado.";
    }

    clearLegacyFeedback(card);
    card._oda8State = baseState();
    render(card, board, actionRow);
  }

  function render(card, board, actionRow) {
    clearLegacyFeedback(card);
    const state = card._oda8State || baseState();
    card._oda8State = state;

    if (state.finished) {
      renderFinal(card, board, actionRow, state);
      return;
    }

    const level = LEVELS[state.levelIndex];
    const puzzle = ensurePuzzle(state);
    const found = new Set(state.found[state.levelIndex] || []);
    const selection = state.selection || [];
    const activeWord = selection.map((cell) => cell.letter).join("");
    const foundCount = found.size;
    const toneMap = {};

    puzzle.placements.forEach((placement) => {
      if (found.has(placement.label)) {
        placement.path.forEach((key) => {
          toneMap[key] = `found-tone-${placement.tone}`;
        });
      }
    });

    board.innerHTML = `
      <section class="radial-wordsearch-app oda-wordsearch-app">
        <div class="radial-fill-topbar">
          <article class="radial-fill-stat">
            <div class="radial-kicker">Nivel</div>
            <strong>${level.title}</strong>
            <span>${level.subtitle}</span>
          </article>
          <article class="radial-fill-stat">
            <div class="radial-kicker">Puntaje</div>
            <strong>${totalScore(state)}</strong>
            <span>+10 por palabra</span>
          </article>
          <article class="radial-fill-stat">
            <div class="radial-kicker">Encontradas</div>
            <strong>${foundCount}/${level.words.length}</strong>
            <span>${state.hints[state.levelIndex] || 0} pistas usadas</span>
          </article>
        </div>

        <section class="radial-fill-help">
          <div>
            <div class="radial-kicker">Como jugar</div>
            <p>Busca palabras de la oda. Pueden ir en horizontal, vertical o diagonal.</p>
          </div>
          <div class="instruction-chip">Palabra en curso: ${activeWord || "elige letras"}</div>
        </section>

        <section class="radial-wordsearch-stage">
          <div class="radial-wordsearch-layout">
            <div class="radial-wordsearch-board">
              <div class="radial-wordsearch-grid" style="grid-template-columns:repeat(${puzzle.size}, minmax(0,1fr));">
                ${puzzle.grid.map((rowLetters, rowIndex) => rowLetters.map((letter, colIndex) => {
                  const key = `${rowIndex}-${colIndex}`;
                  const isSelected = selection.some((cell) => cell.key === key);
                  const isFound = Boolean(toneMap[key]);
                  const isHint = state.hintCell === key;
                  return `
                    <button class="radial-wordsearch-cell ${isSelected ? "selected" : ""} ${isFound ? `found ${toneMap[key]}` : ""} ${isHint ? "hint" : ""}" type="button" data-oda8-cell="${key}" data-letter="${letter}">
                      ${letter}
                    </button>`;
                }).join("")).join("")}
              </div>
            </div>

            <aside class="radial-wordsearch-sidebar oda-wordsearch-colorcards">
              ${level.words.map((item, index) => `
                <article class="content-card oda-word-card tone-${index % 4} ${found.has(item.label) ? "found-tone" : ""}">
                  <strong>${item.label}</strong>
                  <p>${found.has(item.label) ? item.note : "Encuentrala en la sopa de letras."}</p>
                </article>
              `).join("")}
            </aside>
          </div>
        </section>

        <section class="radial-fill-feedback ${state.feedback.type || ""}">
          <div class="radial-kicker">Retroalimentacion</div>
          <strong>${state.feedback.title}</strong>
          <p>${state.feedback.text}</p>
        </section>
      </section>`;

    actionRow.innerHTML = `
      <button class="real-ghost" type="button" data-oda8-hint="1">Pista</button>
      <button class="real-ghost" type="button" data-oda8-reset="1">Reintentar</button>
      <button class="real-action" type="button" data-oda8-check="1" ${selection.length >= 2 ? "" : "disabled"}>Verificar</button>
      <button class="real-action ${foundCount === level.words.length ? "" : "radial-disabled"}" type="button" data-oda8-next="1" ${foundCount === level.words.length ? "" : "disabled"}>${state.levelIndex === LEVELS.length - 1 ? "Finalizar" : "Siguiente nivel"}</button>`;

    bind(card, board, actionRow);
  }

  function renderFinal(card, board, actionRow, state) {
    const score = totalScore(state);
    const result = score >= 150 ? "Excelente" : score >= 95 ? "Aprobado" : "Necesita mejorar";
    board.innerHTML = `
      <section class="radial-final-screen radial-wordsearch-final">
        <div class="radial-kicker">Actividad completada</div>
        <h3>Terminaste Sopa de palabras</h3>
        <p>Puntuacion total: <strong>${score}</strong></p>
        <p><strong>${result}</strong></p>
      </section>`;

    actionRow.innerHTML = `
      <button class="real-action" type="button" data-oda8-replay="1">Volver a jugar</button>`;

    actionRow.querySelector("[data-oda8-replay]")?.addEventListener("click", () => {
      card._oda8State = baseState();
      render(card, card.querySelector(".game-board"), actionRow);
    });
  }

  function bind(card, board, actionRow) {
    const state = card._oda8State;
    const level = LEVELS[state.levelIndex];
    const puzzle = ensurePuzzle(state);
    const found = new Set(state.found[state.levelIndex] || []);

    board.querySelectorAll("[data-oda8-cell]").forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.oda8Cell;
        const letter = button.dataset.letter;
        const currentIndex = state.selection.findIndex((cell) => cell.key === key);

        if (currentIndex >= 0) {
          state.selection = state.selection.slice(0, currentIndex);
        } else {
          state.selection = [...state.selection, { key, letter }];
        }

        state.hintCell = "";
        render(card, card.querySelector(".game-board"), actionRow);
      });
    });

    actionRow.querySelector("[data-oda8-hint]")?.addEventListener("click", () => {
      const nextPlacement = puzzle.placements.find((placement) => !found.has(placement.label));
      if (!nextPlacement) return;

      state.hints[state.levelIndex] += 1;
      state.hintCell = nextPlacement.path[0];
      state.feedback = {
        type: "",
        title: "Pista activada",
        text: `${level.hint} Prueba con la palabra ${nextPlacement.label}.`
      };
      render(card, card.querySelector(".game-board"), actionRow);
    });

    actionRow.querySelector("[data-oda8-reset]")?.addEventListener("click", () => {
      state.selection = [];
      state.hintCell = "";
      state.found[state.levelIndex] = [];
      state.scores[state.levelIndex] = 0;
      state.hints[state.levelIndex] = 0;
      state.puzzles[state.levelIndex] = buildPuzzle(level);
      state.feedback = {
        type: "",
        title: "Nivel reiniciado",
        text: "Vuelve a buscar las palabras con calma."
      };
      render(card, card.querySelector(".game-board"), actionRow);
    });

    actionRow.querySelector("[data-oda8-check]")?.addEventListener("click", () => {
      const path = state.selection.map((cell) => cell.key);
      const word = state.selection.map((cell) => cell.letter).join("");
      const anyPlacement = puzzle.placements.find((placement) => placement.normalized === word && (samePath(path, placement.path) || samePath(path, placement.reversePath)));

      state.hintCell = "";

      if (!anyPlacement) {
        state.scores[state.levelIndex] = Math.max(0, state.scores[state.levelIndex] - 5);
        state.feedback = {
          type: "error",
          title: "No coincide",
          text: "Esa ruta no forma una palabra valida de este nivel. Intenta de nuevo."
        };
        state.selection = [];
        persistProgress(state);
        render(card, card.querySelector(".game-board"), actionRow);
        return;
      }

      if (found.has(anyPlacement.label)) {
        state.feedback = {
          type: "",
          title: "Palabra ya encontrada",
          text: `Ya encontraste ${anyPlacement.label}. Busca otra palabra de la lista.`
        };
        state.selection = [];
        render(card, card.querySelector(".game-board"), actionRow);
        return;
      }

      state.found[state.levelIndex] = [...state.found[state.levelIndex], anyPlacement.label];
      state.scores[state.levelIndex] += 10;

      const completed = state.found[state.levelIndex].length === level.words.length;
      if (completed && state.hints[state.levelIndex] === 0) {
        state.scores[state.levelIndex] += 5;
      }

      state.feedback = {
        type: "success",
        title: `Encontraste ${anyPlacement.label}`,
        text: completed && state.hints[state.levelIndex] === 0
          ? `${anyPlacement.note} Terminaste el nivel sin pistas y ganaste 5 puntos extra.`
          : anyPlacement.note
      };

      state.selection = [];
      persistProgress(state);
      render(card, card.querySelector(".game-board"), actionRow);
    });

    actionRow.querySelector("[data-oda8-next]")?.addEventListener("click", () => {
      if (state.levelIndex === LEVELS.length - 1) {
        state.finished = true;
      } else {
        state.levelIndex += 1;
        state.selection = [];
        state.hintCell = "";
        state.feedback = {
          type: "",
          title: "Siguiente nivel",
          text: "Ahora encontraras palabras mas avanzadas de la oda."
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
